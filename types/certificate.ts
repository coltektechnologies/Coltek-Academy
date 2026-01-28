import { DocumentData } from 'firebase/firestore';

export interface Certificate extends DocumentData {
  id?: string;
  userId: string;
  courseId: string;
  courseName: string;
  recipientName: string;
  recipientEmail: string;
  issueDate: Date | string;
  completionDate: Date | string;
  certificateUrl: string;
  previewUrl?: string;
  status: 'issued' | 'revoked' | 'pending';
  verificationCode?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
}
