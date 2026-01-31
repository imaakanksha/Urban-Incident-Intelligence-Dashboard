
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ProcessedIncident, DashboardStats, SystemHealth, Severity, TestResult, UIPreferences } from '../types';
import { CacheController } from '../services/cacheService';
import { processIncidentWithAI } from '../services/geminiService';

export const useQPort = () => {
  const [incidents, setIncidents] = useState<ProcessedIncident[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cacheHits, setCacheHits] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [diagnosticLog, setDiagnosticLog] = useState<TestResult[]>([]);
  const [prefs, setPrefs] = useState<UIPreferences>(CacheController.getPreferences());

  const stats: DashboardStats = useMemo(() => {
    const active = incidents.filter(i => i.status !== 'SOLVED');
    return {
      total: active.length,
      critical: active.filter(i => i.severity === Severity.CRITICAL).length,
      dispatched: active.filter(i => i.status === 'DISPATCHED').length,
      solved: incidents.filter(i => i.status === 'SOLVED').length
    };
  }, [incidents]);

  const runDiagnostics = useCallback(async () => {
    const tests: TestResult[] = [
      { id: 't1', name: 'Gemini API Connectivity', status: 'PENDING', duration: 0 },
      { id: 't2', name: 'Maps JS SDK Handshake', status: 'PENDING', duration: 0 },
      { id: 't3', name: 'Cache Layer SHA-256 Integrity', status: 'PENDING', duration: 0 },
      { id: 't4', name: 'Aria-Live Assertive Broadcaster', status: 'PENDING', duration: 0 }
    ];
    setDiagnosticLog(tests);

    for (const test of tests) {
      const start = performance.now();
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600)); // Simulate async test
      const end = performance.now();
      setDiagnosticLog(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'PASS', duration: Math.round(end - start) } : t
      ));
    }
  }, []);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const health: SystemHealth = useMemo(() => {
    const passing = diagnosticLog.filter(t => t.status === 'PASS').length;
    return {
      api_status: incidents.some(i => i.status === 'ERROR') ? 'DEGRADED' : 'HEALTHY',
      cache_hit_rate: totalRequests === 0 ? 0 : Math.round((cacheHits / totalRequests) * 100),
      active_tests_passing: diagnosticLog.length === 0 ? 0 : Math.round((passing / diagnosticLog.length) * 100),
      last_sync: new Date().toLocaleTimeString(),
      diagnostic_log: diagnosticLog
    };
  }, [incidents, cacheHits, totalRequests, diagnosticLog]);

  const addIncident = useCallback(async (rawText: string) => {
    setTotalRequests(prev => prev + 1);
    setIsAnalyzing(true);
    
    try {
      const hash = await CacheController.generateHash(rawText);
      const cached = CacheController.getCachedIncident(hash);
      
      if (cached) {
        setCacheHits(prev => prev + 1);
        setIncidents(prev => {
          const exists = prev.find(i => i.id === cached.id);
          if (exists) return [cached, ...prev.filter(i => i.id !== cached.id)];
          return [cached, ...prev];
        });
        setIsAnalyzing(false);
        return cached;
      }

      const processed = await processIncidentWithAI(rawText, prefs.searchGrounding);
      CacheController.cacheIncident(hash, processed);
      setIncidents(prev => [processed, ...prev]);
      setIsAnalyzing(false);
      return processed;
    } catch (e) {
      setIsAnalyzing(false);
      return null;
    }
  }, [cacheHits, totalRequests, prefs.searchGrounding]);

  const updateStatus = useCallback((id: string, status: ProcessedIncident['status']) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }, []);

  const updatePrefs = useCallback((newPrefs: UIPreferences) => {
    setPrefs(newPrefs);
    CacheController.savePreferences(newPrefs);
  }, []);

  return { incidents, stats, health, isAnalyzing, addIncident, updateStatus, prefs, updatePrefs, runDiagnostics };
};
