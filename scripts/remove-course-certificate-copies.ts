import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getColtekFirebaseAdminApp } from '../lib/verify-firebase-token';

/**
 * One-off privacy cleanup. Older certificate issuance copied each certificate
 * (student id, name, file link) into `courses/{id}.issuedCertificates`. Course documents
 * are publicly readable, so those copies must be removed. The real records stay in
 * the `certificates` collection — nothing a student or admin uses is lost.
 *
 *   npx tsx scripts/remove-course-certificate-copies.ts           # dry run: reports only
 *   npx tsx scripts/remove-course-certificate-copies.ts --apply   # removes the field
 */
async function main() {
  const apply = process.argv.includes('--apply');
  const db = getFirestore(getColtekFirebaseAdminApp());
  const courses = await db.collection('courses').get();

  let affected = 0;
  for (const course of courses.docs) {
    const copies = course.get('issuedCertificates');
    if (copies === undefined) continue;
    affected++;
    const count = Array.isArray(copies) ? copies.length : 0;
    console.log(`${apply ? 'Removing' : 'Would remove'} ${count} certificate cop${count === 1 ? 'y' : 'ies'} from courses/${course.id}`);
    if (apply) await course.ref.update({ issuedCertificates: FieldValue.delete() });
  }

  console.log(
    affected === 0
      ? 'No course documents contain certificate copies.'
      : apply
        ? `Done: cleaned ${affected} course document(s).`
        : `Dry run: ${affected} course document(s) affected. Re-run with --apply to remove the copies.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
