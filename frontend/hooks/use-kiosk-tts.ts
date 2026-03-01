'use client';

import { useCallback, useContext, useMemo, useEffect, useState } from 'react';
import { KioskContext } from '@/app/kiosk/layout';

/**
 * Language-to-Locale mapping for Indian regional languages
 * These locales are used by SpeechSynthesisUtterance for proper pronunciation
 */
export const LANGUAGE_LOCALES: Record<string, string> = {
  english: 'en-IN',   // English - Latin script
  hindi: 'hi-IN',     // हिन्दी - Devanagari script
  telugu: 'te-IN',    // తెలుగు - Telugu script
  tamil: 'ta-IN',     // தமிழ் - Tamil script
  kannada: 'kn-IN',   // ಕನ್ನಡ - Kannada script
};

/**
 * Language display names for UI
 */
export const LANGUAGE_NAMES: Record<string, { native: string; english: string }> = {
  english: { native: 'English', english: 'English' },
  hindi: { native: 'हिन्दी', english: 'Hindi' },
  telugu: { native: 'తెలుగు', english: 'Telugu' },
  tamil: { native: 'தமிழ்', english: 'Tamil' },
  kannada: { native: 'ಕನ್ನಡ', english: 'Kannada' },
};

interface UseKioskTTSOptions {
  /** Speech rate (0.1 to 2.0, default 0.9 for clarity) */
  rate?: number;
  /** Speech pitch (0 to 2, default 1) */
  pitch?: number;
  /** Override language locale (uses context language if not provided) */
  overrideLocale?: string;
}

interface UseKioskTTSReturn {
  /** Speak text in the user's selected language */
  speak: (text: string) => void;
  /** Cancel any ongoing speech */
  cancel: () => void;
  /** Check if TTS is currently speaking */
  isSpeaking: boolean;
  /** Check if TTS is supported in the browser */
  isSupported: boolean;
  /** Current language locale being used */
  currentLocale: string;
  /** Current language code from context */
  currentLanguage: string;
  /** List of available voices for the current locale */
  availableVoices: SpeechSynthesisVoice[];
}

/**
 * useKioskTTS - Custom hook for Text-to-Speech in the Kiosk application
 * 
 * Features:
 * - Automatic language detection from KioskContext
 * - Maps Indian regional languages to correct Web Speech API locales
 * - Graceful error handling (no crash on denied audio permissions)
 * - Cancels previous speech before starting new speech
 * - Output-only (no voice recognition for privacy)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { speak, cancel, isSupported } = useKioskTTS();
 *   
 *   const handleReadAloud = () => {
 *     speak("Welcome to UrbanLynk. Please select your preferred language.");
 *   };
 * 
 *   return (
 *     <button onClick={handleReadAloud} disabled={!isSupported}>
 *       🔊 Read Aloud
 *     </button>
 *   );
 * }
 * ```
 */
export function useKioskTTS(options: UseKioskTTSOptions = {}): UseKioskTTSReturn {
  const { rate = 0.9, pitch = 1, overrideLocale } = options;
  
  const kioskContext = useContext(KioskContext);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Determine if TTS is supported
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }, []);

  // Get current language from context (default to English)
  const currentLanguage = kioskContext?.language ?? 'english';
  
  // Map language to locale
  const currentLocale = useMemo(() => {
    if (overrideLocale) return overrideLocale;
    return LANGUAGE_LOCALES[currentLanguage] ?? 'en-IN';
  }, [currentLanguage, overrideLocale]);

  // Load available voices and filter for current locale
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const localeVoices = voices.filter(
        (voice) => voice.lang.startsWith(currentLocale.split('-')[0])
      );
      setAvailableVoices(localeVoices.length > 0 ? localeVoices : voices);
    };

    // Load voices immediately and on change
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported, currentLocale]);

  // Track speaking state
  useEffect(() => {
    if (!isSupported) return;

    const checkSpeaking = () => setIsSpeaking(window.speechSynthesis.speaking);
    const interval = setInterval(checkSpeaking, 100);

    return () => clearInterval(interval);
  }, [isSupported]);

  /**
   * Cancel any ongoing speech synthesis
   */
  const cancel = useCallback(() => {
    if (!isSupported) return;
    
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } catch (error) {
      // Gracefully handle any errors (e.g., audio permission denied)
      console.warn('[useKioskTTS] Failed to cancel speech:', error);
    }
  }, [isSupported]);

  /**
   * Speak the provided text using the current language locale
   * 
   * @param text - The text to speak (should be in the appropriate script for the language)
   */
  const speak = useCallback(
    (text: string) => {
      if (!isSupported) {
        console.warn('[useKioskTTS] Speech synthesis not supported in this browser');
        return;
      }

      if (!text || text.trim().length === 0) {
        console.warn('[useKioskTTS] Empty text provided, skipping speech');
        return;
      }

      try {
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLocale;
        utterance.rate = rate;
        utterance.pitch = pitch;

        // Try to find a voice that matches the locale
        const bestVoice = availableVoices.find(
          (voice) => voice.lang === currentLocale
        ) ?? availableVoices.find(
          (voice) => voice.lang.startsWith(currentLocale.split('-')[0])
        );

        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        // Event handlers for state tracking
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
          // Handle errors gracefully - don't crash the UI
          if (event.error !== 'canceled') {
            console.warn('[useKioskTTS] Speech error:', event.error);
          }
          setIsSpeaking(false);
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        // Gracefully handle any runtime errors
        console.warn('[useKioskTTS] Failed to speak:', error);
        setIsSpeaking(false);
      }
    },
    [isSupported, currentLocale, rate, pitch, availableVoices]
  );

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    currentLocale,
    currentLanguage,
    availableVoices,
  };
}

/**
 * Standalone speak function for use outside of React components
 * Uses default English (en-IN) locale
 * 
 * @param text - Text to speak
 * @param locale - Speech synthesis locale (default: 'en-IN')
 * @param rate - Speech rate (default: 0.9)
 */
export function speakText(
  text: string,
  locale: string = 'en-IN',
  rate: number = 0.9
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[speakText] Speech synthesis not supported');
    return;
  }

  try {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = rate;
    utterance.pitch = 1;
    
    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        console.warn('[speakText] Speech error:', event.error);
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn('[speakText] Failed to speak:', error);
  }
}

export default useKioskTTS;
