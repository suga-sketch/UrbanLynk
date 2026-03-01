'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from 'react';

/* ── MUI 5 ─────────────────────────────────────────────────────── */
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Divider,
  Alert,
  CircularProgress,
  Collapse,
  InputAdornment,
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import BackspaceIcon from '@mui/icons-material/Backspace';

/* ── Local ─────────────────────────────────────────────────────── */
import { db, type GrievanceRecord } from '@/lib/grievance-db';
import { KioskContext } from '@/app/kiosk/layout';
import { useKioskTTS } from '@/hooks/use-kiosk-tts';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

/** Lifecycle stages for the visual status tracker */
type LifecycleStage =
  | 'Submitted'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Escalated';

/** Unified report item merging backend + local data */
interface TrackableReport {
  tokenId: string;
  department: string;
  description: string;
  date: string; // ISO-8601
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Escalated' | 'Draft/Pending Sync';
  assignedTo: string | null;
  currentStage: number; // index into LIFECYCLE_STEPS
  source: 'online' | 'offline';
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & THEME
   ═══════════════════════════════════════════════════════════════════ */

const LIFECYCLE_STEPS: LifecycleStage[] = [
  'Submitted',
  'Assigned',
  'In Progress',
  'Resolved',
];

/** Status → MUI Chip color + background */
const STATUS_CONFIG: Record<
  TrackableReport['status'],
  { bg: string; color: string; label: string }
> = {
  Pending: { bg: '#fbbf24', color: '#78350f', label: 'Pending' },
  'In Progress': { bg: '#38bdf8', color: '#0c4a6e', label: 'In Progress' },
  Resolved: { bg: '#4ade80', color: '#14532d', label: 'Resolved' },
  Escalated: { bg: '#f87171', color: '#7f1d1d', label: 'Escalated' },
  'Draft/Pending Sync': { bg: '#a78bfa', color: '#3b0764', label: 'Draft / Pending Sync' },
};

/** Dark kiosk-friendly MUI theme — matches GrievanceWizard */
const kioskTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#06b6d4' },
    secondary: { main: '#8b5cf6' },
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

/** Idle timeout (seconds) before auto-clearing the screen */
const IDLE_TIMEOUT_SEC = 90;

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

/* TTS - Now handled by useKioskTTS hook */

/** Map raw backend status strings to our canonical status */
function normalizeStatus(raw: string): TrackableReport['status'] {
  const lower = raw.toLowerCase().replace(/[-_]/g, ' ');
  if (lower === 'resolved') return 'Resolved';
  if (lower === 'escalated') return 'Escalated';
  if (lower.includes('progress') || lower === 'assigned') return 'In Progress';
  return 'Pending';
}

/** Determine the lifecycle stepper index from status */
function stageIndex(status: TrackableReport['status']): number {
  switch (status) {
    case 'Resolved':
      return 3;
    case 'Escalated':
      return 3;
    case 'In Progress':
      return 2;
    case 'Pending':
      return 1;
    case 'Draft/Pending Sync':
    default:
      return 0;
  }
}

/** Format ISO date to human-friendly kiosk string */
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   STYLED STEPPER CONNECTOR (colour-coded progress)
   ═══════════════════════════════════════════════════════════════════ */
const ColorlibConnector = styled(StepConnector)(() => ({
  '& .MuiStepConnector-line': {
    borderColor: '#334155',
    borderTopWidth: 3,
    borderRadius: 2,
  },
  '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line':
    {
      borderColor: '#06b6d4',
    },
}));

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function TrackReport() {
  const kioskCtx = useContext(KioskContext);

  /* ── TTS Hook ─────────────────────────────────────────────────── */
  const { speak, cancel: cancelTTS, isSpeaking } = useKioskTTS();

  /* ── State ────────────────────────────────────────────────────── */
  const [reports, setReports] = useState<TrackableReport[]>([]);
  const [filtered, setFiltered] = useState<TrackableReport[]>([]);
  const [searchToken, setSearchToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [idleSeconds, setIdleSeconds] = useState(0);

  const idleRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Online / offline ─────────────────────────────────────────── */
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

  /* ── 90-second idle timer → auto-clear & go back ──────────────── */
  useEffect(() => {
    const resetIdle = () => {
      idleRef.current = 0;
      setIdleSeconds(0);
    };

    const tick = () => {
      idleRef.current += 1;
      setIdleSeconds(idleRef.current);
      if (idleRef.current >= IDLE_TIMEOUT_SEC) {
        handleSessionClear();
      }
    };

    window.addEventListener('click', resetIdle);
    window.addEventListener('touchstart', resetIdle);
    window.addEventListener('keydown', resetIdle);
    idleTimerRef.current = setInterval(tick, 1000);

    return () => {
      window.removeEventListener('click', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Session safety: clear everything ─────────────────────────── */
  const handleSessionClear = useCallback(() => {
    cancelTTS();
    setReports([]);
    setFiltered([]);
    setSearchToken('');
    setExpandedCard(null);
    setError(null);
    kioskCtx?.setCurrentScreen('services');
  }, [kioskCtx, cancelTTS]);

  /* ── Data fetching: merge online API + offline Dexie ──────────── */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const merged: TrackableReport[] = [];

    /* ── Source 1: Backend API (online) ────────────────────────── */
    if (navigator.onLine) {
      try {
        const token = typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem('jwt') || ''
          : '';
        const phone = kioskCtx?.formData?.phone || '';

        const res = await fetch('/api/grievance/status', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(phone ? { 'X-Phone': phone } : {}),
          },
        });

        if (res.ok) {
          const data: any[] = await res.json();
          data.forEach((item: any) => {
            merged.push({
              tokenId: item.refId || item.submissionId || item.id,
              department: item.category || item.department || 'General',
              description: item.description || item.complaint || '',
              date: item.createdAt || item.timestamp || new Date().toISOString(),
              status: normalizeStatus(item.status || 'new'),
              assignedTo: item.assignedTo || null,
              currentStage: stageIndex(normalizeStatus(item.status || 'new')),
              source: 'online',
            });
          });
        }
      } catch {
        // API unreachable — continue with offline data only
      }
    }

    /* ── Source 2: Dexie / IndexedDB (offline drafts) ─────────── */
    try {
      const localRecords = await db.grievances.toArray();
      localRecords.forEach((rec: GrievanceRecord) => {
        // Check if this record already came from the backend
        const alreadyMerged = merged.some(
          (r) => r.tokenId === rec.submissionId,
        );
        if (!alreadyMerged) {
          // Unsynced local draft
          merged.push({
            tokenId: rec.submissionId,
            department: rec.department,
            description: rec.complaint,
            date: rec.timestamp,
            status: rec.synced ? 'Pending' : 'Draft/Pending Sync',
            assignedTo: null,
            currentStage: rec.synced ? 1 : 0,
            source: 'offline',
          });
        }
      });
    } catch {
      console.warn('Could not read from IndexedDB');
    }

    // Sort by date descending (newest first)
    merged.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    setReports(merged);
    setFiltered(merged);
    setLoading(false);

    if (merged.length === 0) {
      setError('No reports found. Submit a grievance first.');
    }
  }, [kioskCtx]);

  /* ── Initial load ─────────────────────────────────────────────── */
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ── Search filter ────────────────────────────────────────────── */
  useEffect(() => {
    if (!searchToken.trim()) {
      setFiltered(reports);
    } else {
      const q = searchToken.trim().toUpperCase();
      setFiltered(
        reports.filter((r) => r.tokenId.toUpperCase().includes(q)),
      );
    }
  }, [searchToken, reports]);

  /* ── Numpad helpers ───────────────────────────────────────────── */
  const handleNumpadPress = (val: string) => {
    setSearchToken((prev) => prev + val);
  };
  const handleNumpadBackspace = () => {
    setSearchToken((prev) => prev.slice(0, -1));
  };
  const handleNumpadClear = () => {
    setSearchToken('');
  };

  /* ── TTS: Read a report card aloud ────────────────────────────── */
  const readCardAloud = useCallback((report: TrackableReport) => {
    const stage = LIFECYCLE_STEPS[report.currentStage] || 'Submitted';
    const text =
      `Report Token: ${report.tokenId}. ` +
      `Department: ${report.department}. ` +
      `Filed on: ${fmtDate(report.date)}. ` +
      `Current status: ${report.status}. ` +
      `Progress stage: ${stage}. ` +
      (report.assignedTo
        ? `Assigned to: ${report.assignedTo}. `
        : 'Not yet assigned to an officer. ') +
      `Description: ${report.description}.`;
    speak(text);
  }, [speak]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <ThemeProvider theme={kioskTheme}>
      <CssBaseline />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Top bar ──────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleSessionClear}
              sx={{ color: 'primary.main' }}
              aria-label="Go back"
              size="large"
            >
              <ArrowBackIcon fontSize="large" />
            </IconButton>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Track Report
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Connectivity badge */}
            <Chip
              icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
              label={isOnline ? 'Online' : 'Offline'}
              size="small"
              sx={{
                bgcolor: isOnline ? '#065f4620' : '#7f1d1d30',
                color: isOnline ? '#4ade80' : '#f87171',
                fontWeight: 600,
              }}
            />
            {/* Idle countdown */}
            <Typography variant="caption" color="text.secondary">
              Idle: {IDLE_TIMEOUT_SEC - idleSeconds}s
            </Typography>
            {/* Refresh */}
            <IconButton
              onClick={fetchReports}
              sx={{ color: 'primary.main' }}
              aria-label="Refresh reports"
              size="large"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* ── Body: two-column on large / stacked on small ──── */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
          }}
        >
          {/* ── LEFT: Numpad search panel ───────────────────── */}
          <Box
            sx={{
              width: { xs: '100%', md: 340 },
              flexShrink: 0,
              borderRight: { md: '1px solid' },
              borderColor: { md: 'divider' },
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflowY: 'auto',
            }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              Enter Token ID / SRN
            </Typography>

            {/* Search input */}
            <TextField
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value.toUpperCase())}
              placeholder="e.g. UL-2026-00042"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '1.25rem',
                  fontFamily: 'monospace',
                  bgcolor: 'background.paper',
                },
              }}
            />

            {/* ── Kiosk numeric keypad ─────────────────────── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
              }}
            >
              {/* Alpha prefix keys */}
              {['U', 'L', '-'].map((key) => (
                <Button
                  key={key}
                  variant="outlined"
                  onClick={() => handleNumpadPress(key)}
                  sx={{
                    minHeight: 56,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    borderColor: 'divider',
                    color: 'primary.main',
                  }}
                >
                  {key}
                </Button>
              ))}
              {/* Digit keys */}
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(
                (digit) => (
                  <Button
                    key={digit}
                    variant="outlined"
                    onClick={() => handleNumpadPress(digit)}
                    sx={{
                      minHeight: 56,
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      borderColor: 'divider',
                    }}
                  >
                    {digit}
                  </Button>
                ),
              )}
              {/* Backspace */}
              <Button
                variant="outlined"
                onClick={handleNumpadBackspace}
                sx={{
                  minHeight: 56,
                  borderColor: 'divider',
                  color: '#f87171',
                }}
                aria-label="Backspace"
              >
                <BackspaceIcon />
              </Button>
              {/* Clear */}
              <Button
                variant="contained"
                color="secondary"
                onClick={handleNumpadClear}
                sx={{
                  minHeight: 56,
                  gridColumn: 'span 2',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                Clear
              </Button>
            </Box>

            {/* Quick summary */}
            <Box sx={{ mt: 'auto', pt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {reports.length} report{reports.length !== 1 ? 's' : ''} total
                {' · '}
                {reports.filter((r) => r.source === 'offline').length} local
                draft
                {reports.filter((r) => r.source === 'offline').length !== 1
                  ? 's'
                  : ''}
              </Typography>
            </Box>
          </Box>

          {/* ── RIGHT: Report cards list ────────────────────── */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {loading && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                }}
              >
                <CircularProgress size={48} />
              </Box>
            )}

            {!loading && error && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {!loading && !error && filtered.length === 0 && searchToken && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                No reports match token &quot;{searchToken}&quot;.
              </Alert>
            )}

            {!loading &&
              filtered.map((report) => {
                const cfg = STATUS_CONFIG[report.status];
                const isExpanded = expandedCard === report.tokenId;

                return (
                  <Paper
                    key={report.tokenId}
                    elevation={0}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      bgcolor: 'background.paper',
                      borderColor:
                        report.source === 'offline'
                          ? '#8b5cf640'
                          : 'divider',
                      // Static styling: Remove hover transitions/shadows
                      // Add subtle scale on press/active only
                      transform: 'scale(1)',
                      transition: 'transform 0.1s ease-out',
                      '&:active': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    {/* ── Card header row ───────────────────── */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="text.primary"
                        >
                          {report.department}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(report.date)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        {/* Source badge */}
                        {report.source === 'offline' && (
                          <Chip
                            icon={<CloudSyncIcon />}
                            label="Local"
                            size="small"
                            sx={{
                              bgcolor: '#8b5cf620',
                              color: '#a78bfa',
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                        {/* Status chip */}
                        <Chip
                          label={cfg.label}
                          size="small"
                          sx={{
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>
                    </Box>

                    {/* ── Token ID ──────────────────────────── */}
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      color="primary.main"
                      sx={{ mb: 1 }}
                    >
                      Token: {report.tokenId}
                    </Typography>

                    {/* ── Description (truncated) ──────────── */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {report.description}
                    </Typography>

                    {/* ── Action row ────────────────────────── */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <IconButton
                        onClick={() => readCardAloud(report)}
                        sx={{ color: 'primary.main' }}
                        aria-label={`Read aloud report ${report.tokenId}`}
                        size="large"
                      >
                        <VolumeUpIcon />
                      </IconButton>

                      <Button
                        size="small"
                        onClick={() =>
                          setExpandedCard(
                            isExpanded ? null : report.tokenId,
                          )
                        }
                        endIcon={
                          isExpanded ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )
                        }
                        sx={{ ml: 'auto', fontSize: '0.85rem' }}
                      >
                        {isExpanded ? 'Hide Progress' : 'View Progress'}
                      </Button>
                    </Box>

                    {/* ── Expanded: Visual status stepper ──── */}
                    <Collapse in={isExpanded} timeout={300}>
                      <Divider sx={{ my: 1.5 }} />

                      <Stepper
                        activeStep={report.currentStage}
                        alternativeLabel
                        connector={<ColorlibConnector />}
                        sx={{ py: 2 }}
                      >
                        {LIFECYCLE_STEPS.map((label, idx) => (
                          <Step
                            key={label}
                            completed={idx < report.currentStage}
                          >
                            <StepLabel
                              StepIconProps={{
                                sx: {
                                  color:
                                    idx <= report.currentStage
                                      ? 'primary.main'
                                      : 'text.disabled',
                                  '&.Mui-active': {
                                    color: 'primary.main',
                                  },
                                  '&.Mui-completed': {
                                    color: 'primary.main',
                                  },
                                },
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color:
                                    idx <= report.currentStage
                                      ? 'primary.main'
                                      : 'text.disabled',
                                  fontWeight:
                                    idx === report.currentStage ? 700 : 400,
                                }}
                              >
                                {label}
                              </Typography>
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>

                      {report.assignedTo && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', textAlign: 'center', pb: 1 }}
                        >
                          Assigned to: {report.assignedTo}
                        </Typography>
                      )}

                      {report.status === 'Escalated' && (
                        <Alert
                          severity="error"
                          sx={{ mt: 1, borderRadius: 2 }}
                        >
                          This grievance has been escalated for priority
                          resolution.
                        </Alert>
                      )}
                    </Collapse>
                  </Paper>
                );
              })}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
