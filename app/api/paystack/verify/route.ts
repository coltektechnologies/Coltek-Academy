import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
  }

  try {
    // In production, you would verify the payment with Paystack API
    // For now, we'll just return a success response for testing
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.status && data.data.status === 'success') {
      return NextResponse.json({
        status: 'success',
        data: {
          reference: data.data.reference,
          amount: data.data.amount,
          currency: data.data.currency,
          status: data.data.status,
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