import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api/client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterIcon, ArrowRightLeftIcon, ArrowRightIcon, ArrowLeftIcon } from 'lucide-react';

export default function History() {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['violations'],
    queryFn: () => fetchApi('/violations/history'),
  });

  return (
    <div className="flex flex-col h-full space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Audit Log</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Chronological record of all rule evaluations.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-slate-200 bg-white rounded shadow-sm flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400">
            <FilterIcon className="h-3.5 w-3.5 text-slate-400" />
            Filter
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 rounded-lg bg-white shadow-sm">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-[#FBFBFC] sticky top-0 z-10 border-b border-slate-200">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[180px]">Timestamp</TableHead>
                <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vehicle</TableHead>
                <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Geofence</TableHead>
                <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Event</TableHead>
                <TableHead className="h-8 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right pr-4">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-[13px] text-slate-500">Loading audit logs...</TableCell>
                </TableRow>
              ) : historyData?.violations?.length ? (
                historyData.violations.map((v: any) => (
                  <TableRow key={v.id} className="hover:bg-slate-50/60 border-b border-slate-100 transition-colors">
                    <TableCell className="py-2.5 text-[13px] text-slate-500">
                      {new Date(v.timestamp).toLocaleString(undefined, { 
                        month: 'short', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit', second: '2-digit' 
                      })}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="font-mono text-[13px] text-slate-900 font-medium">{v.vehicle_number}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px] text-slate-700 font-medium">
                      {v.geofence_name}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        {v.event_type === 'entry' ? (
                          <ArrowRightIcon className="h-3.5 w-3.5 text-rose-500" />
                        ) : (
                          <ArrowLeftIcon className="h-3.5 w-3.5 text-indigo-500" />
                        )}
                        <span className="text-[13px] font-medium text-slate-700 capitalize">{v.event_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-mono text-[13px] text-slate-500 pr-4">
                      {v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <ArrowRightLeftIcon className="h-6 w-6 text-slate-300 mb-3" />
                      <p className="text-[13px] text-slate-500">No events recorded yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-slate-200 bg-[#FBFBFC] px-4 py-2 flex items-center justify-between shrink-0">
          <p className="text-[12px] text-slate-500">{historyData?.violations?.length || 0} events</p>
          {/* Future pagination controls could go here */}
        </div>
      </div>
    </div>
  );
}
