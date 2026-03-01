'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useContext,
} from 'react';

/* ── MUI 5 ─────────────────────────────────────────────────────── */
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  MenuItem,
  Paper,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  Divider,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ReplayIcon from '@mui/icons-material/Replay';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

/* ── Third-party ───────────────────────────────────────────────── */
import Webcam from 'react-webcam';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';

/* ── Local ─────────────────────────────────────────────────────── */
import { db, type GrievanceRecord } from '@/lib/grievance-db';
import { KioskContext } from '@/app/kiosk/layout';
import { useKioskTTS } from '@/hooks/use-kiosk-tts';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & THEME
   ═══════════════════════════════════════════════════════════════════ */
const STEPS = ['Details', 'Evidence', 'Review'];
const DEPARTMENTS = ['Water', 'Electricity', 'Waste', 'Roads'] as const;

/** Dark kiosk-friendly MUI theme */
const kioskTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#06b6d4' },   // cyan-500
    secondary: { main: '#8b5cf6' }, // violet-500
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
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
    },
  },
});

/* ═══════════════════════════════════════════════════════════════════
   HELPER — Generate unique submission ID
   ═══════════════════════════════════════════════════════════════════ */
function generateSubmissionId(): string {
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `UL-2026-${rand}`;
}

/* ═══════════════════════════════════════════════════════════════════
   TTS (Text-to-Speech) - Now handled by useKioskTTS hook
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   HELPER — Generate PDF receipt
   ═══════════════════════════════════════════════════════════════════ */
function generateReceipt(data: {
  submissionId: string;
  userName: string;
  department: string;
  complaint: string;
  timestamp: string;
  isOffline: boolean;
}) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(22);
  doc.text('UrbanLynk — Grievance Receipt', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('Smart City Citizen Kiosk', 105, 28, { align: 'center' });

  // Body
  doc.setTextColor(30, 41, 59);
  let y = 55;
  const left = 20;

  const addField = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label, left, y);
    y += 6;
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(value, left, y);
    y += 12;
  };

  addField('Submission ID', data.submissionId);
  addField('Citizen Name', data.userName);
  addField('Department', data.department);
  addField('Complaint', doc.splitTextToSize(data.complaint, 170).join('\n'));
  // Adjust y if complaint is multi-line
  const lines = doc.splitTextToSize(data.complaint, 170);
  if (lines.length > 1) y += (lines.length - 1) * 6;
  addField('Date / Time', new Date(data.timestamp).toLocaleString());
  addField(
    'Connectivity',
    data.isOffline
      ? 'Submitted OFFLINE — will sync when connectivity is restored'
      : 'Submitted ONLINE',
  );

  // Footer
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y + 2, 190, y + 2);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This receipt is auto-generated. Please retain for your records.',
    105,
    y,
    { align: 'center' },
  );

  doc.save(`UrbanLynk_Receipt_${data.submissionId}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function GrievanceWizard() {
  const kioskCtx = useContext(KioskContext);
  
  /* ── TTS Hook ─────────────────────────────────────────────────── */
  const { speak, cancel: cancelTTS } = useKioskTTS();
  const navigate = useNavigate();

  /* ── Form state ───────────────────────────────────────────────── */
  const [activeStep, setActiveStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [department, setDepartment] = useState('');
  const [complaint, setComplaint] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [submissionTimestamp, setSubmissionTimestamp] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoReturnSeconds, setAutoReturnSeconds] = useState(15);

  const webcamRef = useRef<Webcam>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const autoReturnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const returnTriggeredRef = useRef(false);

  /* ── Online / offline detection ───────────────────────────────── */
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /* ── Capture webcam stream reference for cleanup ──────────────── */
  const handleUserMedia = useCallback((stream: MediaStream) => {
    webcamStreamRef.current = stream;
  }, []);

  interface SessionWipeOptions {
    skipTTSCancel?: boolean;
  }

  /* ── Cleanup: stop webcam + cancel TTS ────────────────────────── */
  const sessionWipe = useCallback((options?: SessionWipeOptions) => {
    // Stop webcam tracks
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    // Cancel any ongoing TTS unless explicitly preserved
    if (!options?.skipTTSCancel) {
      cancelTTS();
    }
    // Reset state
    setActiveStep(0);
    setUserName('');
    setDepartment('');
    setComplaint('');
    setPhoto(null);
    setSubmitted(false);
    setSubmissionId('');
    setSubmissionTimestamp('');
    setSubmitError(null);
    setAutoReturnSeconds(15);
  }, [cancelTTS, setAutoReturnSeconds]);

  const handleReturnHome = useCallback(
    (source: 'manual' | 'auto' = 'manual') => {
      if (returnTriggeredRef.current) return;
      returnTriggeredRef.current = true;

      if (autoReturnTimerRef.current) {
        clearInterval(autoReturnTimerRef.current);
        autoReturnTimerRef.current = null;
      }

      setAutoReturnSeconds(0);

      try {
        cancelTTS();
        speak(
          'Your report is complete. Your receipt has been generated. Returning to the main screen now.'
        );

        sessionWipe({ skipTTSCancel: true });
        kioskCtx?.setFormData({});
        kioskCtx?.setComplaintId('');

        const targetScreen = source === 'auto' ? 'attract' : 'services';
        kioskCtx?.setCurrentScreen(targetScreen);

        try {
          navigate('/attract-mode', { replace: true });
        } catch (navigationError) {
          console.error('Navigation to /attract-mode failed', navigationError);
        }
      } catch (error) {
        console.error('Secure return-to-home flow failed', error);
      }
    },
    [cancelTTS, kioskCtx, navigate, sessionWipe, speak, setAutoReturnSeconds],
  );

  /* ── Navigate back to services dashboard ──────────────────────── */
  const handleCancel = useCallback(() => {
    sessionWipe();
    kioskCtx?.setCurrentScreen('services');
  }, [sessionWipe, kioskCtx]);

  /* ── Receipt auto-return timer ────────────────────────────────── */
  useEffect(() => {
    if (!submitted) {
      if (autoReturnTimerRef.current) {
        clearInterval(autoReturnTimerRef.current);
        autoReturnTimerRef.current = null;
      }
      returnTriggeredRef.current = false;
      setAutoReturnSeconds(15);
      return;
    }

    returnTriggeredRef.current = false;
    setAutoReturnSeconds(15);

    if (typeof window === 'undefined') return;

    autoReturnTimerRef.current = window.setInterval(() => {
      setAutoReturnSeconds((prev) => {
        if (prev <= 1) {
          if (autoReturnTimerRef.current) {
            clearInterval(autoReturnTimerRef.current);
            autoReturnTimerRef.current = null;
          }
          handleReturnHome('auto');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoReturnTimerRef.current) {
        clearInterval(autoReturnTimerRef.current);
        autoReturnTimerRef.current = null;
      }
    };
  }, [submitted, handleReturnHome]);

  /* ── Step validation ──────────────────────────────────────────── */
  const isStep1Valid = userName.trim() !== '' && department !== '' && complaint.trim() !== '';

  /* ── TTS per step ─────────────────────────────────────────────── */
  const readStepAloud = useCallback(() => {
    switch (activeStep) {
      case 0:
        speak(
          `Step 1: Details. Please enter your name, select a department from Water, Electricity, Waste, or Roads, and describe your complaint. ` +
            (userName ? `Current name: ${userName}. ` : '') +
            (department ? `Selected department: ${department}. ` : '') +
            (complaint ? `Complaint: ${complaint}` : ''),
        );
        break;
      case 1:
        speak(
          `Step 2: Evidence. Use the camera to capture a photo of the issue. ` +
            (photo ? 'A photo has been captured. You can retake it if needed.' : 'No photo captured yet. Tap the Capture button.'),
        );
        break;
      case 2:
        speak(
          `Step 3: Review. Please confirm your submission. Name: ${userName}. Department: ${department}. Complaint: ${complaint}. ` +
            (photo ? 'Photo attached.' : 'No photo attached.') +
            ` Press Submit to complete.`,
        );
        break;
      default:
        break;
    }
  }, [activeStep, userName, department, complaint, photo, speak]);

  /* ── Webcam helpers ───────────────────────────────────────────── */
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) setPhoto(imageSrc);
    }
  }, []);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  /* ── Submit logic ─────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    const id = generateSubmissionId();
    const ts = new Date().toISOString();
    setSubmissionId(id);
    setSubmissionTimestamp(ts);

    const payload: GrievanceRecord = {
      submissionId: id,
      userName,
      department,
      complaint,
      photo: photo ?? '',
      timestamp: ts,
      synced: false,
    };

    try {
      if (navigator.onLine) {
        /* ── ONLINE: POST to API ─────────────────────────────────── */
        const res = await fetch('/api/grievance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Server responded with ${res.status}`);

        payload.synced = true;
      }
    } catch {
      /* Network error or server error — fall through to IndexedDB */
    }

    // Always persist locally (as backup or offline queue)
    try {
      await db.grievances.add(payload);
    } catch (dbErr) {
      console.error('Dexie insert failed', dbErr);
    }

    // Update parent context
    if (kioskCtx) {
      kioskCtx.setComplaintId(id);
      kioskCtx.setFormData({ userName, department, complaint, photo: photo ?? '' });
    }

    setSubmitted(true);
  }, [userName, department, complaint, photo, kioskCtx]);

  /* ── Receipt download ─────────────────────────────────────────── */
  const handleDownloadReceipt = useCallback(() => {
    generateReceipt({
      submissionId,
      userName,
      department,
      complaint,
      timestamp: submissionTimestamp,
      isOffline: !isOnline,
    });
  }, [submissionId, userName, department, complaint, submissionTimestamp, isOnline]);

  /* ═════════════════════════════════════════════════════════════════
     RENDER — SUCCESS SCREEN (after submit)
     ═════════════════════════════════════════════════════════════════ */
  if (submitted) {
    return (
      <ThemeProvider theme={kioskTheme}>
        <CssBaseline />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100%"
          gap={3}
          p={4}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main' }} />
          <Typography variant="h4" fontWeight={700} color="success.main">
            Grievance Submitted
          </Typography>

          <Chip
            icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
            label={isOnline ? 'Sent Online' : 'Saved Offline — will sync later'}
            color={isOnline ? 'success' : 'warning'}
            variant="outlined"
            sx={{ fontSize: '0.95rem', py: 2.5, px: 1 }}
          />

          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 420, width: '100%' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Reference Number
            </Typography>
            <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
              {submissionId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(submissionTimestamp).toLocaleString()}
            </Typography>
          </Paper>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReceipt}
            size="large"
            fullWidth
            sx={{ maxWidth: 420 }}
          >
            Download PDF Receipt
          </Button>

          <Alert
            severity="warning"
            sx={{
              width: '100%',
              maxWidth: 420,
              fontWeight: 600,
              textAlign: 'left',
            }}
          >
            Auto-returning to the main dashboard in {autoReturnSeconds}s to protect your data.
          </Alert>

          <Button
            variant="contained"
            onClick={() => handleReturnHome('manual')}
            size="large"
            fullWidth
            sx={{
              maxWidth: 420,
              height: 72,
              fontSize: '1.4rem',
              fontWeight: 800,
              letterSpacing: 0.5,
              bgcolor: '#f97316',
              color: '#0f172a',
              boxShadow: '0 20px 45px rgba(249, 115, 22, 0.4)',
              '&:hover': {
                bgcolor: '#ea580c',
                boxShadow: '0 20px 55px rgba(234, 88, 12, 0.5)',
              },
            }}
          >
            Return to Home
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  /* ═════════════════════════════════════════════════════════════════
     RENDER — WIZARD STEPS
     ═════════════════════════════════════════════════════════════════ */
  return (
    <ThemeProvider theme={kioskTheme}>
      <CssBaseline />
      <Box
        display="flex"
        flexDirection="column"
        height="100%"
        overflow="auto"
        p={{ xs: 2, sm: 4 }}
        gap={3}
      >
        {/* ── Header row ────────────────────────────────────────── */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight={700}>
            Report Issue
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Chip
              icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
              label={isOnline ? 'Online' : 'Offline'}
              size="small"
              color={isOnline ? 'success' : 'warning'}
              variant="outlined"
            />
            <Tooltip title="Read this step aloud">
              <IconButton onClick={readStepAloud} color="primary" aria-label="Read step instructions aloud">
                <VolumeUpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel & return">
              <IconButton onClick={handleCancel} color="error" aria-label="Cancel and return to services">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ── Stepper ───────────────────────────────────────────── */}
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ── Step content ──────────────────────────────────────── */}
        <Box flex={1} overflow="auto">
          {activeStep === 0 && (
            <StepDetails
              userName={userName}
              setUserName={setUserName}
              department={department}
              setDepartment={setDepartment}
              complaint={complaint}
              setComplaint={setComplaint}
            />
          )}

          {activeStep === 1 && (
            <StepEvidence
              webcamRef={webcamRef}
              onUserMedia={handleUserMedia}
              photo={photo}
              onCapture={capturePhoto}
              onRetake={retakePhoto}
            />
          )}

          {activeStep === 2 && (
            <StepReview
              userName={userName}
              department={department}
              complaint={complaint}
              photo={photo}
            />
          )}
        </Box>

        {/* ── Error banner ──────────────────────────────────────── */}
        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* ── Navigation ────────────────────────────────────────── */}
        <Box display="flex" gap={2} justifyContent="space-between" pt={1}>
          <Button
            variant="outlined"
            onClick={() =>
              activeStep === 0 ? handleCancel() : setActiveStep((s) => s - 1)
            }
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              disabled={activeStep === 0 && !isStep1Valid}
              onClick={() => setActiveStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 1 — Details
   ═══════════════════════════════════════════════════════════════════ */
interface StepDetailsProps {
  userName: string;
  setUserName: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  complaint: string;
  setComplaint: (v: string) => void;
}

function StepDetails({
  userName,
  setUserName,
  department,
  setDepartment,
  complaint,
  setComplaint,
}: StepDetailsProps) {
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h6" gutterBottom>
        Step 1 — Provide Issue Details
      </Typography>

      <TextField
        label="Your Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        required
        inputProps={{ 'aria-label': 'Your full name' }}
      />

      <TextField
        select
        label="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        required
        inputProps={{ 'aria-label': 'Select department' }}
      >
        <MenuItem value="" disabled>
          Select department…
        </MenuItem>
        {DEPARTMENTS.map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Describe the Complaint"
        value={complaint}
        onChange={(e) => setComplaint(e.target.value)}
        multiline
        minRows={4}
        maxRows={8}
        required
        inputProps={{ 'aria-label': 'Describe your complaint in detail' }}
      />
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 2 — Evidence (Webcam)
   ═══════════════════════════════════════════════════════════════════ */
interface StepEvidenceProps {
  webcamRef: React.RefObject<Webcam | null>;
  onUserMedia: (stream: MediaStream) => void;
  photo: string | null;
  onCapture: () => void;
  onRetake: () => void;
}

function StepEvidence({
  webcamRef,
  onUserMedia,
  photo,
  onCapture,
  onRetake,
}: StepEvidenceProps) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
      <Typography variant="h6" gutterBottom>
        Step 2 — Capture Evidence Photo
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Take a photo of the issue. You can skip this step if no photo is available.
      </Typography>

      {!photo ? (
        <>
          <Paper
            variant="outlined"
            sx={{
              width: '100%',
              maxWidth: 480,
              overflow: 'hidden',
              borderRadius: 2,
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
            }}
          >
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment', width: 640, height: 480 }}
              onUserMedia={onUserMedia}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Paper>

          <Button
            variant="contained"
            startIcon={<CameraAltIcon />}
            onClick={onCapture}
            size="large"
          >
            Capture Photo
          </Button>
        </>
      ) : (
        <>
          <Paper
            variant="outlined"
            sx={{
              width: '100%',
              maxWidth: 480,
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            <Box
              component="img"
              src={photo}
              alt="Captured evidence"
              sx={{ width: '100%', display: 'block' }}
            />
          </Paper>

          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={onRetake}
          >
            Retake Photo
          </Button>
        </>
      )}
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 3 — Review
   ═══════════════════════════════════════════════════════════════════ */
interface StepReviewProps {
  userName: string;
  department: string;
  complaint: string;
  photo: string | null;
}

function StepReview({ userName, department, complaint, photo }: StepReviewProps) {
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h6" gutterBottom>
        Step 3 — Review &amp; Confirm
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Name
        </Typography>
        <Typography variant="body1" gutterBottom>
          {userName}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" color="text.secondary">
          Department
        </Typography>
        <Typography variant="body1" gutterBottom>
          {department}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" color="text.secondary">
          Complaint
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {complaint}
        </Typography>
      </Paper>

      {photo && (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Captured Photo
          </Typography>
          <Box
            component="img"
            src={photo}
            alt="Evidence photo preview"
            sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 1 }}
          />
        </Paper>
      )}

      {!photo && (
        <Alert severity="info">
          No photo was captured. The report will be submitted without an evidence image.
        </Alert>
      )}
    </Box>
  );
}
