import { NextRequest, NextResponse } from 'next/server'
import { getCourseById } from '@/lib/courses'

export async function POST(request: NextRequest) {
  try {
    const { email, courseId, userId, userEmail } = await request.json()

    if (!email || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, courseId' },
        { status: 400 }
      )
    }

    // The amount is always taken from the course record, never from the client request
    const course = await getCourseById(String(courseId))
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    if (typeof course.price !== 'number' || course.price <= 0) {
      return NextResponse.json({ error: 'This course does not require payment' }, { status: 400 })
    }
    const amount = course.price
    const courseTitle = course.title

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not found in environment')
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    const requestBody = {
      email,
      amount: Math.round(amount * 100), // Convert to pesewas (GHS subunit, 1 GHS = 100 pesewas)
      currency: 'GHS',
      reference: `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://coltekacademy.coltektechnologies.io')}/payment-success`,
      metadata: {
        courseId,
        courseTitle,
        userId,
        userEmail,
      },
    }

    // In development, simulate successful response if Paystack is unreachable
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_PAYSTACK === 'true') {
      console.log('Using mock Paystack response for development')
      const mockReference = `MOCK-${Date.now()}`
      const mockResponse = {
        status: true,
        message: 'Transaction initialized successfully (MOCK)',
        data: {
          authorization_url: `http://localhost:3000/payment-success?reference=${mockReference}&trxref=${mockReference}`,
          access_code: `MOCK-${Date.now()}`,
          reference: mockReference
        }
      }
      return NextResponse.json(mockResponse)
    }

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paystack initialization failed:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      return NextResponse.json(
        { error: data.message || 'Failed to initialize payment', details: data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}