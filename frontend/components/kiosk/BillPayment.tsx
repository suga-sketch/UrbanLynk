'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useContext,
} from 'react';

/* ── MUI ────────────────────────────────────────────────────────── */
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Alert,
  Divider,
  CircularProgress,
  Fade,
  Grow,
  Chip,
  LinearProgress,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DownloadIcon from '@mui/icons-material/Download';
import ReplayIcon from '@mui/icons-material/Replay';
import BackspaceIcon from '@mui/icons-material/Backspace';
import PaymentIcon from '@mui/icons-material/Payment';

/* ── Third-party ────────────────────────────────────────────────── */
import { jsPDF } from 'jspdf';

/* ── Local ──────────────────────────────────────────────────────── */
import { KioskContext } from '@/app/kiosk/layout';
import { useKioskTTS } from '@/hooks/use-kiosk-tts';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */
interface BillDetails {
  consumerName: string;
  consumerId: string;
  service: string;
  amount: number;
  dueDate: string;
  tariff: string;
  units: number;
  billDate: string;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  consumerId: string;
  service: string;
  timestamp: string;
}

type Screen =
  | 'select-service'
  | 'enter-id'
  | 'bill-details'
  | 'processing'
  | 'success'
  | 'failure';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & THEME
   ═══════════════════════════════════════════════════════════════════ */
const IDLE_TIMEOUT_SEC = 90;

const SERVICES = [
  {
    id: 'electricity',
    label: 'Electricity',
    icon: <ElectricBoltIcon sx={{ fontSize: 48 }} />,
    color: '#facc15',
    bg: 'linear-gradient(135deg, #422006 0%, #713f12 100%)',
  },
  {
    id: 'water',
    label: 'Water',
    icon: <WaterDropIcon sx={{ fontSize: 48 }} />,
    color: '#38bdf8',
    bg: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
  },
  {
    id: 'gas',
    label: 'Gas',
    icon: <LocalFireDepartmentIcon sx={{ fontSize: 48 }} />,
    color: '#f97316',
    bg: 'linear-gradient(135deg, #431407 0%, #7c2d12 100%)',
  },
] as const;

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'] as const;

/** Dark kiosk-friendly MUI theme */
const kioskTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#06b6d4' },
    secondary: { main: '#8b5cf6' },
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    background: { default: '#0f172a', paper: '#1e293b' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { padding: '12px 28px', fontSize: '1rem' },
      },
    },
  },
});

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
function generateTransactionId(): string {
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `TXN-${Date.now()}-${rand}`;
}

/** Mock bill data keyed by service type */
function mockFetchBill(service: string, consumerId: string): Promise<BillDetails> {
  return new Promise((resolve) => {
    const data: Record<string, Omit<BillDetails, 'consumerId' | 'service'>> = {
      electricity: {
        consumerName: 'Rajesh Kumar',
        amount: 2475.0,
        dueDate: '2026-03-15',
        tariff: 'Domestic LT-1A',
        units: 312,
        billDate: '2026-02-01',
      },
      water: {
        consumerName: 'Priya Sharma',
        amount: 845.5,
        dueDate: '2026-03-20',
        tariff: 'Residential Slab-II',
        units: 18000,
        billDate: '2026-02-05',
      },
      gas: {
        consumerName: 'Anita Reddy',
        amount: 1120.0,
        dueDate: '2026-03-18',
        tariff: 'PNG Domestic',
        units: 14,
        billDate: '2026-02-03',
      },
    };

    const bill = data[service] ?? data.electricity!;
    setTimeout(() => {
      resolve({ ...bill, consumerId, service });
    }, 1500); // simulate network delay
  });
}

/* TTS - Now handled by useKioskTTS hook */

/** Generate a PDF receipt */
function generateReceipt(result: PaymentResult): void {
  const doc = new jsPDF({ unit: 'mm', format: [80, 160] }); // receipt-style narrow format

  const cx = 40; // center X
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 80, 160, 'F');

  // Header
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(14);
  doc.text('UrbanLynk', cx, 12, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Payment Receipt', cx, 18, { align: 'center' });

  // Divider
  doc.setDrawColor(51, 65, 85);
  doc.line(5, 22, 75, 22);

  // Body
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(9);
  const rows = [
    ['Transaction ID', result.transactionId],
    ['Consumer ID', result.consumerId],
    ['Service', result.service.charAt(0).toUpperCase() + result.service.slice(1)],
    ['Amount Paid', `₹${result.amount.toFixed(2)}`],
    ['Date & Time', new Date(result.timestamp).toLocaleString('en-IN')],
    ['Status', 'SUCCESS'],
  ];

  let y = 30;
  rows.forEach(([label, value]) => {
    doc.setTextColor(148, 163, 184);
    doc.text(label, 8, y);
    doc.setTextColor(226, 232, 240);
    doc.text(value, 72, y, { align: 'right' });
    y += 8;
  });

  // Footer divider
  doc.setDrawColor(51, 65, 85);
  doc.line(5, y + 2, 75, y + 2);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text('Thank you for using UrbanLynk Kiosk.', cx, y + 10, { align: 'center' });
  doc.text('This is a computer-generated receipt.', cx, y + 15, { align: 'center' });

  doc.save(`receipt-${result.transactionId}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════════
   Razorpay mock / sandbox helper
   ═══════════════════════════════════════════════════════════════════ */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: () => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function initiateRazorpay(
  bill: BillDetails,
  onSuccess: (paymentId: string) => void,
  onFailure: (reason: string) => void,
) {
  /* ── If Razorpay SDK loaded, use sandbox ─────────────────────── */
  if (window.Razorpay) {
    const options: Record<string, unknown> = {
      key: 'rzp_test_DEMO_KEY_urbanlynk', // sandbox key placeholder
      amount: Math.round(bill.amount * 100), // paise
      currency: 'INR',
      name: 'UrbanLynk',
      description: `${bill.service.charAt(0).toUpperCase() + bill.service.slice(1)} Bill — ${bill.consumerId}`,
      handler: (response: { razorpay_payment_id: string }) => {
        onSuccess(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => onFailure('Payment cancelled by user'),
      },
      prefill: {
        name: bill.consumerName,
        email: 'citizen@urbanlynk.in',
        contact: '9876543210',
      },
      theme: { color: '#06b6d4' },
    };

    try {
      const razorpay = new window.Razorpay!(options);
      razorpay.on('payment.failed', () =>
        onFailure('Payment failed. Please retry.'),
      );
      razorpay.open();
    } catch {
      // Fallback to mock
      mockPayment(bill, onSuccess, onFailure);
    }
    return;
  }

  /* ── Fallback mock when SDK is unavailable ────────────────────── */
  mockPayment(bill, onSuccess, onFailure);
}

/** Pure mock that simulates a 2-second payment gateway */
function mockPayment(
  bill: BillDetails,
  onSuccess: (paymentId: string) => void,
  onFailure: (reason: string) => void,
) {
  // simulate 80% success rate
  setTimeout(() => {
    if (Math.random() > 0.2) {
      onSuccess(`pay_mock_${Date.now()}`);
    } else {
      onFailure('Payment declined by bank. Please retry.');
    }
  }, 2000);
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function BillPayment() {
  const kioskCtx = useContext(KioskContext);

  /* ── TTS Hook ─────────────────────────────────────────────────── */
  const { speak, cancel: cancelTTS, isSpeaking } = useKioskTTS();

  /* ── Local State ─────────────────────────────────────────────── */
  const [screen, setScreen] = useState<Screen>('select-service');
  const [selectedService, setSelectedService] = useState<string>('');
  const [consumerId, setConsumerId] = useState<string>('');
  const [bill, setBill] = useState<BillDetails | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [failReason, setFailReason] = useState('');
  const [receiptGenerated, setReceiptGenerated] = useState(false);

  /* ── Idle timer (90 s) ───────────────────────────────────────── */
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      wipeSession();
      if (kioskCtx) kioskCtx.setCurrentScreen('attract');
    }, IDLE_TIMEOUT_SEC * 1000);
  }, [kioskCtx]);

  useEffect(() => {
    resetIdleTimer();
    const events = ['click', 'touchstart', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    return () => {
      if (idleRef.current) clearTimeout(idleRef.current);
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
    };
  }, [resetIdleTimer]);

  /* ── Network detection ───────────────────────────────────────── */
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /* ── Load Razorpay SDK on mount ──────────────────────────────── */
  useEffect(() => {
    loadRazorpayScript().catch(() => {});
  }, []);

  /* ── Session wipe ────────────────────────────────────────────── */
  const wipeSession = useCallback(() => {
    setScreen('select-service');
    setSelectedService('');
    setConsumerId('');
    setBill(null);
    setFetching(false);
    setFetchError('');
    setPaymentResult(null);
    setFailReason('');
    setReceiptGenerated(false);
    cancelTTS();
  }, [cancelTTS]);

  /* ── Navigate back safely ────────────────────────────────────── */
  const goBack = () => {
    if (screen === 'enter-id') {
      setConsumerId('');
      setScreen('select-service');
    } else if (screen === 'bill-details') {
      setBill(null);
      setFetchError('');
      setScreen('enter-id');
    } else if (screen === 'failure') {
      setFailReason('');
      setScreen('bill-details');
    } else {
      wipeSession();
      kioskCtx?.setCurrentScreen('services');
    }
  };

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setScreen('enter-id');
  };

  const handleNumpad = (key: string) => {
    if (key === 'DEL') {
      setConsumerId((prev) => prev.slice(0, -1));
    } else if (key !== '' && consumerId.length < 12) {
      setConsumerId((prev) => prev + key);
    }
  };

  const handleFetchBill = async () => {
    if (!isOnline) {
      setFetchError('No internet connection. Please connect and retry.');
      return;
    }
    setFetching(true);
    setFetchError('');
    try {
      const data = await mockFetchBill(selectedService, consumerId);
      setBill(data);
      setScreen('bill-details');
    } catch {
      setFetchError('Failed to fetch bill. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  const handlePayNow = () => {
    if (!isOnline) return;
    setScreen('processing');

    initiateRazorpay(
      bill!,
      (paymentId) => {
        const result: PaymentResult = {
          success: true,
          transactionId: paymentId || generateTransactionId(),
          amount: bill!.amount,
          consumerId: bill!.consumerId,
          service: bill!.service,
          timestamp: new Date().toISOString(),
        };
        setPaymentResult(result);
        setScreen('success');
      },
      (reason) => {
        setFailReason(reason);
        setScreen('failure');
      },
    );
  };

  const handleDownloadReceipt = () => {
    if (!paymentResult) return;
    generateReceipt(paymentResult);
    setReceiptGenerated(true);
    // Wipe sensitive data after short delay so user sees download
    setTimeout(() => wipeSession(), 4000);
  };

  const handleReadAloud = useCallback(() => {
    if (!bill) return;
    const text = `
      Your ${bill.service} bill details.
      Consumer Name: ${bill.consumerName}.
      Consumer ID: ${bill.consumerId}.
      Bill Amount: ${bill.amount} rupees.
      Due Date: ${new Date(bill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
      Tariff: ${bill.tariff}.
      To pay, tap the Pay Now button. An active internet connection is required for payment.
    `;
    speak(text.trim());
  }, [bill, speak]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER — Each screen is a sub-function for clarity
     ═══════════════════════════════════════════════════════════════ */

  /** Top bar with back + online chip */
  const TopBar = ({ title }: { title: string }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={goBack} sx={{ color: 'primary.main' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={700} color="white">
          {title}
        </Typography>
      </Box>
      <Chip
        icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
        label={isOnline ? 'Online' : 'Offline'}
        size="small"
        color={isOnline ? 'success' : 'error'}
        variant="outlined"
      />
    </Box>
  );

  /* ── 1. Service Selection ────────────────────────────────────── */
  const renderServiceSelection = () => (
    <Fade in>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar title="Pay Bill" />

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            px: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <PaymentIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="white">
              Select Utility Service
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Choose a service to view and pay your bill
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 3,
              width: '100%',
              maxWidth: 700,
            }}
          >
            {SERVICES.map((svc) => (
              <Paper
                key={svc.id}
                onClick={() => handleServiceSelect(svc.id)}
                elevation={4}
                sx={{
                  background: svc.bg,
                  border: '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  py: 5,
                  px: 2,
                  minHeight: 160,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    borderColor: svc.color,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 30px ${svc.color}33`,
                  },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                <Box sx={{ color: svc.color }}>{svc.icon}</Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="white"
                  sx={{ fontSize: '1.15rem' }}
                >
                  {svc.label}
                </Typography>
              </Paper>
            ))}
          </Box>

          {!isOnline && (
            <Alert severity="warning" sx={{ maxWidth: 700, width: '100%' }}>
              You are offline. Bill fetch & payments require an internet connection.
            </Alert>
          )}
        </Box>
      </Box>
    </Fade>
  );

  /* ── 2. Consumer ID Entry (numeric keypad) ───────────────────── */
  const renderEnterID = () => (
    <Fade in>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar
          title={`${selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} — Enter Consumer ID`}
        />

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            px: 3,
          }}
        >
          {/* Display */}
          <Paper
            sx={{
              width: '100%',
              maxWidth: 420,
              py: 3,
              px: 4,
              textAlign: 'center',
              background: 'rgba(30,41,59,0.9)',
              border: '2px solid',
              borderColor: consumerId.length > 0 ? 'primary.main' : 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Consumer ID
            </Typography>
            <Typography
              variant="h3"
              fontFamily="monospace"
              fontWeight={700}
              color="white"
              sx={{ letterSpacing: 4, minHeight: 50 }}
            >
              {consumerId || '—'}
            </Typography>
          </Paper>

          {fetchError && (
            <Alert severity="error" sx={{ maxWidth: 420, width: '100%' }}>
              {fetchError}
            </Alert>
          )}

          {/* Numpad */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
              width: '100%',
              maxWidth: 360,
            }}
          >
            {NUMPAD_KEYS.map((key, idx) => {
              if (key === '') return <Box key={idx} />;
              const isDel = key === 'DEL';
              return (
                <Button
                  key={idx}
                  variant={isDel ? 'outlined' : 'contained'}
                  color={isDel ? 'error' : 'inherit'}
                  onClick={() => handleNumpad(key)}
                  sx={{
                    fontSize: isDel ? '1rem' : '1.5rem',
                    fontWeight: 700,
                    py: 2,
                    minHeight: 64,
                    bgcolor: isDel ? 'transparent' : 'grey.800',
                    '&:hover': { bgcolor: isDel ? 'error.dark' : 'grey.700' },
                  }}
                >
                  {isDel ? <BackspaceIcon /> : key}
                </Button>
              );
            })}
          </Box>

          {/* Fetch bill */}
          <Button
            variant="contained"
            size="large"
            disabled={consumerId.length < 4 || fetching || !isOnline}
            onClick={handleFetchBill}
            sx={{
              width: '100%',
              maxWidth: 360,
              py: 2,
              fontSize: '1.15rem',
            }}
          >
            {fetching ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Fetch Bill'
            )}
          </Button>

          {!isOnline && (
            <Alert severity="error" icon={<WifiOffIcon />} sx={{ maxWidth: 420 }}>
              Internet connection required to fetch bills.
            </Alert>
          )}
        </Box>
      </Box>
    </Fade>
  );

  /* ── 3. Bill Details ─────────────────────────────────────────── */
  const renderBillDetails = () => {
    if (!bill) return null;
    const svc = SERVICES.find((s) => s.id === selectedService);

    return (
      <Fade in>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <TopBar title="Bill Details" />

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 3,
              px: 3,
              gap: 3,
              overflowY: 'auto',
            }}
          >
            {/* Bill Card */}
            <Paper
              elevation={6}
              sx={{
                width: '100%',
                maxWidth: 500,
                p: 4,
                background: svc?.bg ?? 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: svc?.color }}>{svc?.icon}</Box>
                  <Typography variant="h6" fontWeight={700} color="white">
                    {bill.service.charAt(0).toUpperCase() + bill.service.slice(1)} Bill
                  </Typography>
                </Box>
                <IconButton onClick={handleReadAloud} sx={{ color: 'primary.main' }}>
                  <VolumeUpIcon />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {[
                { label: 'Consumer Name', value: bill.consumerName },
                { label: 'Consumer ID', value: bill.consumerId },
                { label: 'Bill Date', value: new Date(bill.billDate).toLocaleDateString('en-IN') },
                { label: 'Due Date', value: new Date(bill.dueDate).toLocaleDateString('en-IN') },
                { label: 'Units Consumed', value: `${bill.units}` },
                { label: 'Tariff', value: bill.tariff },
              ].map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {row.label}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="white">
                    {row.value}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Total Due
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  ₹{bill.amount.toFixed(2)}
                </Typography>
              </Box>
            </Paper>

            {/* Offline warning */}
            {!isOnline && (
              <Alert severity="error" icon={<WifiOffIcon />} sx={{ maxWidth: 500, width: '100%' }}>
                Payments require an active internet connection. Please try again later.
              </Alert>
            )}

            {/* Pay button */}
            <Button
              variant="contained"
              size="large"
              color="success"
              disabled={!isOnline}
              onClick={handlePayNow}
              startIcon={<PaymentIcon />}
              sx={{
                width: '100%',
                maxWidth: 500,
                py: 2.5,
                fontSize: '1.25rem',
                fontWeight: 700,
              }}
            >
              {isOnline ? `Pay ₹${bill.amount.toFixed(2)}` : 'Payment Unavailable (Offline)'}
            </Button>

            {/* Read aloud button */}
            <Button
              variant="outlined"
              startIcon={<VolumeUpIcon />}
              onClick={handleReadAloud}
              sx={{ maxWidth: 500, width: '100%' }}
            >
              Read Aloud
            </Button>
          </Box>
        </Box>
      </Fade>
    );
  };

  /* ── 4. Processing ───────────────────────────────────────────── */
  const renderProcessing = () => (
    <Fade in>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h5" fontWeight={600} color="white">
          Processing Payment…
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please do not close or navigate away.
        </Typography>
        <LinearProgress sx={{ width: '60%', borderRadius: 4 }} />
      </Box>
    </Fade>
  );

  /* ── 5. Success ──────────────────────────────────────────────── */
  const renderSuccess = () => (
    <Grow in>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          px: 3,
        }}
      >
        {/* Animated checkmark */}
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(34,197,94,0.4)',
            animation: 'pulse-glow 1.5s ease-in-out infinite',
            '@keyframes pulse-glow': {
              '0%, 100%': { boxShadow: '0 0 30px rgba(34,197,94,0.3)' },
              '50%': { boxShadow: '0 0 60px rgba(34,197,94,0.6)' },
            },
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'white' }} />
        </Box>

        <Typography variant="h4" fontWeight={800} color="success.main">
          Payment Successful!
        </Typography>

        {paymentResult && (
          <Paper
            sx={{
              p: 3,
              width: '100%',
              maxWidth: 450,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary" mb={1}>
              Transaction ID
            </Typography>
            <Typography
              variant="h6"
              fontFamily="monospace"
              fontWeight={700}
              color="primary.main"
              mb={2}
            >
              {paymentResult.transactionId}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Amount</Typography>
              <Typography fontWeight={700} color="white">
                ₹{paymentResult.amount.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Consumer ID</Typography>
              <Typography fontWeight={700} color="white">
                {paymentResult.consumerId}
              </Typography>
            </Box>
          </Paper>
        )}

        {!receiptGenerated ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReceipt}
            sx={{ maxWidth: 450, width: '100%', py: 2 }}
          >
            Download Receipt (PDF)
          </Button>
        ) : (
          <Alert
            severity="success"
            icon={<ReceiptLongIcon />}
            sx={{ maxWidth: 450, width: '100%' }}
          >
            Receipt downloaded. Session will reset shortly.
          </Alert>
        )}

        <Button
          variant="outlined"
          onClick={() => {
            wipeSession();
            kioskCtx?.setCurrentScreen('services');
          }}
          sx={{ maxWidth: 450, width: '100%' }}
        >
          Back to Services
        </Button>
      </Box>
    </Grow>
  );

  /* ── 6. Failure / Recovery ───────────────────────────────────── */
  const renderFailure = () => (
    <Fade in>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(239,68,68,0.35)',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 64, color: 'white' }} />
        </Box>

        <Typography variant="h4" fontWeight={800} color="error.main">
          Payment Failed
        </Typography>

        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={400}>
          {failReason || 'An unexpected error occurred during payment processing.'}
        </Typography>

        <Paper sx={{ p: 3, width: '100%', maxWidth: 450 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            mb={2}
            textAlign="center"
          >
            Your bill data is saved. You can retry the payment safely.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ReplayIcon />}
              onClick={() => {
                setFailReason('');
                setScreen('bill-details');
              }}
              sx={{ py: 2 }}
            >
              Retry Payment
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                wipeSession();
                kioskCtx?.setCurrentScreen('services');
              }}
              sx={{ py: 1.5 }}
            >
              Exit to Services
            </Button>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );

  /* ── Screen router ───────────────────────────────────────────── */
  const screenMap: Record<Screen, () => React.ReactNode> = {
    'select-service': renderServiceSelection,
    'enter-id': renderEnterID,
    'bill-details': renderBillDetails,
    processing: renderProcessing,
    success: renderSuccess,
    failure: renderFailure,
  };

  return (
    <ThemeProvider theme={kioskTheme}>
      <CssBaseline />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        {screenMap[screen]()}
      </Box>
    </ThemeProvider>
  );
}
