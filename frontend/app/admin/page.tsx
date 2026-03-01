'use client';

import { useState } from 'react';
import {
  KPIStrip,
  LiveActivityFeed,
  WardHeatmap,
  OfficerWorkloadPanel,
  KioskHealthLogs,
  PredictiveRiskPanel,
} from '@/components/admin/panels';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

  if (activeTab === 'overview') {
    return (
      <div className="space-y-8">
        {/* KPI Strip */}
        <KPIStrip />

        {/* Main Grid: Heatmap (dominant) + Officer Workload + Risk Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Heatmap (2/4 width) */}
          <div className="lg:col-span-2">
            <WardHeatmap />
          </div>

          {/* Right Sidebar: Officer Workload + Risk Panel */}
          <div className="lg:col-span-2 space-y-6">
            <OfficerWorkloadPanel compact={true} />
            <PredictiveRiskPanel />
          </div>
        </div>

        {/* Live Activity Feed */}
        <div>
          <LiveActivityFeed />
        </div>

        {/* Bottom Navigation */}
        <div className="flex gap-4 border-b border-slate-800 pt-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'workload', label: 'Detailed Workload' },
            { id: 'health', label: 'Kiosk Health' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'workload') {
    return (
      <div className="space-y-8">
        <KPIStrip />
        <OfficerWorkloadPanel compact={false} />
        <div className="flex gap-4 border-b border-slate-800 pt-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'workload', label: 'Detailed Workload' },
            { id: 'health', label: 'Kiosk Health' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'health') {
    return (
      <div className="space-y-8">
        <KPIStrip />
        <KioskHealthLogs />
        <div className="flex gap-4 border-b border-slate-800 pt-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'workload', label: 'Detailed Workload' },
            { id: 'health', label: 'Kiosk Health' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
}
