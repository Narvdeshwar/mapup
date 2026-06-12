import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { toast } from 'react-toastify';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TruckIcon, SearchIcon } from 'lucide-react';

export default function Vehicles() {
  const queryClient = useQueryClient();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleType, setVehicleType] = useState('truck');
  const [phone, setPhone] = useState('');

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => fetchApi('/vehicles'),
  });

  const createMutation = useMutation({
    mutationFn: (newVehicle: any) => fetchApi('/vehicles', {
      method: 'POST',
      body: JSON.stringify(newVehicle),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setVehicleNumber('');
      setDriverName('');
      setPhone('');
      toast.success('Vehicle registered successfully', { hideProgressBar: true });
    },
    onError: () => toast.error('Failed to register vehicle', { hideProgressBar: true }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      vehicle_number: vehicleNumber,
      driver_name: driverName,
      vehicle_type: vehicleType,
      phone,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Fleet Registry</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage vehicles, drivers, and tracking devices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Side Registration Form */}
        <div className="lg:col-span-4 h-full overflow-y-auto pr-2 pb-4">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-[#FBFBFC]">
              <h2 className="text-[14px] font-semibold text-slate-900">Register Vehicle</h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vnum" className="text-[12px] font-medium text-slate-700">Vehicle Number</Label>
                  <Input id="vnum" className="h-8 text-[13px] font-mono shadow-none rounded focus-visible:ring-1" required value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="e.g. KA-01-AB-1234" />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="dname" className="text-[12px] font-medium text-slate-700">Driver Name</Label>
                  <Input id="dname" className="h-8 text-[13px] shadow-none rounded focus-visible:ring-1" required value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="John Doe" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vtype" className="text-[12px] font-medium text-slate-700">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger id="vtype" className="h-8 text-[13px] shadow-none rounded focus:ring-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="truck" className="text-[13px]">Heavy Truck</SelectItem>
                      <SelectItem value="van" className="text-[13px]">Delivery Van</SelectItem>
                      <SelectItem value="car" className="text-[13px]">Fleet Car</SelectItem>
                      <SelectItem value="motorcycle" className="text-[13px]">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[12px] font-medium text-slate-700">Driver Contact</Label>
                  <Input id="phone" className="h-8 text-[13px] shadow-none rounded focus-visible:ring-1" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>

                <Button type="submit" disabled={createMutation.isPending} className="w-full mt-2 h-8 text-[13px] bg-slate-900 hover:bg-slate-800 text-white rounded">
                  {createMutation.isPending ? 'Registering...' : 'Register Vehicle'}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side Fleet Table */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 rounded-lg bg-white shadow-sm">
            
            <div className="border-b border-slate-200 px-3 py-2 flex items-center justify-between bg-[#FBFBFC] shrink-0">
              <div className="relative w-64">
                <SearchIcon className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search fleet..." className="h-7 w-full pl-8 text-[13px] rounded shadow-none focus-visible:ring-1 border-slate-200" />
              </div>
            </div>

            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader className="bg-white sticky top-0 z-10 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Plate</TableHead>
                    <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Driver</TableHead>
                    <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type</TableHead>
                    <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-[13px] text-slate-500">Loading fleet data...</TableCell>
                    </TableRow>
                  ) : vehiclesData?.vehicles?.length ? (
                    vehiclesData.vehicles.map((v: any) => (
                      <TableRow key={v.id} className="hover:bg-slate-50/60 border-b border-slate-100 transition-colors">
                        <TableCell className="py-2.5">
                          <span className="font-mono text-[13px] text-slate-900 font-medium">{v.vehicle_number}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="text-[13px] font-medium text-slate-900">{v.driver_name}</div>
                          <div className="text-[12px] text-slate-500 leading-none mt-0.5">{v.phone}</div>
                        </TableCell>
                        <TableCell className="py-2.5 capitalize text-[13px] text-slate-600">
                          {v.vehicle_type}
                        </TableCell>
                        <TableCell className="py-2.5 text-right pr-4">
                          <div className="inline-flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            <span className="text-[12px] font-medium text-slate-700 capitalize">{v.status}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center">
                          <TruckIcon className="h-6 w-6 text-slate-300 mb-3" />
                          <p className="text-[13px] text-slate-500">No vehicles registered yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="border-t border-slate-200 bg-[#FBFBFC] px-4 py-2 flex items-center justify-between shrink-0">
              <p className="text-[12px] text-slate-500">{vehiclesData?.vehicles?.length || 0} vehicles</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
