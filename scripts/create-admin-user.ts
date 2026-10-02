import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getColtekFirebaseAdminApp } from '../lib/verify-firebase-token';

/**
 * Provision (or re-grant) a Coltek Academy admin with Firebase Admin.
 * The Firestore rules do not let any browser grant itself the admin role, so this is
 * the only supported way to create an admin. It marks the account in all three places
 * the app and rules recognise: the `admin` custom claim, adminUsers/{uid} and users/{uid}.role.
 *
 * Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in .env (never hardcode), then
 *   npx tsx scripts/create-admin-user.ts
 * ADMIN_PASSWORD is only used when the account does not exist yet.
 */
async function createAdminUser(email: string, password?: string) {
  const app = getColtekFirebaseAdminApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  let user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) {
    if (!password) throw new Error('Account does not exist yet: set ADMIN_PASSWORD in .env to create it.');
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log('✅ Created account');
  } else {
    console.log('ℹ️  Account already exists — granting admin');
  }

  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });

  const now = new Date().toISOString();
  await db.collection('adminUsers').doc(user.uid).set({ uid: user.uid, email: user.email, role: 'admin', updatedAt: now }, { merge: true });
  await db.collection('users').doc(user.uid).set({ uid: user.uid, email: user.email, role: 'admin', updatedAt: now }, { merge: true });

  console.log(`✅ ${email} is an admin (UID: ${user.uid}). Sign out and back in to refresh the admin claim.`);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL) {
  console.error('Set ADMIN_EMAIL (and ADMIN_PASSWORD for a new account) in .env');
  process.exit(1);
}

createAdminUser(ADMIN_EMAIL, ADMIN_PASSWORD)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error creating admin user:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
