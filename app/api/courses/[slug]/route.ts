import { NextResponse } from 'next/server';
import { getPublicCourseBySlug } from '@/lib/public-course';

// Public course details. Returns only public fields (see lib/public-course.ts) — never internal data
// such as issued certificates, and never unverified rating/review figures.
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { slug: pathSlug } = await context.params;
    const slug = pathSlug || searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Course slug is required' }, { status: 400 });
    }

    const course = await getPublicCourseBySlug(slug);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}
