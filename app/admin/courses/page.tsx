"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp, getDoc, query, orderBy } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { CourseForm } from '@/components/admin/CourseForm';
import { Course as CourseType, CourseFormData } from '@/types/course';
import { deleteObject, ref } from 'firebase/storage';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  duration: number; // in minutes
  
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

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseType | null>(null);
  const [editingCourse, setEditingCourse] = useState<CourseType | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Debug authentication state
  const [authState, setAuthState] = useState<any>(null);

  const fetchCourses = useCallback(async () => {
    try {
      console.log('1. Starting to fetch courses...');
      setLoading(true);
      const coursesRef = collection(db, 'courses');
      console.log('2. Collection reference created:', coursesRef);
      
      console.log('3. Attempting to get documents...');
      const querySnapshot = await getDocs(query(coursesRef, orderBy('createdAt', 'desc')));
      const coursesData: CourseType[] = [];
      
      console.log('4. Collection metadata:', {
        size: querySnapshot.size,
        empty: querySnapshot.empty,
        docs: querySnapshot.docs.length
      });
      
      console.log('5. Snapshot details:', {
        metadata: querySnapshot.metadata,
        query: querySnapshot.query
      });
      
      console.log('6. Documents in collection:');
      querySnapshot.forEach((doc) => {
        console.log('Processing document:', doc.id, doc.data());
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
      
      console.log('7. Processed courses data:', coursesData);
      console.log('8. Setting courses state with data:', coursesData);
      if (coursesData.length === 0) {
        console.warn('No courses found in the database');
      }
      setCourses(coursesData);
      setLoading(false);
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

  useEffect(() => {
    console.log('Auth state in effect:', authState);
    if (!authState) {
      console.log('Auth state not initialized yet');
      return;
    }
    
    if (authState.isAuthenticated) {
      console.log('User is authenticated, fetching courses...');
      fetchCourses().catch(error => {
        console.error('Error in fetchCourses:', error);
        setLoading(false);
      });
    } else {
      console.log('User is not authenticated, clearing courses');
      setCourses([]);
      setLoading(false);
    }
  }, [fetchCourses, authState]);

  useEffect(() => {
    import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
      const auth = getAuth();
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('Auth state changed:', user);
          setAuthState({
            isAuthenticated: !!user,
            user: user ? {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
              isAnonymous: user.isAnonymous,
              providerData: user.providerData
            } : null
          });
          resolve(user);
        });
        return () => unsubscribe();
      });
    }).catch(console.error);
  }, []);

  const handleEditCourse = (course: CourseType) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the course document
      await deleteDoc(doc(db, 'courses', courseToDelete.id));
      
      // Delete the course image from storage if it exists
      if (courseToDelete.image) {
        try {
          const imageRef = ref(storage, courseToDelete.image);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('Error deleting course image:', error);
          // Continue even if image deletion fails
        }
      }
      
      await fetchCourses();
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
        await setDoc(doc(db, 'courses', editingCourse.id), courseData, { merge: true });
        toast({
          title: 'Success',
          description: 'Course updated successfully',
        });
      } else {
        // Create new course
        const courseRef = doc(collection(db, 'courses'));
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
      await fetchCourses();
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

  // Show loading state while checking auth
  if (authState === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">You need to be logged in to view this page.</p>
        <Button onClick={() => router.push('/admin/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Button onClick={() => {
          setEditingCourse(null);
          setIsFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Course Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingCourse(null);
        }
        setIsFormOpen(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit' : 'Add New'} Course</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update the course details below.' : 'Fill in the details to create a new course.'}
            </DialogDescription>
          </DialogHeader>
          <CourseForm 
            initialData={editingCourse || undefined}
            onSubmit={handleSubmitCourse}
            isSubmitting={isSubmitting}
            error={null}
          />
        </DialogContent>
      </Dialog>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>Manage your courses and their content</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No courses found. Create your first course to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {course.image && (
                            <img 
                              src={course.image} 
                              alt={course.title} 
                              className="h-10 w-16 object-cover rounded-md"
                            />
                          )}
                          <span>{course.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{course.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {course.level?.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        {course.isFeatured && (
                          <Badge variant="secondary" className="ml-2">
                            Featured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.isFree ? (
                          <span className="font-medium text-green-600">Free</span>
                        ) : (
                          <>
                            ${course.price?.toFixed(2)}
                            {course.hasDiscount && course.originalPrice && (
                              <span className="ml-2 text-sm text-muted-foreground line-through">
                                ${course.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>{course.enrolledStudents || 0}</TableCell>
                      <TableCell>
                        {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/courses/${course.slug || course.id}`)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCourse(course)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setCourseToDelete(course);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!courseToDelete} onOpenChange={(open) => {
        if (!open) {
          setCourseToDelete(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCourseToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
