import Dexie, { type EntityTable } from 'dexie';

/** Shape of one offline-queued grievance record */
export interface GrievanceRecord {
  /** Auto-incremented primary key (Dexie manages this) */
  id?: number;
  /** Application-level unique submission ID, e.g. "UL-2026-0042" */
  submissionId: string;
  /** Citizen name */
  userName: string;
  /** Department: Water | Electricity | Waste | Roads */
  department: string;
  /** Free-text complaint description */
  complaint: string;
  /** Base-64 encoded JPEG captured from react-webcam (may be empty) */
  photo: string;
  /** ISO-8601 timestamp of when the form was submitted */
  timestamp: string;
  /** Whether this record has been synced to the server */
  synced: boolean;
}

/**
 * Dexie database for UrbanLynk kiosk grievances.
 * Version 1 stores a single `grievances` table.
 */
const db = new Dexie('UrbanLynkGrievances') as Dexie & {
  grievances: EntityTable<GrievanceRecord, 'id'>;
};

db.version(1).stores({
  // id is auto-increment primary, indexed on submissionId + synced for later sync jobs
  grievances: '++id, submissionId, synced, timestamp',
});

export { db };
