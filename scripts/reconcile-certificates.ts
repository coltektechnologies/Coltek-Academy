import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true } as any);
dotenv.config({ quiet: true } as any);

import { getFirestore } from 'firebase-admin/firestore';
import { getColtekFirebaseAdminApp } from '../lib/verify-firebase-token';

/**
 * Make certificates and graduates consistent:
 *  1. Duplicates — a student should hold ONE issued certificate per course. When there are several,
 *     the newest is kept and the older ones are revoked (reason "duplicate"; nothing is deleted).
 *  2. Graduation — every issued certificate means the student completed that course, so their
 *     enrollment for the course is set to "completed".
 *
 *   npx tsx scripts/reconcile-certificates.ts           # dry run: reports only
 *   npx tsx scripts/reconcile-certificates.ts --apply   # writes the changes
 */
function toMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value) return (value as { toMillis: () => number }).toMillis();
  const time = new Date(value as string).getTime();
  return Number.isNaN(time) ? 0 : time;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const db = getFirestore(getColtekFirebaseAdminApp());
  const now = new Date().toISOString();

  const certificates = (await db.collection('certificates').get()).docs.filter(
    (d) => String(d.get('status') || '').toLowerCase() === 'issued'
  );

  // 1. Duplicates
  const groups = new Map<string, FirebaseFirestore.QueryDocumentSnapshot[]>();
  for (const cert of certificates) {
    const key = `${cert.get('userId')}|${cert.get('courseId')}`;
    groups.set(key, [...(groups.get(key) || []), cert]);
  }
  let revoked = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => toMillis(b.get('issueDate') || b.get('createdAt')) - toMillis(a.get('issueDate') || a.get('createdAt')));
    const [keep, ...extras] = group;
    console.log(
      `Duplicate: ${keep.get('recipientName') || keep.get('userId')} · ${keep.get('courseTitle') || keep.get('courseId')} — ` +
        `keeping ${keep.id} (${new Date(toMillis(keep.get('issueDate'))).toDateString()}), ` +
        `${apply ? 'revoking' : 'would revoke'} ${extras.map((e) => `${e.id} (${new Date(toMillis(e.get('issueDate'))).toDateString()})`).join(', ')}`
    );
    for (const extra of extras) {
      revoked++;
      if (apply) await extra.ref.update({ status: 'revoked', revokedReason: 'duplicate', revokedAt: now, supersededBy: keep.id });
    }
  }

  // 2. Completed enrollments for every remaining issued certificate
  const holders = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  for (const group of groups.values()) holders.set(`${group[0].get('userId')}|${group[0].get('courseId')}`, group[0]);
  let completed = 0;
  let withoutEnrollment = 0;
  for (const cert of holders.values()) {
    const enrollments = await db
      .collection('enrollments')
      .where('userId', '==', cert.get('userId'))
      .where('courseId', '==', cert.get('courseId'))
      .get();
    if (enrollments.empty) {
      withoutEnrollment++;
      console.log(`No enrollment record: ${cert.get('recipientName') || cert.get('userId')} · ${cert.get('courseTitle') || cert.get('courseId')} (certificate ${cert.id})`);
      continue;
    }
    for (const enrollment of enrollments.docs) {
      if (String(enrollment.get('status') || '').toLowerCase() === 'completed') continue;
      completed++;
      console.log(`${apply ? 'Completing' : 'Would complete'} enrollment ${enrollment.id}: ${cert.get('recipientName') || cert.get('userId')} · ${cert.get('courseTitle') || cert.get('courseId')} (was ${enrollment.get('status') || 'active'})`);
      if (apply) await enrollment.ref.update({ status: 'completed', completedAt: now, updatedAt: now });
    }
  }

  console.log(
    `\n${apply ? 'Done' : 'Dry run'}: ${revoked} duplicate certificate(s) ${apply ? 'revoked' : 'to revoke'}, ` +
      `${completed} enrollment(s) ${apply ? 'marked' : 'to mark'} completed, ${withoutEnrollment} certificate(s) with no enrollment record.` +
      (apply ? '' : ' Re-run with --apply to write these changes.')
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
