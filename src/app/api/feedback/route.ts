import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { FeedbackSchema } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const feedbackData = FeedbackSchema.parse(body)

    // Insert into Supabase
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        page: feedbackData.page,
        rating: feedbackData.rating,
        confusing: feedbackData.confusing,
        request: feedbackData.request,
        comment: feedbackData.comment,
        contact: feedbackData.contact,
      })
      .select()
      .single()

    if (error) {
      console.error('Feedback submission error:', error)
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Feedback submitted successfully', data },
      { status: 201 }
    )

  } catch (error) {
    console.error('Feedback API error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}