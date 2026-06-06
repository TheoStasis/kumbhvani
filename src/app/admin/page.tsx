"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

type Alert = {
  id: string;
  location: string;
  emergency_type: string;
  original_audio_text: string;
  status: string;
  created_at: string;
};

export default function AdminDashboard() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
  
    useEffect(() => {
      // 1. Fetch existing active alerts on load
      const fetchAlerts = async () => {
        const { data, error } = await supabase
          .from('emergency_dispatches')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false });
  
        if (error) {
          console.error('Error fetching alerts:', error);
        } else {
          setAlerts(data || []);
        }
      };
      fetchAlerts();

    // 2. The Realtime Magic: Listen for new INSERTs
    const channel = supabase
      .channel('realtime_alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergency_dispatches' },
        (payload) => {
          // Push new alert to the top of the list
          setAlerts((prev) => [payload.new as Alert, ...prev]);
        }
      )
      .subscribe();

    // Cleanup the subscription when leaving the page
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 p-8 text-black font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b-4 border-red-600 pb-4">
          <h1 className="text-4xl font-black text-red-700 tracking-tighter uppercase">
            KumbhVani Central Command
          </h1>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-200">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
            </span>
            <span className="font-bold text-neutral-800 text-sm tracking-wide">LIVE FEED ACTIVE</span>
          </div>
        </div>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="text-center p-16 bg-white rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-2xl font-bold text-neutral-400">No active emergencies.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className="border-l-[12px] border-red-600 bg-white p-6 rounded-r-2xl shadow-lg flex flex-col gap-3 animate-in slide-in-from-top-4 duration-300"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-3xl font-black text-red-700 uppercase tracking-wide">
                    📍 {alert.location}
                  </h2>
                  <span className="text-sm font-bold bg-red-100 text-red-800 px-4 py-1.5 rounded-md border border-red-200">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xl font-bold text-neutral-800">
                  Threat: {alert.emergency_type}
                </p>