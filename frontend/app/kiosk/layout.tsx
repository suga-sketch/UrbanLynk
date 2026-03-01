'use client';

import React, { useState, useEffect, ReactNode, createContext } from 'react';

interface KioskContextType {
  language: string;
  setLanguage: (lang: string) => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  complaintId: string;
  setComplaintId: (id: string) => void;
  sessionTimeout: number;
  setSessionTimeout: (timeout: number) => void;
}

export const KioskContext = createContext<KioskContextType | null>(null);

export default function KioskLayout({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('english');
  const [currentScreen, setCurrentScreen] = useState('attract');
  const [formData, setFormData] = useState({});
  const [complaintId, setComplaintId] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(120);
  const [isOnline, setIsOnline] = useState(true);

  // Auto-timeout logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTimeout((prev) => {
        if (prev <= 0) {
          setCurrentScreen('attract');
          setFormData({});
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reset timeout on user interaction
  useEffect(() => {
    const handleActivity = () => {
      setSessionTimeout(120);
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // Network status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }, []);

  const timeoutPercentage = (sessionTimeout / 120) * 100;

  return (
    <KioskContext.Provider
      value={{
        language,
        setLanguage,
        currentScreen,
        setCurrentScreen,
        formData,
        setFormData,
        complaintId,
        setComplaintId,
        sessionTimeout,
        setSessionTimeout,
      }}
    >
      <div className="w-full h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
        {/* Status Bar */}
        <div className="bg-slate-950 border-b border-slate-700 px-6 py-3 flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <span className="font-mono text-cyan-400">Kiosk-01</span>
            <span className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Offline</span>
                </>
              )}
            </span>
          </div>
          <span className="font-mono">{new Date().toLocaleTimeString()}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Timeout:</span>
            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${timeoutPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </KioskContext.Provider>
  );
}
