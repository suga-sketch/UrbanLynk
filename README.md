# UrbanLynk

**Smart City Grievance Management & Operations Platform**

UrbanLynk is a full-stack smart-city kiosk solution that lets citizens register complaints, pay utility bills, and track issue resolution — all from a touch-friendly public kiosk — while giving city operations teams a real-time dashboard to monitor and act on grievances.

---

## Features

### Citizen Kiosk (`/kiosk`)

| Feature | Details |
|---|---|
| **Grievance Wizard** | Step-by-step form to file civic complaints with photo capture via webcam |
| **Bill Payment** | Pay electricity, water, and gas bills through a PIN-pad interface |
| **Track & Report** | Look up any grievance by ID and view its live resolution timeline |
| **Multi-language TTS** | Read-aloud support in English, Hindi (हिन्दी), Telugu (తెలుగు), Tamil (தமிழ்), and Kannada (ಕನ್ನಡ) |
| **Offline-first** | Complaints queued locally with Dexie/IndexedDB and synced when connectivity is restored |
| **Accessibility** | Large touch targets, high-contrast UI, and screen-reader-friendly labels |

### Operations Center (`/admin`)

| Feature | Details |
|---|---|
| **City Health Index** | Animated composite metric derived from SLA breach counts |
| **Grievance Dashboard** | Full list of complaints with status, priority, ward, and assigned officer |
| **Ward Distribution Chart** | Bar chart showing complaint volume per municipal ward |
| **Officer Workload** | Per-officer case count and SLA compliance |
| **Kiosk Health Logs** | Uptime and error logs for every deployed kiosk unit |
| **KPI Metrics** | Resolution rate, average response time, SLA breach stats |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| Component Library | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Rich UI Components | [Material UI v5](https://mui.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Offline Storage | [Dexie.js](https://dexie.org/) (IndexedDB wrapper) |
| Forms | React Hook Form + Zod |
| Text-to-Speech | Web Speech API (`SpeechSynthesisUtterance`) |
| Package Manager | [pnpm](https://pnpm.io/) |

---

## Project Structure

```
urbanlynk/
└── frontend/
    ├── app/
    │   ├── page.tsx          # Landing page (kiosk / admin selector)
    │   ├── kiosk/            # Citizen kiosk route
    │   └── admin/            # Operations center route
    ├── components/
    │   ├── kiosk/
    │   │   ├── screens.tsx          # Kiosk home + navigation screens
    │   │   ├── GrievanceWizard.tsx  # Multi-step complaint filing wizard
    │   │   ├── TrackReport.tsx      # Grievance tracking by ID
    │   │   └── BillPayment.tsx      # Utility bill payment flow
    │   ├── admin/
    │   │   └── panels.tsx           # All admin dashboard panels
    │   └── ui/               # shadcn/ui component library
    ├── hooks/
    │   ├── use-kiosk-tts.ts  # Multi-language Text-to-Speech hook
    │   └── use-mobile.ts     # Responsive breakpoint hook
    └── lib/
        ├── grievance-db.ts   # Dexie IndexedDB schema & helpers
        ├── mock-data.ts      # Seed data for demo/development
        └── utils.ts          # Shared utility functions
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/) v8 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/suga-sketch/UrbanLynk.git
cd UrbanLynk/urbanlynk/frontend

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

---

## Available Routes

| Route | Description |
|---|---|
| `/` | Landing page — select Citizen Kiosk or Operations Center |
| `/kiosk` | Touch-friendly citizen self-service kiosk |
| `/admin` | City operations management dashboard |

---

## Language Support

The kiosk's read-aloud feature uses the browser's Web Speech API and supports:

- 🇬🇧 English (`en-IN`)
- 🇮🇳 Hindi — हिन्दी (`hi-IN`)
- 🇮🇳 Telugu — తెలుగు (`te-IN`)
- 🇮🇳 Tamil — தமிழ் (`ta-IN`)
- 🇮🇳 Kannada — ಕನ್ನಡ (`kn-IN`)

---

## License

This project is for demonstration and educational purposes.
