import { DocumentData } from 'firebase/firestore';

export interface Certificate extends DocumentData {
  id?: string;
  certificateId?: string;
  userId: string;
  courseId: string;
  courseTitle?: string;
  courseName: string;
  recipientName: string;
  recipientEmail: string;
  userName?: string;
  userEmail?: string;
  issueDate: Date | string;
  completionDate: Date | string;
  certificateUrl: string;
  previewUrl?: string;
  status: 'issued' | 'revoked' | 'pending';
  verificationCode?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    verificationCode?: string;
    remarks?: string;
  };
}
