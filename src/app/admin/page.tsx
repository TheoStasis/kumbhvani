"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';

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
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('emergency_dispatches')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (!error) setAlerts(data || []);
    };

    fetchAlerts();

    const channel = supabase
      .channel('realtime_alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergency_dispatches' },
        (payload) => {
          setAlerts((prev) => [payload.new as Alert, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // THE NEW RESOLVE FUNCTION
  const handleResolve = async (id: string) => {
    // 1. Instantly hide it from the UI (Optimistic Update)
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));

    // 2. Update the database silently in the background
    const { error } = await supabase
      .from('emergency_dispatches')
      .update({ status: 'RESOLVED' })
      .eq('id', id);

    if (error) {
      console.error('Error resolving alert:', error);
      // Optional: If it fails, you could fetch alerts again to restore it
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-8 text-black font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b-4 border-red-600 pb-4">
          <h1 className="text-4xl font-black text-red-700 tracking-tighter uppercase flex items-center gap-3">
            <AlertTriangle size={36} className="text-red-600" />
            Control Room
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
                className="group border-l-[12px] border-red-600 bg-white p-6 rounded-r-2xl shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300 relative"
              >
                <div className="flex justify-between items-start pr-32">
                  <h2 className="text-2xl font-black text-red-700 uppercase tracking-wide flex items-center gap-2">
                    <MapPin size={24} className="text-red-600" />
                    {alert.location}
                  </h2>
                  <span className="text-sm font-bold bg-red-100 text-red-800 px-4 py-1.5 rounded-md border border-red-200">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-xl font-bold text-neutral-800">
                  Threat: {alert.emergency_type}
                </p>
                
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <p className="text-sm text-neutral-500 font-bold mb-1 uppercase tracking-wider">Raw Transcript:</p>
                  <p className="text-lg text-neutral-800 font-mono italic">
                    "{alert.original_audio_text}"
                  </p>
                </div>

                {/* Resolve Button */}
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="absolute top-6 right-6 flex items-center gap-2 bg-neutral-100 hover:bg-green-100 text-neutral-500 hover:text-green-700 border border-neutral-200 hover:border-green-300 px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-sm"
                >"use client";

                import { useEffect, useState } from 'react';
                import { supabase } from '@/utils/supabaseClient';
                import { AlertTriangle, CheckCircle2, MapPin, Lock, LogOut } from 'lucide-react';
                
                type Alert = {
                  id: string;
                  location: string;
                  emergency_type: string;
                  original_audio_text: string;
                  status: string;
                  created_at: string;
                };
                
                export default function AdminDashboard() {
                  // Auth States
                  const [isAuthenticated, setIsAuthenticated] = useState(false);
                  const [email, setEmail] = useState('');
                  const [password, setPassword] = useState('');
                  const [authError, setAuthError] = useState('');
                  const [isLoggingIn, setIsLoggingIn] = useState(false);
                
                  // Dashboard States
                  const [alerts, setAlerts] = useState<Alert[]>([]);
                
                  // 1. Check for existing active session on load
                  useEffect(() => {
                    const checkSession = async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session) setIsAuthenticated(true);
                    };
                    checkSession();
                  }, []);
                
                  // 2. Fetch data & subscribe to WebSockets ONLY if authenticated
                  useEffect(() => {
                    if (!isAuthenticated) return;
                
                    const fetchAlerts = async () => {
                      const { data, error } = await supabase
                        .from('emergency_dispatches')
                        .select('*')
                        .eq('status', 'ACTIVE')
                        .order('created_at', { ascending: false });
                
                      if (!error) setAlerts(data || []);
                    };
                
                    fetchAlerts();
                
                    const channel = supabase
                      .channel('realtime_alerts')
                      .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'emergency_dispatches' },
                        (payload) => {
                          setAlerts((prev) => [payload.new as Alert, ...prev]);
                        }
                      )
                      .subscribe();
                
                    return () => {
                      supabase.removeChannel(channel);
                    };
                  }, [isAuthenticated]);
                
                  const handleLogin = async (e: React.FormEvent) => {
                    e.preventDefault();
                    setIsLoggingIn(true);
                    setAuthError('');
                
                    const { error } = await supabase.auth.signInWithPassword({
                      email,
                      password,
                    });
                
                    if (error) {
                      setAuthError("Invalid admin credentials.");
                    } else {
                      setIsAuthenticated(true);
                    }
                    setIsLoggingIn(false);
                  };
                
                  const handleLogout = async () => {
                    await supabase.auth.signOut();
                    setIsAuthenticated(false);
                    setAlerts([]);
                  };
                
                  const handleResolve = async (id: string) => {
                    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
                    const { error } = await supabase
                      .from('emergency_dispatches')
                      .update({ status: 'RESOLVED' })
                      .eq('id', id);
                
                    if (error) console.error('Error resolving alert:', error);
                  };
                
                  // --- LOGIN UI ---
                  if (!isAuthenticated) {
                    return (
                      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-red-600">
                          <div className="flex flex-col items-center mb-8">
                            <div className="bg-red-100 p-4 rounded-full mb-4">
                              <Lock size={32} className="text-red-600" />
                            </div>
                            <h1 className="text-2xl font-black text-neutral-800 tracking-tight">RESTRICTED ACCESS</h1>
                            <p className="text-neutral-500 font-medium text-sm mt-1">KumbhVani Control Room</p>
                          </div>
                
                          <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-neutral-700 mb-1">Admin Email</label>
                              <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-black"
                                placeholder="admin@kumbhvani.com"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-neutral-700 mb-1">Password</label>
                              <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-black"
                                placeholder="••••••••"
                                required
                              />
                            </div>
                
                            {authError && (
                              <p className="text-red-600 text-sm font-bold text-center bg-red-50 p-2 rounded-lg">{authError}</p>
                            )}
                
                            <button 
                              type="submit" 
                              disabled={isLoggingIn}
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 mt-4 disabled:opacity-50"
                            >
                              {isLoggingIn ? "Verifying..." : "Authorize Access"}
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  }
                
                  // --- DASHBOARD UI ---
                  return (
                    <div className="min-h-screen bg-neutral-100 p-8 text-black font-sans">
                      <div className="max-w-5xl mx-auto">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 border-b-4 border-red-600 pb-4">
                          <h1 className="text-4xl font-black text-red-700 tracking-tighter uppercase flex items-center gap-3">
                            <AlertTriangle size={36} className="text-red-600" />
                            Control Room
                          </h1>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-200">
                              <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
                              </span>
                              <span className="font-bold text-neutral-800 text-sm tracking-wide">LIVE FEED ACTIVE</span>
                            </div>
                            
                            <button 
                              onClick={handleLogout}
                              className="p-2 bg-neutral-200 hover:bg-neutral-300 rounded-full text-neutral-600 transition-colors"
                              title="Logout"
                            >
                              <LogOut size={20} />
                            </button>
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
                                className="group border-l-[12px] border-red-600 bg-white p-6 rounded-r-2xl shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300 relative"
                              >
                                <div className="flex justify-between items-start pr-32">
                                  <h2 className="text-2xl font-black text-red-700 uppercase tracking-wide flex items-center gap-2">
                                    <MapPin size={24} className="text-red-600" />
                                    {alert.location}
                                  </h2>
                                  <span className="text-sm font-bold bg-red-100 text-red-800 px-4 py-1.5 rounded-md border border-red-200">
                                    {new Date(alert.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                
                                <p className="text-xl font-bold text-neutral-800">
                                  Threat: {alert.emergency_type}
                                </p>
                                
                                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                  <p className="text-sm text-neutral-500 font-bold mb-1 uppercase tracking-wider">Raw Transcript:</p>
                                  <p className="text-lg text-neutral-800 font-mono italic">
                                    "{alert.original_audio_text}"
                                  </p>
                                </div>
                
                                <button
                                  onClick={() => handleResolve(alert.id)}
                                  className="absolute top-6 right-6 flex items-center gap-2 bg-neutral-100 hover:bg-green-100 text-neutral-500 hover:text-green-700 border border-neutral-200 hover:border-green-300 px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-sm"
                                >
                                  <CheckCircle2 size={20} />
                                  <span>Resolve</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                  <CheckCircle2 size={20} />
                  <span>Resolve</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}