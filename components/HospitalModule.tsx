
import React, { useMemo } from 'react';
import { Hospital, Coordinates } from '../types';

const MOCK_HOSPITALS: Hospital[] = [
  { id: 'H1', name: 'Zuckerberg SF General', coords: { lat: 37.7557, lng: -122.4046 }, status: 'AVAILABLE', beds: 42 },
  { id: 'H2', name: 'UCSF Medical Center', coords: { lat: 37.7631, lng: -122.4582 }, status: 'FULL', beds: 0 },
  { id: 'H3', name: 'Saint Francis Memorial', coords: { lat: 37.7894, lng: -122.4153 }, status: 'CRITICAL', beds: 3 },
  { id: 'H4', name: 'CPMC Van Ness', coords: { lat: 37.7853, lng: -122.4227 }, status: 'AVAILABLE', beds: 18 }
];

interface Props {
  incidentCoords: Coordinates;
}

export const HospitalModule: React.FC<Props> = ({ incidentCoords }) => {
  const hospitals = useMemo(() => {
    return MOCK_HOSPITALS.map(h => {
      let distance = 0;
      if ((window as any).google && (window as any).google.maps) {
        const p1 = new (window as any).google.maps.LatLng(incidentCoords.lat, incidentCoords.lng);
        const p2 = new (window as any).google.maps.LatLng(h.coords.lat, h.coords.lng);
        distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1609.34;
      }
      return { ...h, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [incidentCoords]);

  return (
    <div className="mt-6 border-t border-zinc-800/50 pt-6">
      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Tactical Asset: Medical Availability</h4>
      <div className="space-y-2.5">
        {hospitals.slice(0, 3).map(h => (
          <div key={h.id} className="flex items-center justify-between bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50 group hover:border-zinc-600 transition-colors">
            <div className="flex flex-col">
              <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none mb-1 group-hover:text-yellow-400 transition-colors">
                {h.name}
              </p>
              <div className="flex items-center gap-2">
                 <span className="text-[9px] font-mono text-zinc-500 uppercase">Dist: {h.distance.toFixed(1)}mi</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest border
                ${h.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                  h.status === 'CRITICAL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                  'bg-red-500/10 text-red-500 border-red-500/20'}
              `}>
                {h.status === 'AVAILABLE' ? `${h.beds} BEDS` : h.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
