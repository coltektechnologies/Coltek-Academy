import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // Verify webhook signature (for production)
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha512', secret)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        console.log('Payment successful:', event.data)
        // Here you would typically:
        // 1. Update the user's enrollment status in your database
        // 2. Send confirmation email
        // 3. Grant access to the course
        break

      case 'charge.failed':
        console.log('Payment failed:', event.data)
        // Handle failed payment
        break

      default:
        console.log('Unhandled event:', event.event)
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}