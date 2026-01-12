"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseFilters } from "@/components/courses/course-filters"
import { CoursesGrid } from "@/components/courses/courses-grid"
import { courses as allCourses } from "@/lib/data"
import type { Course } from "@/lib/types"

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "All Categories")
  const [selectedLevel, setSelectedLevel] = useState("All Levels")
  const [sortBy, setSortBy] = useState("popular")
  const [priceRange, setPriceRange] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, selectedLevel, sortBy, priceRange])

  // Update category when URL param changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])

  const filteredCourses = useMemo(() => {
    let filtered: Course[] = [...allCourses]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.category.toLowerCase().includes(query),
      )
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "All Categories") {
      filtered = filtered.filter((course) => course.category === selectedCategory)
    }

    // Level filter
    if (selectedLevel && selectedLevel !== "All Levels") {
      filtered = filtered.filter((course) => course.level === selectedLevel)
    }

    // Price range filter
    if (priceRange !== "all") {
      switch (priceRange) {
        case "0-300":
          filtered = filtered.filter((course) => course.price < 300)
          break
        case "300-500":
          filtered = filtered.filter((course) => course.price >= 300 && course.price < 500)
          break
        case "500-700":
          filtered = filtered.filter((course) => course.price >= 500 && course.price < 700)
          break
        case "700+":
          filtered = filtered.filter((course) => course.price >= 700)
          break
      }
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

    return filtered
  }, [searchQuery, selectedCategory, selectedLevel, sortBy, priceRange])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Explore Our Courses</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Discover a wide range of courses designed to help you learn new skills and advance your career.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters */}
              <aside className="lg:w-72 shrink-0">
                <div className="lg:sticky lg:top-24">
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

              {/* Course Grid */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredCourses.length}</span> courses
                  </p>
                </div>
                <CoursesGrid courses={filteredCourses} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
