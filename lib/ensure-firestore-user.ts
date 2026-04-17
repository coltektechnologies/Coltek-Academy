import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebase } from "./firebase";

/**
 * Ensures `users/{uid}` exists in Firestore for the signed-in Auth user.
 * Firebase Auth and Firestore are separate: OAuth "Sign in" on the login page
 * does not create a profile doc (unlike the signup flow), so the admin users
 * list would stay empty for those accounts until this runs.
 */
export async function ensureFirestoreUserProfile(user: User): Promise<void> {
  try {
    const ref = doc(firebase.db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;

    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || "",
      role: "student",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[ensureFirestoreUserProfile]", e);
  }
}
