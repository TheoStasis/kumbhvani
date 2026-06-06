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