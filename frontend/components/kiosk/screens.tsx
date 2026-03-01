'use client';

import { useState, useContext, useCallback, useEffect } from 'react';
import { KioskContext } from '@/app/kiosk/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GrievanceWizard from '@/components/kiosk/GrievanceWizard';
import TrackReport from '@/components/kiosk/TrackReport';
import BillPayment from '@/components/kiosk/BillPayment';
import { useKioskTTS } from '@/hooks/use-kiosk-tts';

/**
 * Reusable Read Aloud button component for kiosk screens
 * Large touch-friendly button positioned in the top-right corner
 */
interface ReadAloudButtonProps {
  onRead: () => void;
  isSpeaking?: boolean;
  className?: string;
}

function ReadAloudButton({ onRead, isSpeaking = false, className = '' }: ReadAloudButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRead();
      }}
      className={`fixed top-24 right-6 z-50 w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-600 
        flex items-center justify-center shadow-lg transition-all duration-200
        ${isSpeaking ? 'animate-pulse ring-4 ring-cyan-400/50' : ''} ${className}`}
      aria-label="Read aloud"
      title="Read page content aloud"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
    </button>
  );
}

// Attract Screen
export function AttractScreen() {
  const context = useContext(KioskContext);
  const { speak, isSpeaking } = useKioskTTS();

  const handleStart = () => {
    if (!context) return;
    context.setCurrentScreen('language');
    context.setSessionTimeout(120);
  };

  const handleReadAloud = useCallback(() => {
    speak(
      'Welcome to UrbanLynk. Smart City Solutions for Urban Issue Management. ' +
      'Tap anywhere on the screen to begin. Session timeout is 2 minutes.'
    );
  }, [speak]);

  if (!context) return null;

  return (
    <div
      className="w-full h-full relative overflow-hidden cursor-pointer select-none"
      onClick={handleStart}
    >
      {/* Read Aloud Button */}
      <ReadAloudButton onRead={handleReadAloud} isSpeaking={isSpeaking} />

      {/* Animated gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 50%), linear-gradient(to bottom, rgb(15, 23, 42), rgb(30, 41, 59))',
        }}
      />

      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'slide 20s linear infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-12">
        <div className="text-center space-y-6">
          {/* Glow effect for title */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
            style={{ animation: 'pulse 4s ease-in-out infinite' }}
          />

          <div className="relative z-20">
            <h1 className="text-7xl font-bold text-cyan-400 mb-2 drop-shadow-lg">UrbanLynk</h1>
            <div className="h-1 w-32 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-2">
            <p className="text-4xl text-slate-200 font-light">Smart City Solutions</p>
            <p className="text-lg text-slate-400">Urban Issue Management</p>
          </div>
        </div>

        {/* Session timeout ring and CTA */}
        <div className="flex flex-col items-center gap-8">
          <div
            className="w-32 h-32 rounded-full border-4 border-cyan-500/30 flex items-center justify-center relative"
            style={{
              backgroundImage:
                'conic-gradient(rgb(6, 182, 212) 0deg, rgb(6, 182, 212) 120deg, transparent 120deg)',
              animation: 'spin 3s linear infinite',
            }}
          >
            <div className="w-28 h-28 bg-slate-800 rounded-full flex items-center justify-center border border-cyan-500/20">
              <span className="text-3xl font-bold text-cyan-400">120s</span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-2xl font-semibold text-slate-300">Tap anywhere to begin</p>
            <p className="text-sm text-slate-500">Session timeout: 2 minutes</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Language Selection
export function LanguageScreen() {
  const context = useContext(KioskContext);
  const { speak, isSpeaking } = useKioskTTS();

  const languages = [
    { code: 'english', name: 'English' },
    { code: 'hindi', name: 'हिंदी' },
    { code: 'telugu', name: 'తెలుగు' },
    { code: 'tamil', name: 'தமிழ்' },
    { code: 'kannada', name: 'ಕನ್ನಡ' },
  ];

  const handleSelect = (code: string) => {
    if (!context) return;
    context.setLanguage(code);
    context.setCurrentScreen('consent');
  };

  const handleReadAloud = useCallback(() => {
    speak(
      'Please select your preferred language. ' +
      'Options available are: English, Hindi, Telugu, Tamil, and Kannada. ' +
      'Tap on your language to continue.'
    );
  }, [speak]);

  if (!context) return null;

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-8 p-8 relative">
      {/* Read Aloud Button */}
      <ReadAloudButton onRead={handleReadAloud} isSpeaking={isSpeaking} />

      <h2 className="text-4xl font-bold text-white mb-6">Select Language</h2>
      <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className="bg-slate-700 hover:bg-cyan-600 text-white font-bold py-12 px-6 rounded-lg text-3xl transition-colors"
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// Consent Screen
export function ConsentScreen() {
  const context = useContext(KioskContext);
  const { speak, isSpeaking } = useKioskTTS();

  const [scrolled, setScrolled] = useState(false);

  const handleAgree = () => {
    if (!context) return;
    context.setCurrentScreen('otp');
  };

  const handleReadAloud = useCallback(() => {
    speak(
      'Privacy and Consent Notice. ' +
      'Your issue report will be registered with UrbanLynk. The information you provide will be: ' +
      'Used to address your civic concern. ' +
      'Shared with relevant departments. ' +
      'Stored securely for tracking purposes. ' +
      'Your personal information will be protected according to applicable data protection laws. ' +
      'You may receive updates via SMS or email regarding your complaint status. ' +
      'Please scroll to the bottom and click I Agree to consent to the processing of your information.'
    );
  }, [speak]);

  if (!context) return null;

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col p-8 relative">
      {/* Read Aloud Button */}
      <ReadAloudButton onRead={handleReadAloud} isSpeaking={isSpeaking} />

      <h2 className="text-3xl font-bold text-white mb-6">Privacy & Consent</h2>
      <div
        className="flex-1 bg-slate-800 p-6 rounded-lg text-slate-300 overflow-y-auto mb-6"
        onScroll={(e) => {
          const element = e.currentTarget;
          const atBottom =
            element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
          setScrolled(atBottom);
        }}
      >
        <p className="mb-4">
          Your issue report will be registered with UrbanLynk. The information you provide will be:
        </p>
        <ul className="list-disc ml-6 space-y-2 mb-4">
          <li>Used to address your civic concern</li>
          <li>Shared with relevant departments</li>
          <li>Stored securely for tracking purposes</li>
        </ul>
        <p className="mb-4">
          Your personal information will be protected according to applicable data protection laws.
          You may receive updates via SMS or email regarding your complaint status.
        </p>
        <p>By clicking "I Agree", you consent to the processing of your information.</p>
      </div>
      <button
        onClick={handleAgree}
        disabled={!scrolled}
        className={`w-full py-6 px-4 rounded-lg text-2xl font-bold transition-colors ${
          scrolled
            ? 'bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
        }`}
      >
        I Agree & Continue
      </button>
    </div>
  );
}

// OTP Screen
export function OTPScreen() {
  const context = useContext(KioskContext);
  const { speak, isSpeaking } = useKioskTTS();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (!context) return;
    if (otp === '1234') {
      context.setCurrentScreen('services');
    } else {
      setError('Invalid OTP. Try 1234');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  const handleReadAloud = useCallback(() => {
    speak(
      'Please enter the One-Time Password sent to your registered mobile number. ' +
      'Enter the 4-digit code using the input field, then tap Verify to continue. ' +
      'For demo purposes, enter 1 2 3 4.'
    );
  }, [speak]);

  if (!context) return null;

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-6 p-8 relative">
      {/* Read Aloud Button */}
      <ReadAloudButton onRead={handleReadAloud} isSpeaking={isSpeaking} />

      <h2 className="text-3xl font-bold text-white">Enter OTP</h2>
      <p className="text-slate-400 text-lg">Sent to your registered number</p>
      <input
        type="text"
        maxLength={4}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        onKeyDown={handleKeyDown}
        placeholder="0000"
        className="text-5xl font-mono text-center w-48 py-6 bg-slate-800 text-white rounded-lg border-2 border-slate-700 focus:border-cyan-500 outline-none"
        autoFocus
      />
      {error && <p className="text-red-500 text-lg">{error}</p>}
      <button
        onClick={handleVerify}
        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-12 rounded-lg text-2xl transition-colors w-full max-w-xs"
      >
        Verify
      </button>
      <p className="text-slate-500 text-sm">Demo: Enter 1234</p>
    </div>
  );
}

// Service Dashboard
export function ServiceDashboardScreen() {
  const context = useContext(KioskContext);
  const { speak, isSpeaking } = useKioskTTS();

  const services = [
    {
      id: 'complaint',
      title: 'Report Issue',
      description: 'Submit a new urban issue',
      icon: '📋',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'track',
      title: 'Track Report',
      description: 'Check issue status',
      icon: '🔍',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'pay',
      title: 'Pay Bill',
      description: 'Pay electricity, water & gas bills',
      icon: '💳',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const handleServiceSelect = (serviceId: string) => {
    if (!context) return;
    if (serviceId === 'complaint') {
      context.setCurrentScreen('form');
    } else if (serviceId === 'track') {
      context.setCurrentScreen('track');
    } else if (serviceId === 'pay') {
      context.setCurrentScreen('pay');
    }
  };

  const handleReadAloud = useCallback(() => {
    speak(
      'Please select a service. ' +
      'Option 1: Report Issue - Submit a new urban issue. ' +
      'Option 2: Track Report - Check the status of your existing issue. ' +
      'Option 3: Pay Bill - Pay your electricity, water, or gas bills. ' +
      'Tap on your choice to continue.'
    );
  }, [speak]);

  if (!context) return null;

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center gap-8 p-8 relative overflow-hidden">
      {/* Read Aloud Button */}
      <ReadAloudButton onRead={handleReadAloud} isSpeaking={isSpeaking} />

      {/* Background glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Select Service</h2>
        <div className="grid grid-cols-1 gap-6 w-full max-w-3xl mx-auto">
          {services.map((service, idx) => (
            <button
              key={service.id}
              onClick={() => handleServiceSelect(service.id)}
              className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                animation: `slideIn ${0.5 + idx * 0.1}s ease-out both`,
              }}
            >
              {/* Glass card background */}
              <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 group-hover:border-cyan-500/50 transition-colors"></div>

              {/* Gradient accent */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>

              {/* Glow effect on hover */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300 -z-10`}></div>

              <div className="relative p-8 text-left">
                <div className="text-6xl mb-4 transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-300 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-300 group-hover:text-slate-100 transition-colors">
                  {service.description}
                </p>
                <div className="absolute top-4 right-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Grievance Form — delegates to the full GrievanceWizard component
export function GrievanceFormScreen() {
  return <GrievanceWizard />;
}

// Track Report — delegates to the TrackReport component
export function TrackReportScreen() {
  return <TrackReport />;
}

// Bill Payment — delegates to the BillPayment component
export function BillPaymentScreen() {
  return <BillPayment />;
}

// Success Screen
export function SuccessScreen() {
  const context = useContext(KioskContext);
  const { speak, isSpeaking } = useKioskTTS();

  const [showTracking, setShowTracking] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (showTracking) {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + Math.random() * 25;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showTracking]);

  const handleRestart = () => {
    if (!context) return;
    context.setCurrentScreen('attract');
    context.setFormData({});
    context.setComplaintId('');
    context.setLanguage('english');
  };

  const getStatusLabel = () => {
    if (progress < 25) return 'Filed';
    if (progress < 50) return 'Assigned';
    if (progress < 75) return 'In Progress';
    return 'Resolved';
  };

  const handleReadAloud = useCallback(() => {
    const complaintId = context?.complaintId || 'your reference number';
    speak(
      `Your issue has been submitted successfully! ` +
      `Your reference number is ${complaintId}. ` +
      `Please save this number to track your issue status. ` +
      `You will receive updates via SMS. ` +
      `Tap Track Status to view the progress, or Return to Home to start a new session.`
    );
  }, [speak, context?.complaintId]);

  if (!context) return null;

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-8 p-8 text-center overflow-y-auto relative">
      {/* Read Aloud Button */}
      <ReadAloudButton onRead={handleReadAloud} isSpeaking={isSpeaking} />

      <div className="text-7xl mb-4 animate-in zoom-in">✓</div>
      <h2 className="text-4xl font-bold text-green-400">Issue Submitted Successfully</h2>
      <p className="text-2xl text-slate-300">Your report has been recorded in UrbanLynk</p>

      <div className="bg-slate-800 p-8 rounded-lg border-2 border-cyan-500 w-full max-w-md">
        <p className="text-slate-400 text-lg mb-3">Reference Number</p>
        <p className="text-3xl font-mono font-bold text-cyan-400 mb-6">{context.complaintId}</p>
        <p className="text-slate-300 text-sm">
          Save this number to track your issue status. You will receive updates via SMS.
        </p>
      </div>

      {!showTracking ? (
        <button
          onClick={() => setShowTracking(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors w-full max-w-md"
        >
          Track Status
        </button>
      ) : (
        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xl font-bold text-white">Live Tracking</h3>

          {/* Timeline */}
          <div className="space-y-4">
            {[
              { step: 'Filed', percentage: 0 },
              { step: 'Assigned', percentage: 33 },
              { step: 'In Progress', percentage: 66 },
              { step: 'Resolved', percentage: 100 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="relative w-10 h-10 flex-shrink-0">
                  {progress >= item.percentage ? (
                    <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                  ) : progress > item.percentage - 20 ? (
                    <div className="w-full h-full rounded-full border-4 border-cyan-500 animate-pulse"></div>
                  ) : (
                    <div className="w-full h-full rounded-full border-4 border-slate-600"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-semibold ${progress >= item.percentage ? 'text-green-400' : progress > item.percentage - 20 ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {item.step}
                  </p>
                </div>
                {progress >= item.percentage && (
                  <p className="text-xs text-slate-400">Complete</p>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-400">
              {Math.min(Math.round(progress), 100)}% complete • Est. resolution: ~18 hours
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg text-sm transition-colors w-full"
          >
            Back to Home
          </button>
        </div>
      )}

      {!showTracking && (
        <>
          <button
            onClick={handleRestart}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors w-full max-w-md"
          >
            Return to Home
          </button>
        </>
      )}

      <p className="text-slate-500 text-sm">Session will auto-reset after 2 minutes of inactivity</p>
    </div>
  );
}
