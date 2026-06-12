import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, ZoomControl } from 'react-leaflet';
import { toast } from 'react-toastify';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapIcon, EraserIcon, CheckIcon, MapPinIcon } from 'lucide-react';

export default function Geofences() {
  const queryClient = useQueryClient();
  const [points, setPoints] = useState<[number, number][]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('delivery_zone');

  const { data: geofencesData } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => fetchApi('/geofences'),
  });

  const createMutation = useMutation({
    mutationFn: (newGeo: any) => fetchApi('/geofences', {
      method: 'POST',
      body: JSON.stringify(newGeo),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      setPoints([]);
      setName('');
      toast.success('Geofence created successfully', { hideProgressBar: true });
    },
    onError: () => toast.error('Failed to create geofence', { hideProgressBar: true }),
  });

  const handleMapClick = (e: any) => {
    setPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
  };

  function MapClickHandler() {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  }

  const handleCreate = () => {
    if (points.length < 3) {
      toast.error('At least 3 points are required to form a polygon', { hideProgressBar: true });
      return;
    }
    
    // Close the polygon
    const closedPoints = [...points, points[0]];

    createMutation.mutate({
      name,
      description: 'Created from map',
      category,
      coordinates: closedPoints,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Geofence Boundaries</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Draw and define operational zones for your fleet.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Side Control Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-4">
          
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-[#FBFBFC]">
              <h2 className="text-[14px] font-semibold text-slate-900">Create Boundary</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="gname" className="text-[12px] font-medium text-slate-700">Zone Name</Label>
                <Input id="gname" className="h-8 text-[13px] shadow-none rounded focus-visible:ring-1" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Downtown Sector A" />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="gcat" className="text-[12px] font-medium text-slate-700">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="gcat" className="h-8 text-[13px] shadow-none rounded focus:ring-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="delivery_zone" className="text-[13px]">Delivery Zone</SelectItem>
                    <SelectItem value="restricted_zone" className="text-[13px]">Restricted Zone</SelectItem>
                    <SelectItem value="toll_zone" className="text-[13px]">Toll Zone</SelectItem>
                    <SelectItem value="customer_area" className="text-[13px]">Customer Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-[#FBFBFC] px-3 py-2 rounded border border-slate-200 flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-600">Points Drawn</span>
                <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{points.length} / 3 min</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setPoints([])} className="flex-1 h-8 text-[13px] rounded shadow-none">
                  Clear
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending || !name || points.length < 3} 
                  className="flex-1 h-8 text-[13px] rounded bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Zone'}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm flex-1 flex flex-col min-h-[300px] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-[#FBFBFC] shrink-0">
              <h2 className="text-[14px] font-semibold text-slate-900">Active Zones</h2>
            </div>
            <div className="p-0 overflow-auto flex-1">
              <div className="divide-y divide-slate-100">
                {geofencesData?.geofences?.map((g: any) => (
                  <div key={g.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-3">
                    <div className="mt-0.5">
                      <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-slate-900">{g.name}</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">{g.category.replace('_', ' ')}</div>
                    </div>
                  </div>
                ))}
                {(!geofencesData?.geofences || geofencesData.geofences.length === 0) && (
                  <div className="p-8 text-center text-[13px] text-slate-500">
                    No active zones. Draw on the map to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Map */}
        <div className="lg:col-span-8 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative min-h-[500px]">
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
              <MapClickHandler />
              
              {points.length > 0 && (
                <Polygon positions={points} pathOptions={{ color: '#0f172a', weight: 2, fillOpacity: 0.1, fillColor: '#0f172a' }} />
              )}
              
              {points.map((p, i) => (
                <Marker key={i} position={p} />
              ))}

              {/* Render existing geofences as reference */}
              {geofencesData?.geofences?.map((g: any) => (
                g.coordinates && Array.isArray(g.coordinates) && g.coordinates.length > 0 ? (
                  <Polygon key={g.id} positions={g.coordinates} pathOptions={{ color: '#94a3b8', weight: 1, fillOpacity: 0.05, fillColor: '#94a3b8' }} />
                ) : null
              ))}
            </MapContainer>
          </div>
          
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded border border-slate-200 shadow-sm pointer-events-none">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Map Editor</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
