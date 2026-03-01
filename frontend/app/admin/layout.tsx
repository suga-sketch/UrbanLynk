'use client';

import { useEffect, useState } from 'react';
import { kpiMetrics } from '@/lib/mock-data';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<'stable' | 'elevated'>('stable');
  const [activeKiosks, setActiveKiosks] = useState<number>(0);
  const hasBreach = kpiMetrics.slaBreaches > 0;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSystemStatus(hasBreach ? 'elevated' : 'stable');
    setActiveKiosks(Math.floor(Math.random() * 8) + 4);
  }, [hasBreach]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Global Status Strip */}
      <div
        className={`h-1 w-full transition-all duration-300 ${
          hasBreach ? 'bg-red-500/60 shadow-lg shadow-red-500/30' : 'bg-cyan-500/60'
        } ${hasBreach ? 'animate-pulse' : ''}`}
        style={{
          backgroundImage: hasBreach
            ? 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.3), transparent)',
          animation: hasBreach ? 'sweep 2s ease-in-out infinite' : 'none',
        }}
      />

      <style>{`
        @keyframes sweep {
          0% { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }
      `}</style>

      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">UrbanLynk Operations</h1>
                <p className="text-slate-400 text-sm mt-1">Smart City Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-right">
              <div className="font-mono text-2xl font-bold text-cyan-400">{time}</div>
              <div className="flex items-center gap-3">
                <div
                  className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    systemStatus === 'stable'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  System: {systemStatus.toUpperCase()}
                </div>
              </div>
              <div className="text-center">
                <p className="text-cyan-400 text-lg font-bold">{activeKiosks}</p>
                <p className="text-slate-400 text-xs">Active Kiosks</p>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          {hasBreach && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-red-400 text-sm font-semibold">
                ⚠ {kpiMetrics.slaBreaches} SLA BREACHES — Immediate attention required
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>

      {/* Toast Notification for Breach */}
      {hasBreach && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in">
          <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 animate-pulse flex-shrink-0"></div>
              <div>
                <p className="text-sm font-semibold text-red-400">SLA Alert</p>
                <p className="text-xs text-red-300 mt-1">
                  {kpiMetrics.slaBreaches} complaints crossed 24h threshold
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
