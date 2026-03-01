'use client';

import { useContext } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { KioskContext } from './layout';
import {
  AttractScreen,
  LanguageScreen,
  ConsentScreen,
  OTPScreen,
  ServiceDashboardScreen,
  GrievanceFormScreen,
  TrackReportScreen,
  BillPaymentScreen,
  SuccessScreen,
} from '@/components/kiosk/screens';

export default function KioskPage() {
  const context = useContext(KioskContext);
  if (!context) return null;

  const screens: Record<string, React.ComponentType> = {
    attract: AttractScreen,
    language: LanguageScreen,
    consent: ConsentScreen,
    otp: OTPScreen,
    services: ServiceDashboardScreen,
    form: GrievanceFormScreen,
    track: TrackReportScreen,
    pay: BillPaymentScreen,
    success: SuccessScreen,
  };

  const ScreenComponent = screens[context.currentScreen] || AttractScreen;

  return (
    <MemoryRouter initialEntries={['/kiosk']}>
      <ScreenComponent />
    </MemoryRouter>
  );
}
