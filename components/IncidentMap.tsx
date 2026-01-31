
import React, { useEffect, useRef, memo } from 'react';
import { ProcessedIncident, Severity } from '../types';

interface IncidentMapProps {
  incidents: ProcessedIncident[];
  focusedIncident?: ProcessedIncident;
}

export const IncidentMap = memo(({ incidents, focusedIncident }: IncidentMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markers = useRef<Map<string, any>>(new Map());
  const trafficLayer = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !googleMap.current && (window as any).google) {
      googleMap.current = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 13,
        styles: [
          { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
          { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
          { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121212" }] },
          { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
          { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });

      trafficLayer.current = new (window as any).google.maps.TrafficLayer();
      trafficLayer.current.setMap(googleMap.current);
    }
  }, []);

  useEffect(() => {
    if (!googleMap.current || !(window as any).google) return;

    const currentIds = new Set(incidents.map(i => i.id));
    markers.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markers.current.delete(id);
      }
    });

    incidents.forEach(inc => {
      let marker = markers.current.get(inc.id);
      const isFocused = focusedIncident?.id === inc.id;
      const markerColor = inc.severity === Severity.CRITICAL ? '#ef4444' : inc.severity === Severity.MAJOR ? '#f59e0b' : '#3b82f6';
      
      if (!marker) {
        marker = new (window as any).google.maps.Marker({
          position: inc.coords,
          map: googleMap.current,
          title: inc.summary,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeWeight: isFocused ? 4 : 2,
            strokeColor: isFocused ? '#ffffff' : '#000000',
            scale: isFocused ? 12 : 8
          },
          optimized: true // Performance optimization
        });
        markers.current.set(inc.id, marker);
      } else {
        marker.setIcon({
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeWeight: isFocused ? 4 : 2,
          strokeColor: isFocused ? '#ffffff' : '#000000',
          scale: isFocused ? 12 : 8
        });
        marker.setZIndex(isFocused ? 1000 : 1);
      }
    });
  }, [incidents, focusedIncident]);

  useEffect(() => {
    if (focusedIncident && googleMap.current) {
      googleMap.current.panTo(focusedIncident.coords);
    }
  }, [focusedIncident]);

  return (
    <div className="relative flex-1 bg-zinc-900 overflow-hidden">
      <div 
        ref={mapRef} 
        className="w-full h-full"
        role="application"
        aria-label="Urban incident mapping grid with real-time traffic overlay"
      />
      
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 pointer-events-none">
        <div className="bg-zinc-950/90 backdrop-blur-xl p-5 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.6)] animate-pulse"></span>
            <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">Active_Critical</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">Major_Response</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">Standard_Alert</span>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Traffic_Layer: ON</span>
          </div>
        </div>
      </div>
    </div>
  );
});
IncidentMap.displayName = 'IncidentMap';
