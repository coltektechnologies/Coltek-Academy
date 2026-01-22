import { useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function useUserActivity() {
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    // Update lastActive timestamp when component mounts
    const updateLastActive = async () => {
      try {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating last active timestamp:', error);
      }
    };

    updateLastActive();

    // Set up activity listeners for user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => updateLastActive();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Clean up event listeners
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  return null;
}
