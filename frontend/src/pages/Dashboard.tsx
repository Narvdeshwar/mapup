import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents, ZoomControl } from 'react-leaflet';
import { toast } from 'react-toastify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadarIcon, NavigationIcon } from 'lucide-react';

export default function Dashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const ws = useRef<WebSocket | null>(null);

  const { data: geofencesData } = useQuery({ queryKey: ['geofences'], queryFn: () => fetchApi('/geofences') });
  const { data: vehiclesData } = useQuery({ queryKey: ['vehicles'], queryFn: () => fetchApi('/vehicles') });

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080/ws/alerts');
    
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const isEntry = msg.event_type === 'entry';
      toast(
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-[13px] text-slate-900">{isEntry ? 'Entry Detected' : 'Exit Detected'}</span>
          <span className="text-[12px] text-slate-600">
            <span className="font-mono text-slate-800">{msg.vehicle.vehicle_number}</span> {isEntry ? 'entered' : 'exited'} <span className="font-medium text-slate-800">{msg.geofence.geofence_name}</span>
          </span>
        </div>,
        { autoClose: 6000, hideProgressBar: true }
      );
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const locationMutation = useMutation({
    mutationFn: (location: any) => fetchApi('/vehicles/location', {
      method: 'POST',
      body: JSON.stringify(location),
    }),
    onSuccess: (data) => {
      toast.success(`Location updated. In ${data.current_geofences?.length || 0} zones.`, { autoClose: 2000, hideProgressBar: true });
    },
    onError: () => toast.error('Failed to update location', { hideProgressBar: true }),
  });

  const handleMapClick = (e: any) => {
    if (!selectedVehicle) {
      toast.info('Please select a vehicle from the simulator panel first.', { hideProgressBar: true });
      return;
    }
    locationMutation.mutate({
      vehicle_id: selectedVehicle,
      latitude: e.latlng.lat,
      longitude: e.latlng.lng,
      timestamp: new Date().toISOString(),
    });
  };

  function MapInteraction() {
    useMapEvents({ click: handleMapClick });
    return null;
  }

  return (
    <div className="flex-1 w-full h-full relative rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex flex-col">
      {/* Map Container - Absolute inset */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={[37.7749, -122.4194]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <ZoomControl position="bottomright" />
          <MapInteraction />
          
          {geofencesData?.geofences?.map((g: any) => (
            g.coordinates && Array.isArray(g.coordinates) && g.coordinates.length > 0 ? (
              <Polygon key={g.id} positions={g.coordinates} pathOptions={{ color: '#0f172a', weight: 1, fillOpacity: 0.05, fillColor: '#0f172a' }}>
                <Popup className="font-sans" closeButton={false}>
                  <div className="px-1 py-0.5">
                    <div className="font-semibold text-[13px] text-slate-900 leading-tight">{g.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{g.category.replace('_', ' ')}</div>
                  </div>
                </Popup>
              </Polygon>
            ) : null
          ))}
        </MapContainer>
      </div>

      {/* Floating Panel Layer */}
      <div className="relative z-10 p-4 pointer-events-none flex justify-between items-start h-full">
        
        {/* Left Side Header */}
        <div className="pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-md shadow-sm border border-slate-200 flex items-center gap-2.5">
            <div className="bg-slate-100 p-1.5 rounded">
              <RadarIcon className="h-4 w-4 text-slate-700" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold tracking-tight text-slate-900 leading-none">Live Radar</h1>
              <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Real-time Tracking</p>
            </div>
          </div>
        </div>

        {/* Right Side Simulator Control Panel */}
        <div className="w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm pointer-events-auto flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-[#FBFBFC] flex items-center gap-2">
            <NavigationIcon className="h-3.5 w-3.5 text-slate-500" />
            <h2 className="text-[13px] font-semibold tracking-tight text-slate-900">Location Simulator</h2>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="text-[12px] text-slate-600 leading-relaxed">
              Select a vehicle and click anywhere on the map to broadcast its GPS coordinates.
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vehicle-select" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Vehicle</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger id="vehicle-select" className="w-full h-8 text-[13px] shadow-none bg-white border-slate-200 focus:ring-1">
                  <SelectValue placeholder="-- Select Vehicle --">
                    {selectedVehicle && vehiclesData?.vehicles 
                      ? vehiclesData.vehicles.find((v: any) => v.id === selectedVehicle)?.vehicle_number 
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {vehiclesData?.vehicles?.map((v: any) => (
                    <SelectItem key={v.id} value={v.id} className="text-[13px] cursor-pointer">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-mono font-medium text-slate-900">{v.vehicle_number}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
