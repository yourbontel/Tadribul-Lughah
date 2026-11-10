/**
 * Adversarial Security Rules Specification Runner for Tadribul Lughah
 * Verifies that all 12 "Dirty Dozen" payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: {
    uid: string;
    email?: string;
    email_verified?: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Program Edit',
    operation: 'update',
    path: '/programs/tl-level-1',
    auth: null,
    payload: { tuitionIDR: 0 },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Unverified Email Spoofing on Superadmin Action',
    operation: 'update',
    path: '/programs/tl-level-1',
    auth: {
      uid: 'spoof-uid',
      email: 'mazharhajid@gmail.com',
      email_verified: false
    },
    payload: { tuitionIDR: 0 },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Program',
    operation: 'update',
    path: '/programs/tl-level-1',
    auth: {
      uid: 'admin-uid',
      email: 'mazharhajid@gmail.com',
      email_verified: true
    },
    payload: { isFreeForever: true },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Oversized String Resource Poisoning',
    operation: 'create',
    path: '/registrations/TL-2026-9999',
    auth: null,
    payload: { fullName: 'A'.repeat(5000) },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'Invalid Document ID Injection',
    operation: 'create',
    path: '/registrations/invalid$id!@#',
    auth: null,
    payload: { registrationNumber: 'invalid$id!@#' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Forged Client Timestamp',
    operation: 'create',
    path: '/registrations/TL-2026-1234',
    auth: null,
    payload: { createdAt: '2099-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Orphaned Schedule Creation',
    operation: 'create',
    path: '/schedules/sch-orphan',
    auth: {
      uid: 'admin-uid',
      email: 'mazharhajid@gmail.com',
      email_verified: true
    },
    payload: { programId: 'non-existent-program' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Orphaned Registration Creation',
    operation: 'create',
    path: '/registrations/TL-2026-1235',
    auth: null,
    payload: { selectedScheduleId: 'fake-schedule' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Unauthorized Registration Status Tampering',
    operation: 'update',
    path: '/registrations/TL-2026-8419',
    auth: {
      uid: 'normal-user',
      email: 'user@example.com',
      email_verified: true
    },
    payload: { status: 'Lulus Level' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Immutable Field Tampering on Update',
    operation: 'update',
    path: '/registrations/TL-2026-8419',
    auth: {
      uid: 'admin-uid',
      email: 'mazharhajid@gmail.com',
      email_verified: true
    },
    payload: { registrationNumber: 'TL-HACKED' },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Unauthorized Registration Deletion',
    operation: 'delete',
    path: '/registrations/TL-2026-8419',
    auth: {
      uid: 'normal-user',
      email: 'user@example.com',
      email_verified: true
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Value Poisoning on Tuition',
    operation: 'create',
    path: '/registrations/TL-2026-8888',
    auth: null,
    payload: { totalTuitionIDR: -50000 },
    expectedOutcome: 'PERMISSION_DENIED'
  }
];
