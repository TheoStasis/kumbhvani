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