import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { firebase } from '@/lib/firebase';
import { getEnrolledStudentCounts } from '@/lib/enrollment-counts';
import { UPCOMING_COURSE_SLUGS } from '@/lib/course-display';
import type { Course, CurriculumModule } from '@/lib/types';

/**
 * Fields of a course document that are safe to show publicly.
 * Anything else (e.g. issuedCertificates with student ids, createdBy, internal flags) is never returned.
 */
const PUBLIC_FIELDS = [
  'title',
  'slug',
  'description',
  'shortDescription',
  'fullDescription',
  'category',
  'level',
  'language',
  'duration',
  'mode',
  'price',
  'image',
  'whatYouLearn',
  'learningObjectives',
  'prerequisites',
  'requirements',
  'targetAudience',
  'tags',
  'certificateIncluded',
  'lastUpdated',
] as const;

const textList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item ?? '').trim()).filter(Boolean) : [];

/**
 * Curriculum is stored in two shapes: seed courses use { module, lessons: string[] };
 * courses created in the admin form use { title, resources: [{ title }] }. Normalise to modules + lessons.
 */
export function normalizeCurriculum(value: unknown): CurriculumModule[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section: Record<string, unknown>) => {
      const name = String(section?.module ?? section?.title ?? '').trim();
      const lessons = Array.isArray(section?.lessons)
        ? textList(section.lessons)
        : Array.isArray(section?.resources)
          ? (section.resources as Array<Record<string, unknown>>).map((r) => String(r?.title ?? '').trim()).filter(Boolean)
          : [];
      return { module: name, lessons };
    })
    .filter((section) => section.module);
}

/** Build the public representation of a course document. */
export function toPublicCourse(id: string, data: Record<string, unknown>, enrolledStudents = 0): Course {
  const course: Record<string, unknown> = { id };
  for (const field of PUBLIC_FIELDS) {
    if (data[field] !== undefined) course[field] = data[field];
  }
  // Stored instructor fields are unverified seed data; the page uses lib/team.ts instead
  course.instructor = { name: '', bio: '', avatar: '' };
  course.slug = (data.slug as string) || id;
  course.price = typeof data.price === 'number' ? data.price : 0;
  course.upcoming = data.upcoming === true || UPCOMING_COURSE_SLUGS.includes(course.slug as string);
  course.curriculum = normalizeCurriculum(data.curriculum);
  for (const field of ['whatYouLearn', 'learningObjectives', 'prerequisites', 'requirements', 'targetAudience', 'tags']) {
    course[field] = textList(data[field]);
  }
  course.enrolledStudents = enrolledStudents;
  return course as Course;
}

/** A published course by document id or slug, or null. Server-side use (pages and API routes). */
export async function getPublicCourseBySlug(slug: string): Promise<Course | null> {
  let snapshot = await getDoc(doc(firebase.db, 'courses', slug)).catch(() => null);
  if (!snapshot?.exists()) {
    const results = await getDocs(query(collection(firebase.db, 'courses'), where('slug', '==', slug), limit(1)));
    snapshot = results.empty ? null : (results.docs[0] as unknown as typeof snapshot);
  }
  if (!snapshot?.exists()) return null;

  const data = snapshot.data();
  if (data.isPublished !== true) return null;

  const counts = await getEnrolledStudentCounts().catch(() => new Map<string, number>());
  return toPublicCourse(snapshot.id, data, counts.get(snapshot.id) || 0);
}

/** Up to `max` other published courses in the same category. */
export async function getRelatedPublicCourses(category: string, excludeId: string, max = 3): Promise<Course[]> {
  if (!category) return [];
  const [results, counts] = await Promise.all([
    getDocs(query(collection(firebase.db, 'courses'), where('category', '==', category))),
    getEnrolledStudentCounts().catch(() => new Map<string, number>()),
  ]);
  return results.docs
    .filter((item) => item.id !== excludeId && item.data().isPublished === true)
    .slice(0, max)
    .map((item) => toPublicCourse(item.id, item.data(), counts.get(item.id) || 0));
}
