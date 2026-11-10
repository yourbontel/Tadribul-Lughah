import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  collection
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  PROGRAM_TRACKS,
  TURATS_IMAGE_PATH,
  HIWAR_IMAGE_PATH,
  getStoredRegistrationOpenMap,
  getStoredAngkatanMap
} from './data/arabicAcademyData';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const SUPERADMIN_EMAIL = 'mazharhajid@gmail.com';

export function isUserSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return (
    user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() &&
    user.emailVerified === true
  );
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Mappers between UI domain types and Firestore schema
export function programToFirestoreDoc(program: ProgramTrack) {
  return {
    id: program.id,
    title: program.title.slice(0, 140),
    arabicTitle: program.arabicTitle.slice(0, 140),
    subtitle: (program.levelRecommendation || 'Program Tadribul Lughah').slice(
      0,
      200
    ),
    category: program.category === 'shorof' ? 'Ilmu Shorof' : 'Ilmu Nahwu',
    levelBadge: (
      program.categoryLabel || `Level ${program.levelNumber}`
    ).slice(0, 100),
    durationWeeks: Math.max(1, Math.min(104, Math.round(program.durationWeeks))),
    sessionsPerWeek: Math.max(
      1,
      Math.min(
        14,
        Math.round(program.sessionsCount / Math.max(1, program.durationWeeks))
      )
    ),
    sessionMinutes: Math.max(
      15,
      Math.min(360, Math.round(program.sessionMinutes))
    ),
    scheduleDays: program.scheduleDays.slice(0, 120),
    scheduleTime: program.scheduleTime.slice(0, 120),
    tuitionIDR: Math.max(
      0,
      Math.min(100000000, Math.round(program.tuitionIDR))
    ),
    summary: program.summary.slice(0, 2000),
    targetOutcome: program.targetOutcome.slice(0, 1000),
    kitabReference: program.kitabReference.slice(0, 300),
    imageKey: program.category === 'shorof' ? 'turats' : 'hiwar',
    featured: Boolean(program.featuredSpan),
    registrationOpen: program.registrationOpen !== false,
    angkatan: (program.angkatan?.trim() || 'Angkatan 1').slice(0, 100),
    order: Math.max(1, Math.min(100, Math.round(program.levelNumber))),
    updatedAt: new Date().toISOString()
  };
}

export function firestoreDocToProgram(
  data: Record<string, unknown>
): ProgramTrack {
  const id = String(data.id || '');
  const order = Number(data.order) || 1;
  const fallback =
    PROGRAM_TRACKS.find((p) => p.id === id) ||
    PROGRAM_TRACKS.find((p) => p.levelNumber === order) ||
    PROGRAM_TRACKS[0];

  const categoryStr = String(data.category || '');
  const isShorof = categoryStr === 'Ilmu Shorof' || order === 4;
  const durationWeeks = Number(data.durationWeeks) || fallback.durationWeeks;
  const sessionsPerWeek = Number(data.sessionsPerWeek) || 2;
  const imageKey = String(data.imageKey || '');

  return {
    id,
    code: `TL-LV${order}`,
    indexNumber: String(order).padStart(2, '0'),
    levelNumber: order,
    title: String(data.title || fallback.title),
    arabicTitle: String(data.arabicTitle || fallback.arabicTitle),
    category: isShorof ? 'shorof' : 'nahwu',
    categoryLabel: String(data.levelBadge || fallback.categoryLabel),
    scheduleDays: String(data.scheduleDays || fallback.scheduleDays),
    scheduleTime: String(data.scheduleTime || fallback.scheduleTime),
    levelRecommendation: String(data.subtitle || fallback.levelRecommendation),
    durationWeeks,
    sessionsCount: durationWeeks * sessionsPerWeek,
    sessionMinutes: Number(data.sessionMinutes) || fallback.sessionMinutes,
    tuitionIDR:
      typeof data.tuitionIDR === 'number' && data.tuitionIDR !== 85000
        ? data.tuitionIDR
        : fallback.tuitionIDR,
    summary: String(data.summary || fallback.summary),
    targetOutcome: String(data.targetOutcome || fallback.targetOutcome),
    kitabReference: String(data.kitabReference || fallback.kitabReference),
    image:
      order === 1
        ? HIWAR_IMAGE_PATH
        : order === 4
          ? TURATS_IMAGE_PATH
          : imageKey === 'turats'
            ? undefined
            : undefined,
    featuredSpan: Boolean(data.featured ?? fallback.featuredSpan),
    registrationOpen:
      typeof getStoredRegistrationOpenMap()[id] === 'boolean'
        ? getStoredRegistrationOpenMap()[id]
        : typeof data.registrationOpen === 'boolean'
          ? data.registrationOpen
          : fallback.registrationOpen !== false,
    angkatan:
      typeof getStoredAngkatanMap()[id] === 'string' &&
      getStoredAngkatanMap()[id].trim()
        ? getStoredAngkatanMap()[id]
        : typeof data.angkatan === 'string' && data.angkatan.trim()
          ? data.angkatan.trim()
          : fallback.angkatan || 'Angkatan 1',
    modules: fallback.modules
  };
}

export function scheduleToFirestoreDoc(schedule: ClassSchedule) {
  return {
    id: schedule.id,
    programId: schedule.programId.slice(0, 128),
    programName: schedule.programName.slice(0, 160),
    batchCode: schedule.batchCode.slice(0, 80),
    mode: (schedule.modeLabel || 'Online Live Interaktif (Zoom)').slice(0, 120),
    days: schedule.days.slice(0, 120),
    timeWIB: schedule.timeWIB.slice(0, 120),
    startDate: schedule.startDate.slice(0, 100),
    instructor: schedule.instructor.slice(0, 140),
    capacity: Math.max(1, Math.min(1000, Math.round(schedule.capacity))),
    enrolled: Math.max(
      0,
      Math.min(
        Math.round(schedule.capacity),
        Math.round(schedule.enrolled)
      )
    ),
    feeIDR: Math.max(0, Math.min(100000000, Math.round(schedule.feeIDR))),
    order: Math.max(1, Math.min(200, Math.round(schedule.levelNumber || 1))),
    updatedAt: new Date().toISOString()
  };
}

export function firestoreDocToSchedule(
  data: Record<string, unknown>
): ClassSchedule {
  const order = Number(data.order) || 1;
  return {
    id: String(data.id || ''),
    batchCode: String(data.batchCode || `TL-LV${order}-MLM`),
    programId: String(data.programId || `tl-level-${order}`),
    levelNumber: order,
    programName: String(data.programName || `Tadribul Lughah Level ${order}`),
    levelName:
      order === 4
        ? `Level ${order} (Ilmu Shorof)`
        : `Level ${order} (Ilmu Nahwu)`,
    modeLabel: String(data.mode || 'Online Live Interaktif (Zoom)'),
    days: String(data.days || 'Kamis & Jumat'),
    timeWIB: String(data.timeWIB || '20.00 – 22.00 WIB'),
    startDate: String(data.startDate || 'Segera Dimulai'),
    instructor: String(data.instructor || 'Tim Pengajar Tadribul Lughah'),
    capacity: Number(data.capacity) || 25,
    enrolled: Number(data.enrolled) || 0,
    feeIDR:
      typeof data.feeIDR === 'number' && data.feeIDR !== 85000
        ? data.feeIDR
        : 510000
  };
}

export function registrationToPrivateFirestoreDoc(rec: RegistrationRecord) {
  return {
    registrationNumber: rec.registrationNumber.slice(0, 128),
    fullName: rec.fullName.slice(0, 120),
    gender: (rec.gender || 'Laki-laki').slice(0, 40),
    email: (rec.email || '-').slice(0, 160),
    whatsapp: (rec.whatsapp || '-').slice(0, 40),
    city: rec.city.slice(0, 100),
    occupation: rec.occupation.slice(0, 100),
    selectedProgramId: rec.selectedProgramId.slice(0, 128),
    selectedProgramName: rec.selectedProgramName.slice(0, 160),
    selectedScheduleId: rec.selectedScheduleId.slice(0, 128),
    selectedScheduleSummary: rec.selectedScheduleSummary.slice(0, 240),
    learningGoal: (
      rec.learningGoal || 'Menguasai kaidah Nahwu & Shorof.'
    ).slice(0, 1500),
    totalTuitionIDR: Math.max(
      0,
      Math.min(100000000, Math.round(rec.totalTuitionIDR))
    ),
    registeredAt: rec.registeredAt.slice(0, 80),
    status: rec.status.slice(0, 120),
    updatedAt: new Date().toISOString()
  };
}

export function registrationToPublicStatusDoc(rec: RegistrationRecord) {
  return {
    registrationNumber: rec.registrationNumber.slice(0, 128),
    fullName: rec.fullName.slice(0, 120),
    gender: (rec.gender || 'Laki-laki').slice(0, 40),
    city: rec.city.slice(0, 100),
    occupation: rec.occupation.slice(0, 100),
    selectedProgramId: rec.selectedProgramId.slice(0, 128),
    selectedProgramName: rec.selectedProgramName.slice(0, 160),
    selectedScheduleId: rec.selectedScheduleId.slice(0, 128),
    selectedScheduleSummary: rec.selectedScheduleSummary.slice(0, 240),
    totalTuitionIDR: Math.max(
      0,
      Math.min(100000000, Math.round(rec.totalTuitionIDR))
    ),
    registeredAt: rec.registeredAt.slice(0, 80),
    status: rec.status.slice(0, 120),
    updatedAt: new Date().toISOString()
  };
}

export function firestoreDocToRegistration(
  data: Record<string, unknown>
): RegistrationRecord {
  const rawStatus = String(
    data.status || 'Terverifikasi — Menunggu Orientasi'
  );
  return {
    registrationNumber: String(data.registrationNumber || ''),
    fullName: String(data.fullName || ''),
    gender:
      typeof data.gender === 'string' && data.gender.trim()
        ? data.gender.trim()
        : 'Laki-laki',
    email: String(data.email || 'Terlindungi (Privat)'),
    whatsapp: String(data.whatsapp || 'Terlindungi (Privat)'),
    occupation: String(data.occupation || 'Peserta'),
    city: String(data.city || '-'),
    selectedProgramId: String(data.selectedProgramId || 'tl-level-1'),
    selectedProgramName: String(
      data.selectedProgramName || 'Tadribul Lughah Level 1'
    ),
    selectedScheduleId: String(data.selectedScheduleId || 'sch-lv1-malam'),
    selectedScheduleSummary: String(
      data.selectedScheduleSummary || 'Online (20.00 – 22.00 WIB)'
    ),
    learningGoal: String(
      data.learningGoal ||
        'Menguasai kaidah Nahwu dan Shorof secara sistematis.'
    ),
    totalTuitionIDR:
      typeof data.totalTuitionIDR === 'number' && data.totalTuitionIDR !== 85000
        ? data.totalTuitionIDR
        : 510000,
    registeredAt: String(data.registeredAt || '-'),
    status:
      rawStatus === 'Menunggu Konfirmasi Pembayaran'
        ? 'Menunggu Konfirmasi Pembayaran'
        : 'Terverifikasi — Menunggu Orientasi'
  };
}

export {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
export type { User };
