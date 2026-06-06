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