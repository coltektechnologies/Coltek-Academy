import { collection, getDocs, query, where } from 'firebase/firestore';
import { firebase, isFirebaseConfigured } from '@/lib/firebase';

export interface PublicProject {
  id: string;
  title: string;
  studentName: string;
  cohort: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  projectUrl: string;
  repoUrl: string;
  /** Course the project was built in (course document id), if an admin linked one. */
  courseId: string;
  order: number;
}

// Only web links are passed to pages (never javascript: or other schemes)
function safeLink(value: unknown): string {
  const url = String(value || '').trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

// Screenshots are either admin-uploaded data URLs or https links
function safeImage(value: unknown): string {
  const url = String(value || '').trim();
  return /^data:image\/(png|jpe?g|webp);base64,/i.test(url) || /^https:\/\//i.test(url) ? url : '';
}

/**
 * Published student projects (managed at /admin/projects), sorted by display order.
 * Pass `courseId` to get only the projects linked to that course.
 */
export async function getPublishedProjects(options: { courseId?: string } = {}): Promise<PublicProject[]> {
  if (!isFirebaseConfigured()) return [];

  const snapshot = await getDocs(query(collection(firebase.db, 'projects'), where('isPublished', '==', true)));

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: String(data.title || '').trim(),
        studentName: String(data.studentName || '').trim(),
        cohort: String(data.cohort || '').trim(),
        description: String(data.description || '').trim(),
        technologies: Array.isArray(data.technologies)
          ? data.technologies.map((tech: unknown) => String(tech).trim()).filter(Boolean)
          : [],
        imageUrl: safeImage(data.imageUrl),
        projectUrl: safeLink(data.projectUrl),
        repoUrl: safeLink(data.repoUrl),
        courseId: String(data.courseId || '').trim(),
        order: Number.isFinite(Number(data.order)) ? Number(data.order) : 999,
      };
    })
    .filter((project) => project.title && project.studentName && project.description && project.imageUrl)
    .filter((project) => !options.courseId || project.courseId === options.courseId)
    .sort((a, b) => a.order - b.order);
}
