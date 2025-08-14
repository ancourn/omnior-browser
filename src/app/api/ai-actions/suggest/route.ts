import { NextRequest, NextResponse } from 'next/server'
import { aiActionsService } from '@/lib/ai/ai-actions-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context } = body

    if (!context) {
      return NextResponse.json(
        { error: 'Missing required parameter: context' },
        { status: 400 }
      )
    }

    const suggestions = await aiActionsService.suggestActions(context)
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error getting action suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to get action suggestions' },
      { status: 500 }
    )
  }
}