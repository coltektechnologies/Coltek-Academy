"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Lazy load components
const Navbar = dynamic(
  () => import('@/components/navbar').then(mod => mod.Navbar),
  { ssr: false, loading: () => <div className="h-16 bg-background" /> }
);

const Footer = dynamic(
  () => import('@/components/footer').then(mod => mod.Footer),
  { ssr: false, loading: () => null }
);

const CourseFilters = dynamic<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  priceRange: string;
  setPriceRange: (range: string) => void;
}>(
  () => import('@/components/courses/course-filters').then(mod => (mod as any).default || mod.CourseFilters || mod),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const CoursesGrid = dynamic<{ courses: Course[]; isLoading: boolean }>(
  () => import('@/components/courses/courses-grid').then(mod => (mod as any).default || mod.CoursesGrid || mod),
  { ssr: false, loading: () => <LoadingFallback /> }
);

import type { Course } from "@/lib/types"

// Import SortDropdown with ssr false to avoid hydration issues
const SortDropdown = dynamic(
  () => import('@/components/courses/sort-dropdown').then(mod => mod.SortDropdown),
  { 
    ssr: false,
    loading: () => <div className="w-48 h-10 bg-muted animate-pulse rounded-md" />
  }
);

export default function CoursesPage() {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "All Categories")
  const [selectedLevel, setSelectedLevel] = useState("All Levels")
  const [sortBy, setSortBy] = useState("price-low")
  const [priceRange, setPriceRange] = useState("all")

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('Fetching courses...');
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/courses', {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Fetched courses:', data);
        
        // Ensure we have valid course data
        if (!Array.isArray(data)) {
          throw new Error(`Invalid courses data format: ${typeof data}`);
        }
        
        // Transform and validate course data
        const validCourses = data
          .filter(course => {
            try {
              const isValid = course && 
                            course.id && 
                            course.title && 
                            course.category &&
                            course.level &&
                            typeof course.price === 'number';
              
              if (!isValid) {
                console.warn('Invalid course data:', course);
                return false;
              }
              return true;
            } catch (err) {
              console.error('Error validating course:', course, err);
              return false;
            }
          })
          .map(course => ({
            ...course,
            // Ensure required fields have default values if missing
            enrolledStudents: course.enrolledStudents || 0,
            rating: course.rating || 0,
            totalRatings: course.totalRatings || 0,
            lastUpdated: course.lastUpdated || new Date().toISOString(),
            isPublished: course.isPublished !== false,
            image: course.image || '/placeholder-course.jpg',
            // Ensure all required fields are present
            category: course.category || 'Uncategorized',
            level: course.level || 'Beginner',
            price: typeof course.price === 'number' ? course.price : 0,
            instructor: course.instructor || { name: 'Instructor' }
          }));
        
        console.log(`Processed ${validCourses.length} valid courses out of ${data.length}`);
        
        if (validCourses.length === 0) {
          console.warn('No valid courses found in the response');
          setError('No courses found. Please try again later.');
        } else {
          console.log('Setting allCourses state with:', validCourses);
          setAllCourses(validCourses);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Update category when URL param changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])

  // **FIX: Added allCourses to dependency array**
  const filteredCourses = useMemo(() => {
    console.log('Filtering courses with state:', { 
      allCoursesCount: allCourses?.length,
      searchQuery,
      selectedCategory,
      selectedLevel,
      sortBy,
      priceRange
    });
    
    // If no courses or not an array, return empty array
    if (!Array.isArray(allCourses) || allCourses.length === 0) {
      console.log('No courses to filter');
      return [];
    }
    
    // Create a new array to avoid mutating the original
    let filtered = [...allCourses];
    console.log(`Starting with ${filtered.length} courses`);

    // Apply filters only if they have values
    const hasSearchQuery = searchQuery.trim() !== '';
    const hasCategoryFilter = selectedCategory && selectedCategory !== "All Categories";
    const hasLevelFilter = selectedLevel && selectedLevel !== "All Levels";

    // Apply search filter if there's a search query
    if (hasSearchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (course) =>
          (course.title?.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query) ||
          course.category?.toLowerCase().includes(query) ||
          (course.instructor?.name && course.instructor.name.toLowerCase().includes(query)))
      );
      console.log(`Search filter (${query}): ${beforeSearch} -> ${filtered.length} courses`);
    }

    // Apply category filter if selected
    if (hasCategoryFilter) {
      const beforeCategory = filtered.length;
      const categoryLower = selectedCategory.toLowerCase();
      filtered = filtered.filter(
        (course) => course.category?.toLowerCase() === categoryLower
      );
      console.log(`Category filter (${selectedCategory}): ${beforeCategory} -> ${filtered.length} courses`);
    }

    // Apply level filter if selected
    if (hasLevelFilter) {
      const beforeLevel = filtered.length;
      const levelLower = selectedLevel.toLowerCase();
      filtered = filtered.filter(
        (course) => course.level?.toLowerCase() === levelLower
      );
      console.log(`Level filter (${selectedLevel}): ${beforeLevel} -> ${filtered.length} courses`);
    }

    // Apply price range filter if selected
    if (priceRange && priceRange !== "all") {
      const beforePrice = filtered.length;
      switch (priceRange) {
        case "0-300":
          filtered = filtered.filter((course) => course.price < 300);
          break;
        case "300-500":
          filtered = filtered.filter((course) => course.price >= 300 && course.price < 500);
          break;
        case "500-700":
          filtered = filtered.filter((course) => course.price >= 500 && course.price < 700);
          break;
        case "700+":
          filtered = filtered.filter((course) => course.price >= 700);
          break;
      }
      console.log(`Price filter (${priceRange}): ${beforePrice} -> ${filtered.length} courses`);
    }

    // Sort
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.enrolledStudents - a.enrolledStudents)
        break
      case "newest":
        filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        break
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
    }

    console.log(`Final filtered courses: ${filtered.length}`);
    return filtered
  }, [allCourses, searchQuery, selectedCategory, selectedLevel, sortBy, priceRange]) // **ADDED allCourses**

  // Get unique categories and levels for filters
  const categories = useMemo(() => {
    const cats = new Set<string>(["All Categories"])
    allCourses?.forEach((course) => {
      if (course.category) {
        cats.add(course.category)
      }
    })
    return Array.from(cats)
  }, [allCourses])

  const levels = useMemo(() => {
    const lvls = new Set<string>(["All Levels"])
    allCourses?.forEach((course) => {
      if (course.level) {
        lvls.add(course.level)
      }
    })
    return Array.from(lvls)
  }, [allCourses])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Error loading courses</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Our Courses
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Discover the perfect course to advance your career
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar with filters */}
            <aside className="w-full lg:w-80 shrink-0">
              <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <CourseFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedLevel={selectedLevel}
                  setSelectedLevel={setSelectedLevel}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1">
              <Suspense fallback={<LoadingFallback />}>
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'} Found
                  </h2>
                  <div className="w-48">
                    <SortDropdown value={sortBy} onChange={setSortBy} />
                  </div>
                </div>
                <CoursesGrid 
                  courses={filteredCourses} 
                  isLoading={isLoading} 
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}