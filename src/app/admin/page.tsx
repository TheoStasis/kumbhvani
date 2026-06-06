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