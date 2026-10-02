import { NextResponse } from 'next/server';
import { getPublishedProjects } from '@/lib/public-projects';

/**
 * Published student projects, managed by admins at /admin/projects.
 * Optional `?courseId=` returns only projects linked to that course.
 */
export async function GET(request: Request) {
  try {
    const courseId = new URL(request.url).searchParams.get('courseId')?.trim() || undefined;
    return NextResponse.json(await getPublishedProjects({ courseId }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
