import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const excludeId = searchParams.get('excludeId');
  const limitCount = parseInt(searchParams.get('limit') || '3');

  if (!category) {
    return NextResponse.json(
      { error: 'Category is required' },
      { status: 400 }
    );
  }

  try {
    // Get all courses in the same category
    let q = query(
      collection(db, 'courses'),
      where('category', '==', category)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter out the current course and limit results
    const relatedCourses = querySnapshot.docs
      .filter(doc => doc.id !== excludeId) // Filter out the current course
      .slice(0, limitCount) // Apply limit after filtering
      .map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, price: 150 };
      });

    return NextResponse.json(relatedCourses);
  } catch (error) {
    console.error('Error fetching related courses:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch related courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
