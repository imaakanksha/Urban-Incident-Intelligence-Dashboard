
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LiveIncidentSidebar } from './components/LiveIncidentSidebar';
import { IncidentMap } from './components/IncidentMap';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { StatsHub } from './components/StatsHub';
import { HospitalModule } from './components/HospitalModule';
import { SystemHealthMonitor } from './components/SystemHealthMonitor';
import { DiagnosticOverlay } from './components/DiagnosticOverlay';
import { ProcessedIncident } from './types';
import { useQPort } from './hooks/useQPort';

const INITIAL_DATA_HINTS = [
  "Major structure fire at 3rd and Market St. Multiple units in transit.",
  "Public transit vehicle collision near Van Ness. Traffic blocked.",
  "Water main break in Mission District. Street damage reported."
];

const App: React.FC = () => {
  const { incidents, stats, health, isAnalyzing, addIncident, updateStatus, prefs, updatePrefs } = useQPort();
  const [focusedIncident, setFocusedIncident] = useState<ProcessedIncident | undefined>();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  useEffect(() => {
    INITIAL_DATA_HINTS.forEach((hint, i) => {
      setTimeout(() => addIncident(hint), i * 1500);
    });
  }, [addIncident]);

  const handleManualReport = async (text: string) => {
    const result = await addIncident(text);
    if (result) setFocusedIncident(result);
  };

  const toggleHighContrast = () => {
    updatePrefs({ ...prefs, highContrast: !prefs.highContrast });
  };

  const toggleGrounding = () => {
    updatePrefs({ ...prefs, searchGrounding: !prefs.searchGrounding });
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 ${prefs.highContrast ? 'contrast-150 saturate-200' : ''}`}>
      <div className="fixed top-0 left-0 right-0 h-0.5 z-[150] bg-zinc-900">
        <div className={`h-full bg-red-600 transition-all duration-1000 ${stats.critical > 0 ? 'w-full animate-pulse opacity-100' : 'w-0 opacity-0'}`} />
      </div>

      <header className="fixed top-0 left-[400px] right-0 h-16 bg-zinc-950/95 backdrop-blur-3xl border-b border-zinc-800/80 flex items-center justify-between px-8 z-[100]">
        <div className="flex items-center gap-8">
          <StatsHub stats={stats} />
          <button onClick={() => setIsDiagnosticOpen(true)} className="hover:opacity-80 transition-opacity">
            <SystemHealthMonitor health={health} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleGrounding}
            aria-label="Toggle Google Search Grounding"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest focus-ring ${prefs.searchGrounding ? 'bg-blue-600/10 text-blue-400 border-blue-600/30' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${prefs.searchGrounding ? 'bg-blue-400 animate-pulse' : 'bg-zinc-700'}`} />
            Google_Search_Grounding: {prefs.searchGrounding ? 'ON' : 'OFF'}
          </button>

          <button 
            onClick={toggleHighContrast}
            aria-label="Toggle High Contrast"
            className={`p-2.5 rounded-xl border transition-all active:scale-95 focus-ring ${prefs.highContrast ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 000 14 7 7 0 000-14z"/></svg>
          </button>
        </div>
      </header>

      <LiveIncidentSidebar 
        incidents={incidents}
        onIncidentFocus={setFocusedIncident} 
        activeId={focusedIncident?.id}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      <main className="flex-1 relative pt-16 flex flex-col">
        <IncidentMap focusedIncident={focusedIncident} incidents={incidents.filter(i => i.status !== 'SOLVED')} />

        {focusedIncident && (
          <div className="absolute bottom-8 left-8 right-8 lg:left-auto lg:w-[540px] z-[120] animate-in slide-in-from-bottom-8 duration-300">
            <section className="bg-zinc-950/98 backdrop-blur-3xl border border-zinc-700/60 p-8 rounded-[3rem] shadow-2xl ring-2 ring-white/5">
              <header className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${focusedIncident.priority_score >= 8 ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-400 text-black'}`}>
                      PRIORITY_{focusedIncident.priority_score}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-500">{focusedIncident.id}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{focusedIncident.type}</h3>
                </div>
                <button onClick={() => setFocusedIncident(undefined)} className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-full transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </header>

              <div className="space-y-6">
                <p className="text-zinc-200 text-xl font-medium leading-tight selection:bg-yellow-400 selection:text-black">
                  {focusedIncident.summary}
                </p>

                {focusedIncident.grounding_sources && focusedIncident.grounding_sources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Grounding_Context:</p>
                    <div className="flex flex-wrap gap-2">
                      {focusedIncident.grounding_sources.map((source, idx) => (
                        <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-zinc-500 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
                          {source.title.slice(0, 30)}...
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <HospitalModule incidentCoords={focusedIncident.coords} />

                <footer className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => updateStatus(focusedIncident.id, 'DISPATCHED')}
                    disabled={focusedIncident.status === 'DISPATCHED'}
                    className={`py-5 font-black rounded-3xl transition-all shadow-xl focus-ring active:scale-95 ${focusedIncident.status === 'DISPATCHED' ? 'bg-zinc-800 text-zinc-500 opacity-50' : 'bg-white text-black hover:bg-yellow-400'}`}
                  >
                    {focusedIncident.status === 'DISPATCHED' ? 'ASSETS_COMMITTED' : 'EXECUTE_RESPONSE'}
                  </button>
                  <button 
                    onClick={() => updateStatus(focusedIncident.id, 'SOLVED')}
                    className="py-5 bg-zinc-900 hover:bg-red-950/50 text-white font-black rounded-3xl border border-zinc-800 transition-all shadow-xl focus-ring active:scale-95"
                  >
                    ARCHIVE_LOG
                  </button>
                </footer>
              </div>
            </section>
          </div>
        )}
      </main>

      {isReportModalOpen && (
        <ReportIncidentModal onClose={() => setIsReportModalOpen(false)} onSubmit={handleManualReport} />
      )}

      {isDiagnosticOpen && (
        <DiagnosticOverlay health={health} onClose={() => setIsDiagnosticOpen(false)} />
      )}

      <div aria-live="assertive" className="sr-only">
        {stats.critical > 0 && `SYSTEM ALERT: ${stats.critical} critical life-threat incidents detected.`}
      </div>
    </div>
  );
};

export default App;
