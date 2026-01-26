import { db } from './firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  Timestamp,
  onSnapshot,
  Unsubscribe,
  addDoc,
  Firestore,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { Activity, ActivityData, ActivityType } from '@/types/activity';

export const ACTIVITY_TYPES = {
  CERTIFICATE_ISSUED: 'CERTIFICATE_ISSUED',
  USER_REGISTERED: 'USER_REGISTERED',
  COURSE_CREATED: 'COURSE_CREATED',
  USER_ENROLLED: 'USER_ENROLLED',
} as const;

const ACTIVITY_COLLECTION = 'activities';

export async function logActivity(activityData: Omit<ActivityData, 'timestamp'>): Promise<void> {
  try {
    await addDoc(collection(db, ACTIVITY_COLLECTION), {
      ...activityData,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

export async function getRecentActivities(count = 10): Promise<Activity[]> {
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Activity[];
}

export function subscribeToActivities(
  callback: (activities: Activity[]) => void,
  count = 10
): Unsubscribe {
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(count)
  );

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Activity[];
    callback(activities);
  });
}

// Helper functions for specific activity types
export async function logCertificateIssued(
  userId: string,
  userName: string,
  userEmail: string,
  courseId: string,
  courseTitle: string,
  certificateId: string
): Promise<void> {
  return logActivity({
    type: 'CERTIFICATE_ISSUED',
    user: {
      id: userId,
      name: userName,
      email: userEmail,
    },
    course: {
      id: courseId,
      title: courseTitle,
    },
    metadata: {
      certificateId,
    },
  });
}

export async function logUserRegistered(
  userId: string,
  userName: string,
  userEmail: string
): Promise<void> {
  return logActivity({
    type: 'USER_REGISTERED',
    user: {
      id: userId,
      name: userName,
      email: userEmail,
    },
  });
}
