import { NextRequest, NextResponse } from 'next/server'
import { getCourseById } from '@/lib/courses'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.status && data.data.status === 'success') {
      const paystackData = data.data
      const rawMetadata = paystackData.metadata
      const metadata =
        typeof rawMetadata === 'string'
          ? (() => { try { return JSON.parse(rawMetadata) } catch { return null } })()
          : rawMetadata

      // Confirm the amount actually paid covers the current course price
      const course = metadata?.courseId ? await getCourseById(String(metadata.courseId)) : null
      const expectedAmount = course && typeof course.price === 'number' ? Math.round(course.price * 100) : null
      if (
        expectedAmount === null ||
        paystackData.currency !== 'GHS' ||
        typeof paystackData.amount !== 'number' ||
        paystackData.amount < expectedAmount
      ) {
        console.error('Payment verification mismatch for reference', paystackData.reference)
        return NextResponse.json({
          status: 'failed',
          message: 'Payment amount does not match the course price'
        }, { status: 400 })
      }

      return NextResponse.json({
        status: 'success',
        data: {
          reference: paystackData.reference,
          amount: paystackData.amount,
          currency: paystackData.currency,
          status: paystackData.status,
          metadata: metadata || null,
        }
      })
    } else {
      return NextResponse.json({
        status: 'failed',
        message: 'Payment verification failed'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}