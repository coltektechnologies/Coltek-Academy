"use client";

import { LoadingState } from '@/components/academy/states'
import { Suspense, useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp, getDoc, query, orderBy } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { firebase } from '@/lib/firebase';
import { getAllEnrollments } from '@/lib/enrollment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { BookOpen, ExternalLink, MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminPage, AdminPageHeader, AdminSearch, AdminTableCard, AdminToolbar, StatusBadge, formatAdminDate } from '@/components/admin/admin-ui';
import { EmptyState } from '@/components/academy/states';
import { isCourseUpcoming } from '@/lib/course-display';
import { cn } from '@/lib/utils';
import { CourseForm } from '@/components/admin/CourseForm';
import { Course as CourseType, CourseFormData } from '@/types/course';
import { deleteObject, ref } from 'firebase/storage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Instructor {
  id?: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  role?: string;
}

interface Course extends DocumentData {
  // Core Course Information
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  
  // Course Metadata
  category: string;
  subCategory: string;
  tags: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  duration: string | number; // admin-entered text, e.g. "10 weeks" (legacy records may be numbers)
  
  // Pricing & Enrollment
  price: number;
  originalPrice: number;
  isFree: boolean;
  hasDiscount: boolean;
  enrolledStudents: number;
  maxStudents?: number;
  
  // Media
  image: string;
  previewVideo?: string;
  thumbnail?: string;
  
  // Status & Visibility
  isPublished: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  certificateIncluded: boolean;
  
  // Instructor Information
  instructor: Instructor;
  coInstructors?: Instructor[];
  
  // Course Content
  curriculum: Array<{
    id: string;
    title: string;
    description?: string;
    duration: number;
    order: number;
    resources?: Array<{
      id: string;
      title: string;
      type: 'video' | 'article' | 'quiz' | 'download' | 'assignment';
      url: string;
      duration?: number;
      isPreview: boolean;
    }>;
  }>;
  
  // Reviews & Ratings
  rating: number;
  totalRatings: number;
  reviews?: Array<{
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  
  // System Fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  version: number;
  
  // SEO & Marketing
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  
  // Completion & Certification
  completionCriteria?: {
    minProgress: number; // percentage
    minQuizScore?: number; // percentage
    requireAssignment?: boolean;
  };
  certificateTemplate?: string;
  
  // Advanced Settings
  accessType: 'public' | 'private' | 'subscription';
  accessRules?: {
    requiresApproval: boolean;
    allowedUsers?: string[];
    startDate?: string;
    endDate?: string;
  };
  
  // Analytics
  views: number;
  completionRate?: number;
  averageTimeToComplete?: number; // in minutes
  
  // Additional Features
  hasForum: boolean;
  hasLiveSessions: boolean;
  hasQASection: boolean;
  
  // Custom Fields
  customFields?: Record<string, any>;
}

function AdminCoursesPageContent() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  // Real student counts per course from the enrollments collection (the course's own
  // enrolledStudents field is seeded/unverified and is not shown)
  const [enrollmentCounts, setEnrollmentCounts] = useState<Map<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseType | null>(null);
  const [editingCourse, setEditingCourse] = useState<CourseType | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const fetchCourses = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const coursesRef = collection(firebase.db, 'courses');
      
      // No Firestore orderBy: it would silently drop courses that have no createdAt field
      const querySnapshot = await getDocs(coursesRef);
      const coursesData: CourseType[] = [];
      
      
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const course: Partial<CourseType> = { id: doc.id };
        
        // Ensure we have valid data
        if (!data) {
          console.warn('Document has no data:', doc.id);
          return;
        }
        
        // Map Firestore data to our Course type
        for (const [key, value] of Object.entries(data)) {
          if (value === null || value === undefined) continue;
          
          // Handle Firestore Timestamps
          if (value && typeof value === 'object' && 'toDate' in value) {
            const timestamp = value as { toDate: () => Date };
            course[key as keyof CourseType] = timestamp.toDate().toISOString() as any;
          } 
          // Handle nested objects like instructor
          else if (key === 'instructor' && typeof value === 'object') {
            course.instructor = value as any;
          }
          // Handle arrays
          else if (Array.isArray(value)) {
            course[key as keyof CourseType] = [...value] as any;
          }
          // Handle primitive values
          else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            course[key as keyof CourseType] = value as any;
          }
        }
        
        // Ensure required fields have default values
        const defaultCourse: Partial<CourseType> = {
          title: 'Untitled Course',
          slug: '',
          description: '',
          shortDescription: '',
          learningObjectives: [],
          requirements: [],
          targetAudience: [],
          category: '',
          subCategory: '',
          tags: [],
          level: 'Beginner',
          language: 'English',
          duration: 0,
          price: 0,
          originalPrice: 0,
          isFree: false,
          hasDiscount: false,
          enrolledStudents: 0,
          image: '',
          isPublished: false,
          isFeatured: false,
          upcoming: false,
          isApproved: false,
          certificateIncluded: false,
          instructor: {
            name: '',
            email: '',
            role: 'instructor',
          },
          curriculum: [],
          rating: 0,
          totalRatings: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: '',
          version: 1,
          accessType: 'public',
          views: 0,
          hasForum: false,
          hasLiveSessions: false,
          hasQASection: false,
        };
        
        coursesData.push({ ...defaultCourse, ...course } as Course);
      });
      
      if (coursesData.length === 0) {
        console.warn('No courses found in the database');
      }
      coursesData.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      setCourses(coursesData);
      setLoading(false);

      // Distinct students per course, cancelled enrollments excluded (same rule as the public site)
      getAllEnrollments()
        .then((enrollments) => {
          const usersByCourse = new Map<string, Set<string>>();
          enrollments.forEach((enrollment) => {
            if (String(enrollment.status || '').toLowerCase() === 'cancelled' || !enrollment.courseId) return;
            const users = usersByCourse.get(enrollment.courseId) || new Set<string>();
            users.add(enrollment.userId || enrollment.userEmail || enrollment.id);
            usersByCourse.set(enrollment.courseId, users);
          });
          setEnrollmentCounts(new Map([...usersByCourse].map(([courseId, users]) => [courseId, users.size])));
        })
        .catch((error) => console.error('Error counting enrollments:', error));
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Admin access is enforced by app/admin/layout.tsx (AdminGuard)
  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  const handleEditCourse = (course: CourseType) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the course document
      await deleteDoc(doc(firebase.db, 'courses', courseToDelete.id));
      
      // Delete the course image from storage if it exists
      if (courseToDelete.image) {
        try {
          const imageRef = ref(firebase.storage, courseToDelete.image);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('Error deleting course image:', error);
          // Continue even if image deletion fails
        }
      }
      
      await fetchCourses(true);
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setCourseToDelete(null);
    }
  };

  const handleSubmitCourse = async (data: Omit<CourseFormData, 'imageFile' | 'imagePreview'>) => {
    try {
      setIsSubmitting(true);
      const now = new Date().toISOString();
      const courseData = {
        ...data,
        updatedAt: now,
        version: (editingCourse?.version || 0) + 1,
      };

      if (editingCourse) {
        // Update existing course
        await setDoc(doc(firebase.db, 'courses', editingCourse.id), courseData, { merge: true });
        toast({
          title: 'Success',
          description: 'Course updated successfully',
        });
      } else {
        // Create new course
        const courseRef = doc(collection(firebase.db, 'courses'));
        await setDoc(courseRef, {
          ...courseData,
          id: courseRef.id,
          createdAt: now,
          enrolledStudents: 0,
          rating: 0,
          totalRatings: 0,
          views: 0,
        });
        toast({
          title: 'Success',
          description: 'Course created successfully',
        });
      }

      // Refresh the courses list and close the form
      await fetchCourses(true);
      setIsFormOpen(false);
      setEditingCourse(null);
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingCourse ? 'update' : 'create'} course`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const counts = {
    all: courses.length,
    published: courses.filter((c) => c.isPublished).length,
    draft: courses.filter((c) => !c.isPublished).length,
  };
  const q = search.trim().toLowerCase();
  const visibleCourses = courses.filter((c) => {
    if (statusFilter === 'published' && !c.isPublished) return false;
    if (statusFilter === 'draft' && c.isPublished) return false;
    return !q || [c.title, c.category, c.level].some((v) => String(v || '').toLowerCase().includes(q));
  });

  const priceLabel = (course: CourseType) => {
    if (isCourseUpcoming(course as any)) return 'Coming soon';
    if (course.isFree || !course.price) return 'Free';
    return `GH₵${Number(course.price).toLocaleString()}`;
  };

  const openCreate = () => {
    setEditingCourse(null);
    setIsFormOpen(true);
  };

  const rowActions = (course: CourseType) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${course.title}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => handleEditCourse(course)}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        {course.isPublished && (
          <DropdownMenuItem asChild>
            <a href={`/courses/${course.slug || course.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              View on website
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => setCourseToDelete(course)}>
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const thumbnail = (course: CourseType, className: string) =>
    course.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={course.image} alt="" className={cn('shrink-0 rounded-md border border-border object-cover', className)} loading="lazy" />
    ) : (
      <span className={cn('flex shrink-0 items-center justify-center rounded-md bg-secondary text-primary', className)} aria-hidden="true">
        <BookOpen className="size-5" />
      </span>
    );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Courses"
        description="Create and edit courses. Only published courses appear on the website."
        meta={
          !loading ? (
            <>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{counts.published}</strong> published
              </span>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{counts.draft}</strong> drafts
              </span>
            </>
          ) : undefined
        }
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" />
            Add course
          </Button>
        }
      />

      {loading ? (
        <LoadingState size="page" label="Loading courses…" />
      ) : (
        <>
          <AdminToolbar>
            <AdminSearch value={search} onChange={setSearch} placeholder="Search title, category or level" label="Search courses" />
            <div role="group" aria-label="Filter by status" className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {(['all', 'published', 'draft'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={statusFilter === key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    statusFilter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {key === 'all' ? 'All' : key === 'published' ? 'Published' : 'Drafts'}
                  <span className={cn('tabular-nums', statusFilter === key ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{counts[key]}</span>
                </button>
              ))}
            </div>
          </AdminToolbar>

          {visibleCourses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={courses.length === 0 ? 'No courses yet' : 'No courses match'}
              description={courses.length === 0 ? 'Create your first course to get started.' : 'Try a different search or filter.'}
              action={
                courses.length === 0 ? (
                  <Button onClick={openCreate}>
                    <Plus aria-hidden="true" />
                    Add course
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <AdminTableCard className="hidden md:block">
                <Table>
                  <TableCaption className="sr-only">Courses</TableCaption>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="h-11 px-4">Course</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4 text-right">Price</TableHead>
                      <TableHead className="h-11 px-4 text-right">Students</TableHead>
                      <TableHead className="h-11 px-4">Created</TableHead>
                      <TableHead className="h-11 px-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {thumbnail(course, 'h-10 w-16')}
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => handleEditCourse(course)}
                                className="max-w-80 truncate rounded-sm text-left font-medium text-foreground underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              >
                                {course.title}
                              </button>
                              <p className="text-muted-foreground">
                                {[course.category, course.level].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <StatusBadge status={course.isPublished ? 'published' : 'draft'} />
                            {isCourseUpcoming(course as any) && <StatusBadge status="upcoming" />}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-medium text-foreground tabular-nums">{priceLabel(course)}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-foreground tabular-nums">{enrollmentCounts ? enrollmentCounts.get(course.id) ?? 0 : '…'}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground tabular-nums">{formatAdminDate(course.createdAt)}</TableCell>
                        <TableCell className="px-4 py-3 text-right">{rowActions(course)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableCard>

              <ul className="space-y-3 md:hidden" aria-label="Courses">
                {visibleCourses.map((course) => (
                  <li key={course.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      {thumbnail(course, 'h-12 w-16')}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{[course.category, course.level].filter(Boolean).join(' · ')}</p>
                      </div>
                      {rowActions(course)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <StatusBadge status={course.isPublished ? 'published' : 'draft'} />
                      {isCourseUpcoming(course as any) && <StatusBadge status="upcoming" />}
                      <span className="font-medium text-foreground tabular-nums">{priceLabel(course)}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {enrollmentCounts ? enrollmentCounts.get(course.id) ?? 0 : '…'} students
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* Course form */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) setEditingCourse(null);
          setIsFormOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? `Edit ${editingCourse.title}` : 'Add course'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update the course details below.' : 'Fill in the details to create a new course. It stays a draft until you publish it.'}
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            key={editingCourse?.id ?? 'new'}
            initialData={editingCourse || undefined}
            onSubmit={handleSubmitCourse}
            isSubmitting={isSubmitting}
            error={null}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && !isDeleting && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{courseToDelete?.title}&rdquo; will be permanently deleted and removed from the website. Existing enrollment and certificate records are kept. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteCourse();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting…' : 'Delete course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}

// Reads the URL (useSearchParams), so the page renders inside its own Suspense boundary
export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<LoadingState size="page" label="Loading courses…" />}>
      <AdminCoursesPageContent />
    </Suspense>
  )
}
