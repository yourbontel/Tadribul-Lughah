# Security Specification — Tadribul Lughah Registration & Superadmin Portal

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every path not explicitly matched under `/databases/{database}/documents` is denied (`allow read, write: if false;`).
2. **Superadmin Authority**: Only the verified Superadmin (`request.auth.token.email == 'mazharhajid@gmail.com' && request.auth.token.email_verified == true` or a document existing at `/admins/$(request.auth.uid)`) can create, update, or delete `/programs/{programId}` and `/schedules/{scheduleId}`, or update/delete `/registrations/{registrationId}`.
3. **Path Variable Hardening (`isValidId`)**: All document IDs (`programId`, `scheduleId`, `registrationId`, `adminId`) must be valid strings matching `^[a-zA-Z0-9_\-]+$` with length `<= 128`.
4. **Strict Keys & Schema Validation (`hasAll` + `hasOnly`)**: Every create and update operation on `/programs`, `/schedules`, and `/registrations` must pass `isValidProgram`, `isValidSchedule`, or `isValidRegistration`, enforcing exact key allowlists, string length bounds, numeric ranges, and server timestamp integrity (`request.time`).
5. **Relational Integrity**: A schedule cannot be created unless its referenced `/programs/$(incoming().programId)` exists. A registration cannot be created unless both `/programs/$(incoming().selectedProgramId)` and `/schedules/$(incoming().selectedScheduleId)` exist.
6. **PII Protection on Registrations**: Full registration documents containing PII (`email`, `whatsapp`) can only be listed or modified by the verified Superadmin, or read individually via exact registration ID (`get`) with valid ID formatting.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Vectors)

1. **Payload 1 — Unauthenticated Program Edit**: Anonymous user attempts to overwrite `/programs/tl-level-1` tuition fee to `0`.
2. **Payload 2 — Unverified Email Spoofing**: Authenticated user with `email: 'mazharhajid@gmail.com'` but `email_verified: false` attempts to update `/programs/tl-level-1`.
3. **Payload 3 — Shadow Field Injection on Program**: Superadmin sends an extra undeclared field `"isFreeForever": true` when updating `/programs/tl-level-1`.
4. **Payload 4 — Oversized String Resource Poisoning**: Attacker sends a 5,000-character string in `fullName` or `learningGoal` when creating `/registrations/TL-2026-9999`.
5. **Payload 5 — Invalid Document ID Injection**: Attacker attempts to create `/registrations/invalid$id!@#` containing illegal characters.
6. **Payload 6 — Forged Client Timestamp**: Attacker creates `/registrations/TL-2026-1234` with a past/future `createdAt` timestamp instead of `request.time`.
7. **Payload 7 — Orphaned Schedule Creation**: Superadmin attempts to create a schedule referencing a non-existent `programId: 'non-existent-program'`.
8. **Payload 8 — Orphaned Registration Creation**: User attempts to create a registration referencing a non-existent `selectedScheduleId: 'fake-schedule'`.
9. **Payload 9 — Unauthorized Registration Status Tampering**: Non-admin user attempts to `update` `/registrations/TL-2026-8419` to change `status` or `totalTuitionIDR`.
10. **Payload 10 — Immutable Field Tampering on Update**: Superadmin attempts to mutate `registrationNumber` or `createdAt` during an `update` on `/registrations/TL-2026-8419`.
11. **Payload 11 — Unauthorized Registration Deletion**: Non-admin user attempts to `delete` `/registrations/TL-2026-8419`.
12. **Payload 12 — Value Poisoning on Tuition**: Attacker submits a string `"gratis"` or negative integer `-50000` for `totalTuitionIDR` in `/registrations/TL-2026-8888`.
