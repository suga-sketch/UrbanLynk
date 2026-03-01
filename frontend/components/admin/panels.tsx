'use client';

import { useState, useEffect } from 'react';
import {
  mockGrievances,
  mockOfficers,
  wardDistribution,
  kioskHealthLogs,
  kpiMetrics,
} from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// City Health Index - Unified system metric
export function CityHealthIndex() {
  const [health, setHealth] = useState(0);
  
  useEffect(() => {
    // Formula: 100 - (breach_count × 2)
    const baseHealth = 100 - (kpiMetrics.slaBreaches * 2);
    const finalHealth = Math.max(0, baseHealth);
    
    // Animate to final health value
    const duration = 2000;
    const steps = 60;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setHealth(Math.floor(finalHealth * progress));
      
      if (currentStep >= steps) {
        setHealth(finalHealth);
        clearInterval(interval);
      }
    }, duration / steps);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (value: number) => {
    if (value >= 90) return 'text-green-400';
    if (value >= 80) return 'text-yellow-400';
    if (value >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthBgColor = (value: number) => {
    if (value >= 90) return 'bg-green-500/10 border-green-500/30';
    if (value >= 80) return 'bg-yellow-500/10 border-yellow-500/30';
    if (value >= 70) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className={`rounded-lg p-6 border transition-all ${getHealthBgColor(health)}`}>
      <p className="text-sm font-semibold text-slate-400 mb-4">City Health Index</p>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(health / 100) * 282} 282`}
              strokeLinecap="round"
              className={`${getHealthColor(health)} transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getHealthColor(health)}`}>{health}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${getHealthColor(health)}`}>
            {health >= 90 && 'Operational Normal'}
            {health >= 80 && health < 90 && 'Minor Issues'}
            {health >= 70 && health < 80 && 'Moderate Issues'}
            {health < 70 && 'Critical Issues'}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {kpiMetrics.slaBreaches > 0 
              ? `${kpiMetrics.slaBreaches} active breach${kpiMetrics.slaBreaches !== 1 ? 'es' : ''}`
              : 'All systems nominal'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// KPI Strip
export function KPIStrip() {
  const [counts, setCounts] = useState({
    totalToday: 0,
    pending: 0,
    slaBreaches: 0,
    avgResolutionTime: 0,
    kioskUptime: 0,
    citizensServed: 0,
  });

  useEffect(() => {
    // Animate count-up for metrics
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setCounts({
        totalToday: Math.floor(kpiMetrics.totalToday * progress),
        pending: Math.floor(kpiMetrics.pending * progress),
        slaBreaches: Math.floor(kpiMetrics.slaBreaches * progress),
        avgResolutionTime: parseFloat((kpiMetrics.avgResolutionTime * progress).toFixed(1)),
        kioskUptime: parseFloat((kpiMetrics.kioskUptime * progress).toFixed(1)),
        citizensServed: Math.floor(kpiMetrics.citizensServed * progress),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setCounts({
          totalToday: kpiMetrics.totalToday,
          pending: kpiMetrics.pending,
          slaBreaches: kpiMetrics.slaBreaches,
          avgResolutionTime: kpiMetrics.avgResolutionTime,
          kioskUptime: kpiMetrics.kioskUptime,
          citizensServed: kpiMetrics.citizensServed,
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  const hasBreach = kpiMetrics.slaBreaches > 0;

  const metrics = [
    { label: 'Total Complaints Today', value: counts.totalToday, unit: '' },
    { label: 'Pending', value: counts.pending, unit: '' },
    { label: 'SLA Breaches', value: counts.slaBreaches, unit: '', breach: hasBreach },
    { label: 'Avg Resolution Time', value: counts.avgResolutionTime, unit: 'hrs' },
    { label: 'Kiosk Uptime', value: counts.kioskUptime, unit: '%' },
    { label: 'Citizens Served', value: counts.citizensServed, unit: '' },
  ];

  return (
    <div className="space-y-4">
      {/* City Health Index */}
      <CityHealthIndex />
      
      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`relative rounded-lg p-4 transition-all duration-300 ${
              metric.breach
                ? 'bg-red-500/10 border-2 border-red-500/50 shadow-lg shadow-red-500/20'
                : 'bg-slate-800 border border-slate-700'
            } ${metric.breach ? 'animate-pulse' : ''}`}
          >
            {metric.breach && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
            <p className={`text-sm font-medium mb-2 ${metric.breach ? 'text-red-400' : 'text-slate-400'}`}>
              {metric.label}
            </p>
            <p className={`text-3xl font-bold ${metric.breach ? 'text-red-400' : 'text-white'}`}>
              {metric.value}
              <span className={`text-lg ml-1 ${metric.breach ? 'text-red-400/70' : 'text-slate-400'}`}>
                {metric.unit}
              </span>
            </p>
            {metric.breach && (
              <p className="text-xs text-red-400 font-semibold mt-2">+2 in last 15 min</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Predictive Risk Indicator
export function PredictiveRiskPanel() {
  const [riskWards, setRiskWards] = useState<Array<{ ward: string; count: number; riskLevel: string }>>([]);

  useEffect(() => {
    // Scan mock data for tickets >20h
    const wardRisks = new Map<string, number>();
    
    mockGrievances.forEach(complaint => {
      const now = new Date();
      const hoursElapsed = (now.getTime() - complaint.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursElapsed > 20) {
        const count = wardRisks.get(complaint.ward) || 0;
        wardRisks.set(complaint.ward, count + 1);
      }
    });

    const risks = Array.from(wardRisks.entries())
      .map(([ward, count]) => ({
        ward,
        count,
        riskLevel: count >= 3 ? 'Critical' : count >= 2 ? 'High' : 'Medium',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    setRiskWards(risks);
  }, []);

  if (riskWards.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Next 4h Risk Forecast</h3>
        <p className="text-slate-400 text-sm">All systems nominal. No predicted breaches.</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-amber-400">⚠</span> Next 4h Risk Forecast
      </h3>
      <div className="space-y-3">
        {riskWards.map((risk, idx) => (
          <div key={idx} className="flex items-start justify-between gap-4 p-3 bg-slate-800/50 rounded-lg border border-amber-500/20">
            <div className="flex-1">
              <p className="font-semibold text-white">{risk.ward}</p>
              <p className={`text-sm ${
                risk.riskLevel === 'Critical' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {risk.count} ticket{risk.count !== 1 ? 's' : ''} nearing 24h
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
              risk.riskLevel === 'Critical'
                ? 'bg-red-500/20 text-red-400'
                : risk.riskLevel === 'High'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {risk.riskLevel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Live Activity Feed
export function LiveActivityFeed() {
  const [feed, setFeed] = useState<Array<{ id: string; type: string; message: string; time: string; ward?: string; officer?: string }>>([]);

  useEffect(() => {
    // Generate initial feed with breach entries
    const initialFeed = [
      {
        id: '1',
        type: 'breach',
        message: 'SLA BREACH — Issue #UL-2026-0049',
        time: 'now',
        ward: 'Kukatpally',
        officer: 'Officer Ramesh',
      },
      {
        id: '2',
        type: 'breach',
        message: 'SLA BREACH — Issue #UL-2026-0043',
        time: '2m ago',
        ward: 'Serilingampally',
        officer: 'Mohammed Imran',
      },
      {
        id: '3',
        type: 'resolved',
        message: 'Issue resolved — #UL-2026-0041',
        time: '5m ago',
        ward: 'Secunderabad',
      },
      {
        id: '4',
        type: 'assigned',
        message: 'Issue assigned — #UL-2026-0040',
        time: '8m ago',
        ward: 'Charminar',
        officer: 'Rajesh Kumar',
      },
      {
        id: '5',
        type: 'submitted',
        message: 'New issue registered — #UL-2026-0039',
        time: '12m ago',
        ward: 'LB Nagar',
      },
    ];

    setFeed(initialFeed);
  }, []);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Live Activity Feed</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {feed.map((entry, idx) => (
          <div
            key={entry.id}
            className={`p-4 rounded-lg border transition-all duration-500 animate-in fade-in slide-in-from-top-2 ${
              entry.type === 'breach'
                ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/10'
                : entry.type === 'resolved'
                  ? 'bg-green-500/10 border-green-500/30'
                  : entry.type === 'assigned'
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-slate-700/50 border-slate-600'
            }`}
            style={{
              animationDelay: `${idx * 100}ms`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-bold ${
                    entry.type === 'breach'
                      ? 'text-red-400'
                      : entry.type === 'resolved'
                        ? 'text-green-400'
                        : entry.type === 'assigned'
                          ? 'text-blue-400'
                          : 'text-slate-400'
                  }`}>
                    {entry.type === 'breach' && '⚠'}
                    {entry.type === 'resolved' && '✓'}
                    {entry.type === 'assigned' && '→'}
                    {!['breach', 'resolved', 'assigned'].includes(entry.type) && '•'}
                  </span>
                  <p className={`font-semibold ${
                    entry.type === 'breach'
                      ? 'text-red-400'
                      : entry.type === 'resolved'
                        ? 'text-green-400'
                        : entry.type === 'assigned'
                          ? 'text-blue-400'
                          : 'text-white'
                  }`}>
                    {entry.message}
                  </p>
                </div>
                {entry.ward && (
                  <p className="text-xs text-slate-400">
                    Ward: <span className="text-slate-300">{entry.ward}</span>
                    {entry.officer && <span className="ml-3">Officer: <span className="text-slate-300">{entry.officer}</span></span>}
                  </p>
                )}
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{entry.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Live Issues Table
export function LiveGrievancesTable() {
  const getSLAColor = (slaEndAt: Date) => {
    const now = new Date();
    const diff = slaEndAt.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 0) return 'text-red-500 bg-red-500/10';
    if (hours < 12) return 'text-green-500 bg-green-500/10';
    if (hours < 24) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  const getSLALabel = (slaEndAt: Date) => {
    const now = new Date();
    const diff = slaEndAt.getTime() - now.getTime();

    if (diff < 0) return 'BREACHED';
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return '< 1h';
    return `${Math.floor(hours)}h`;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900">
            <th className="text-left px-4 py-3 text-slate-300 font-semibold">Issue ID</th>
            <th className="text-left px-4 py-3 text-slate-300 font-semibold">Ward</th>
            <th className="text-left px-4 py-3 text-slate-300 font-semibold">Category</th>
            <th className="text-left px-4 py-3 text-slate-300 font-semibold">Assigned To</th>
            <th className="text-left px-4 py-3 text-slate-300 font-semibold">Status</th>
            <th className="text-left px-4 py-3 text-slate-300 font-semibold">SLA Time</th>
          </tr>
        </thead>
        <tbody>
          {mockGrievances.slice(0, 8).map((complaint) => (
            <tr key={complaint.id} className="border-b border-slate-700 hover:bg-slate-700/50">
              <td className="px-4 py-3 text-cyan-400 font-mono">{complaint.refId}</td>
              <td className="px-4 py-3 text-white">{complaint.ward}</td>
              <td className="px-4 py-3 text-slate-300">{complaint.category}</td>
              <td className="px-4 py-3 text-slate-300">{complaint.assignedTo || '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    complaint.status === 'resolved'
                      ? 'bg-green-500/10 text-green-500'
                      : complaint.status === 'in-progress'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                  }`}
                >
                  {complaint.status.toUpperCase()}
                </span>
              </td>
              <td className={`px-4 py-3 font-mono font-bold ${getSLAColor(complaint.slaEndAt)}`}>
                {getSLALabel(complaint.slaEndAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Ward Heatmap
export function WardHeatmap() {
  const breachWards = ['Kukatpally', 'Serilingampally']; // Wards with breaches
  const enhancedData = wardDistribution.map(ward => ({
    ...ward,
    hasBreach: breachWards.includes(ward.ward),
  }));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        City Ward Map
        {breachWards.length > 0 && (
          <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-full font-semibold">
            {breachWards.length} Wards Affected
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={enhancedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis 
            dataKey="ward" 
            tick={{ fill: '#94a3b8' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis tick={{ fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
            cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className={`p-3 rounded-lg border ${
                    data.hasBreach
                      ? 'bg-red-500/20 border-red-500/50'
                      : 'bg-slate-900 border-slate-700'
                  }`}>
                    <p className="text-sm font-semibold text-white">{data.ward}</p>
                    <p className={`text-sm ${data.hasBreach ? 'text-red-400' : 'text-cyan-400'}`}>
                      {data.complaints} complaints
                    </p>
                    {data.hasBreach && (
                      <p className="text-xs text-red-400 font-semibold mt-1">2 tickets &gt; 24h</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="complaints" 
            fill="#06b6d4"
            shape={<CustomBar hasBreach={false} breachWards={breachWards} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomBar(props: any) {
  const { x, y, width, height, value } = props;
  const ward = props.payload?.ward;
  const hasBreach = props.breachWards?.includes(ward);

  return (
    <g>
      <filter id={`glow-${ward}`}>
        <feGaussianBlur stdDeviation={hasBreach ? '3' : '0'} result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={hasBreach ? '#ef4444' : '#06b6d4'}
        filter={`url(#glow-${ward})`}
        className={hasBreach ? 'animate-pulse' : ''}
      />
    </g>
  );
}

// Reassignment Suggestion Modal
function ReassignmentModal({ 
  isOpen, 
  onClose, 
  fromOfficer, 
  toOfficer 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  fromOfficer?: any; 
  toOfficer?: any; 
}) {
  if (!isOpen || !fromOfficer || !toOfficer) return null;

  const newFromLoad = Math.max(0, fromOfficer.active - 2);
  const newToLoad = toOfficer.active + 2;
  const breachReductionPercent = 18;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-lg w-full p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Suggested Reassignment</h2>
          <p className="text-slate-400">Optimize workload distribution</p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-400">Move 2 complaints from:</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">→</span>
              <div>
                <p className="font-bold text-white">{fromOfficer.name}</p>
                <p className="text-sm text-slate-400">{fromOfficer.ward}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">to:</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">→</span>
              <div>
                <p className="font-bold text-white">{toOfficer.name}</p>
                <p className="text-sm text-slate-400">{toOfficer.ward}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div>
              <p className="text-xs text-slate-400 mb-2">{fromOfficer.name} Load</p>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">{fromOfficer.active} <span className="text-amber-400">→</span> {newFromLoad}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">{toOfficer.name} Load</p>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">{toOfficer.active} <span className="text-cyan-400">→</span> {newToLoad}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-400 mb-1">Impact</p>
            <p className="text-sm text-green-300">
              Breach probability reduced by <span className="font-bold">{breachReductionPercent}%</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors"
          >
            Apply Suggestion
          </button>
        </div>
      </div>
    </div>
  );
}

// Officer Workload Panel
export function OfficerWorkloadPanel({ compact = false }: { compact?: boolean }) {
  const overloadedOfficers = ['Mohammed Imran', 'Farooq Ahmed', 'Pradeep Yadav']; // Officers with high workload
  const displayOfficers = compact ? mockOfficers.slice(0, 4) : mockOfficers;
  const [showReassignmentModal, setShowReassignmentModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);

  const handleSuggestReassignment = () => {
    const overloaded = mockOfficers.find(o => o.name === 'Mohammed Imran');
    const underloaded = mockOfficers.find(o => o.name === 'Kavya Patel');
    setSelectedOfficer({ from: overloaded, to: underloaded });
    setShowReassignmentModal(true);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          Officer Workload
          {compact && <span className="text-xs text-slate-400">(Summary)</span>}
        </h3>
        {!compact && (
          <button
            onClick={handleSuggestReassignment}
            className="px-3 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Suggest Reassignment
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayOfficers.map((officer) => {
          const isOverloaded = overloadedOfficers.includes(officer.name);
          const workloadPercent = (officer.active / 10) * 100;

          return (
            <div
              key={officer.id}
              className={`p-4 rounded-lg border transition-all ${
                isOverloaded
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${isOverloaded ? 'text-amber-400' : 'text-white'}`}>
                    {officer.name}
                  </p>
                  <p className="text-slate-400 text-sm">{officer.ward}</p>
                  {isOverloaded && (
                    <p className="text-xs text-amber-400 font-semibold mt-1">⚡ Reassignment Recommended</p>
                  )}
                </div>
                <div className="text-right">
                  {officer.status === 'online' ? (
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                  ) : (
                    <span className="w-2.5 h-2.5 bg-slate-500 rounded-full inline-block"></span>
                  )}
                </div>
              </div>

              {!compact && (
                <>
                  <div className="mb-3 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOverloaded ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(workloadPercent, 100)}%` }}
                    ></div>
                  </div>
                </>
              )}

              <div className={`flex items-center gap-4 text-sm ${compact ? 'justify-between' : ''}`}>
                <div>
                  <p className={`font-bold ${isOverloaded ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {officer.active}
                  </p>
                  <p className="text-slate-400 text-xs">Active</p>
                </div>
                <div>
                  <p className="text-green-400 font-bold">{officer.resolved}</p>
                  <p className="text-slate-400 text-xs">Resolved</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ReassignmentModal 
        isOpen={showReassignmentModal}
        onClose={() => setShowReassignmentModal(false)}
        fromOfficer={selectedOfficer?.from}
        toOfficer={selectedOfficer?.to}
      />
    </div>
  );
}

// Kiosk Health Logs
export function KioskHealthLogs() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Kiosk Health Logs</h3>
      <div className="space-y-3">
        {kioskHealthLogs.map((log, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border flex items-start gap-4 ${
              log.type === 'critical'
                ? 'bg-red-500/10 border-red-500/30'
                : log.type === 'alert'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : log.type === 'success'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-slate-400 text-xs font-mono">{log.timestamp}</span>
                <span className="text-slate-400 text-xs font-mono">{log.kiosk}</span>
              </div>
              <p
                className={`text-sm ${
                  log.type === 'critical'
                    ? 'text-red-400'
                    : log.type === 'alert'
                      ? 'text-yellow-400'
                      : log.type === 'success'
                        ? 'text-green-400'
                        : 'text-blue-400'
                }`}
              >
                {log.event}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
