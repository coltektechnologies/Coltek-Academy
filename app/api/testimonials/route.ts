import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { firebase, isFirebaseConfigured } from '@/lib/firebase';

export interface PublicTestimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatarUrl: string;
  order: number;
  createdAt: string;
}

function toDateString(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
  }

  return new Date(0).toISOString();
}

export async function GET() {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json([]);
    }

    const testimonialsQuery = query(
      collection(firebase.db, 'testimonials'),
      where('isPublished', '==', true)
    );
    const snapshot = await getDocs(testimonialsQuery);

    const testimonials: PublicTestimonial[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          name: String(data.name || '').trim(),
          role: String(data.role || '').trim(),
          content: String(data.content || '').trim(),
          rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
          avatarUrl: String(data.avatarUrl || '').trim(),
          order: Number.isFinite(Number(data.order)) ? Number(data.order) : 999,
          createdAt: toDateString(data.createdAt),
        };
      })
      .filter((testimonial) => testimonial.name && testimonial.content)
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}
