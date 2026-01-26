import { Timestamp } from 'firebase/firestore';

export type ActivityType = 
  | 'CERTIFICATE_ISSUED'
  | 'USER_REGISTERED'
  | 'COURSE_CREATED'
  | 'USER_ENROLLED';

export interface ActivityUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ActivityCourse {
  id: string;
  title: string;
}

export interface ActivityData {
  type: ActivityType;
  user: ActivityUser;
  timestamp: Timestamp;
  course?: ActivityCourse;
  metadata?: Record<string, any>;
}

export interface Activity extends ActivityData {
  id: string;
  timestamp: Timestamp;
}
