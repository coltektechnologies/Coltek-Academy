"use client"

import { notFound, useParams } from "next/navigation"
import { Suspense, useEffect, useState, useCallback } from "react"
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Course } from "@/lib/types"

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Lazy load components with proper dynamic imports
const Navbar = dynamic(
  () => import('@/components/navbar').then(mod => mod.Navbar),
  { 
    ssr: false,
    loading: () => <div className="h-16 bg-background" />
  }
);

const Footer = dynamic(
  () => import('@/components/footer').then(mod => mod.Footer || mod),
  { 
    ssr: false,
    loading: () => null
  }
);

const CourseHero = dynamic(
  () => import('@/components/course-detail/course-hero').then(mod => mod.CourseHero || mod),
  { 
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

const CourseContent = dynamic(
  () => import('@/components/course-detail/course-content').then(mod => mod.CourseContent || mod),
  { 
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

const RelatedCourses = dynamic(
  () => import('@/components/course-detail/related-courses').then(mod => mod.RelatedCourses || mod),
  { 
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

// Client-side metadata handling
const useCourseMetadata = (course: Course | null) => {
  // Always call hooks unconditionally at the top level
  const title = course?.title || 'Coltek Academy';
  const description = course?.description || 'Online Learning Platform';
  
  useEffect(() => {
    // Update document title
    document.title = course ? `${title} | Coltek Academy` : 'Coltek Academy';
    
    // Update meta description if it exists
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', course ? description : 'Coltek Academy - Online Learning Platform');
    }
    
    // Cleanup function to reset title and description
    return () => {
      document.title = 'Coltek Academy';
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Coltek Academy - Online Learning Platform');
      }
    };
  }, [course, title, description]);
};

// Custom hook for fetching related courses
const useRelatedCourses = (course: Course | null) => {
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRelatedCourses = async () => {
      if (!course?.category) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/courses/related?category=${encodeURIComponent(course.category)}&excludeId=${course.id}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch related courses');
        }
        
        const data = await response.json();
        setRelatedCourses(data);
      } catch (error) {
        console.error('Error fetching related courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedCourses();
  }, [course]);

  return { relatedCourses, isLoading };
};

export default function CoursePage() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Call all hooks at the top level
  useCourseMetadata(course);
  const { relatedCourses, isLoading: isLoadingRelated } = useRelatedCourses(course);
  
  const fetchCourse = useCallback(async (slug: string | string[]) => {
    const courseSlug = Array.isArray(slug) ? slug[0] : slug;
    
    if (!courseSlug) {
      setError('Course slug is missing');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Try fetching with the slug in the URL path
      let response = await fetch(`/api/courses/${encodeURIComponent(courseSlug)}`);
      
      // If that fails with 400, try with query parameter
      if (response.status === 400) {
        response = await fetch(`/api/courses/${encodeURIComponent(courseSlug)}?slug=${encodeURIComponent(courseSlug)}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          notFound();
          return;
        }
        throw new Error(data.error || 'Failed to fetch course');
      }
      
      setCourse(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const slug = params?.slug;
    if (slug) {
      fetchCourse(Array.isArray(slug) ? slug[0] : slug);
    } else {
      setError('Course slug is missing');
      setIsLoading(false);
    }
  }, [params?.slug, fetchCourse, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mb-4">
            {error}
          </AlertDescription>
          <Button 
            variant="outline" 
            onClick={handleRetry}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Try Again'}
          </Button>
        </Alert>
      </div>
    )
  }

  if (!course) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <CourseHero course={course} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CourseContent course={course} />
          </div>
          {!isLoadingRelated && relatedCourses.length > 0 && (
            <RelatedCourses 
              courses={relatedCourses} 
              currentCourseId={course.id} 
            />
          )}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
