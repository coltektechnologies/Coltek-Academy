import { NextResponse } from 'next/server';
import { getRelatedPublicCourses } from '@/lib/public-course';

// Other published courses in a category. Public fields only (see lib/public-course.ts).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const excludeId = searchParams.get('excludeId') || '';
  const limitCount = Math.min(12, Math.max(1, parseInt(searchParams.get('limit') || '3') || 3));

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  try {
    return NextResponse.json(await getRelatedPublicCourses(category, excludeId, limitCount));
  } catch (error) {
    console.error('Error fetching related courses:', error);
    return NextResponse.json({ error: 'Failed to fetch related courses' }, { status: 500 });
  }
}
