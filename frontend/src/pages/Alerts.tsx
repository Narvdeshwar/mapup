import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { toast } from 'react-toastify';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BellIcon, ArrowRightLeftIcon } from 'lucide-react';

export default function Alerts() {
  const queryClient = useQueryClient();
  const [geofenceId, setGeofenceId] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [eventType, setEventType] = useState('entry');

  const { data: geofencesData } = useQuery({ queryKey: ['geofences'], queryFn: () => fetchApi('/geofences') });
  const { data: vehiclesData } = useQuery({ queryKey: ['vehicles'], queryFn: () => fetchApi('/vehicles') });
  const { data: alertsData, isLoading } = useQuery({ queryKey: ['alerts'], queryFn: () => fetchApi('/alerts') });

  const createMutation = useMutation({
    mutationFn: (newAlert: any) => fetchApi('/alerts/configure', {
      method: 'POST',
      body: JSON.stringify(newAlert),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setGeofenceId('');
      setVehicleId('all');
      toast.success('Alert configured successfully', { hideProgressBar: true });
    },
    onError: () => toast.error('Failed to configure alert', { hideProgressBar: true }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geofenceId) {
      toast.error('Geofence is required', { hideProgressBar: true });
      return;
    }
    createMutation.mutate({
      geofence_id: geofenceId,
      vehicle_id: vehicleId === 'all' ? undefined : vehicleId,
      event_type: eventType,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Alert Rules</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Automated notifications for zone entries and exits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Side Form */}
        <div className="lg:col-span-4 h-full overflow-y-auto pr-2 pb-4">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-[#FBFBFC]">
              <h2 className="text-[14px] font-semibold text-slate-900">Create Rule</h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="geofence" className="text-[12px] font-medium text-slate-700">Target Geofence *</Label>
                  <Select value={geofenceId} onValueChange={setGeofenceId}>
                    <SelectTrigger id="geofence" className="h-8 text-[13px] shadow-none rounded focus:ring-1">
                      <SelectValue placeholder="-- Select Geofence --" />
                    </SelectTrigger>
                    <SelectContent>
                      {geofencesData?.geofences?.map((g: any) => (
                        <SelectItem key={g.id} value={g.id} className="text-[13px]">
                          <span className="font-medium text-slate-900">{g.name}</span> <span className="text-slate-500">({g.category.replace('_', ' ')})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="vehicle" className="text-[12px] font-medium text-slate-700">Target Vehicle</Label>
                  <Select value={vehicleId} onValueChange={setVehicleId}>
                    <SelectTrigger id="vehicle" className="h-8 text-[13px] shadow-none rounded focus:ring-1">
                      <SelectValue placeholder="-- All Vehicles --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[13px] font-medium text-slate-900">-- ALL VEHICLES --</SelectItem>
                      {vehiclesData?.vehicles?.map((v: any) => (
                        <SelectItem key={v.id} value={v.id} className="text-[13px]">
                          <span className="font-mono">{v.vehicle_number}</span> <span className="text-slate-500">({v.driver_name})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event" className="text-[12px] font-medium text-slate-700">Condition</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger id="event" className="h-8 text-[13px] shadow-none rounded focus:ring-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry" className="text-[13px]">Trigger on Entry</SelectItem>
                      <SelectItem value="exit" className="text-[13px]">Trigger on Exit</SelectItem>
                      <SelectItem value="both" className="text-[13px]">Trigger on Entry & Exit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={createMutation.isPending} className="w-full mt-2 h-8 text-[13px] bg-slate-900 hover:bg-slate-800 text-white rounded">
                  {createMutation.isPending ? 'Creating...' : 'Create Rule'}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side Rules Table */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 rounded-lg bg-white shadow-sm">
            
            <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-[#FBFBFC] shrink-0">
               <h2 className="text-[14px] font-semibold text-slate-900">Active Rules</h2>
            </div>

            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader className="bg-white sticky top-0 z-10 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[120px]">Condition</TableHead>
                    <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Geofence</TableHead>
                    <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Target Vehicle</TableHead>
                    <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-[13px] text-slate-500">Loading rules...</TableCell>
                    </TableRow>
                  ) : alertsData?.alerts?.length ? (
                    alertsData.alerts.map((a: any) => {
                      const g = geofencesData?.geofences?.find((geo: any) => geo.id === a.geofence_id);
                      const v = vehiclesData?.vehicles?.find((veh: any) => veh.id === a.vehicle_id);
                      return (
                        <TableRow key={a.id} className="hover:bg-slate-50/60 border-b border-slate-100 transition-colors">
                          <TableCell className="py-2.5">
                            <span className="text-[13px] font-medium text-slate-700 capitalize">
                              {a.event_type}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 font-medium text-[13px] text-slate-900">
                            {g ? g.name : a.geofence_id}
                          </TableCell>
                          <TableCell className="py-2.5">
                            {v ? (
                              <span className="font-mono text-[13px] text-slate-900">{v.vehicle_number}</span>
                            ) : (
                              <span className="text-[13px] text-slate-500">All Vehicles</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 text-right pr-4">
                             <div className="inline-flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                              <span className="text-[12px] font-medium text-slate-700 capitalize">{a.status}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center">
                          <BellIcon className="h-6 w-6 text-slate-300 mb-3" />
                          <p className="text-[13px] text-slate-500">No rules configured yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="border-t border-slate-200 bg-[#FBFBFC] px-4 py-2 flex items-center justify-between shrink-0">
              <p className="text-[12px] text-slate-500">{alertsData?.alerts?.length || 0} active rules</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
