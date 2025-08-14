import { NextRequest, NextResponse } from 'next/server'
import { aiActionsService } from '@/lib/ai/ai-actions-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined

    const actions = await aiActionsService.getAvailableActions(userId)
    return NextResponse.json(actions)
  } catch (error) {
    console.error('Error getting AI actions:', error)
    return NextResponse.json(
      { error: 'Failed to get AI actions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionId, context } = body

    if (!actionId || !context) {
      return NextResponse.json(
        { error: 'Missing required parameters: actionId and context' },
        { status: 400 }
      )
    }

    const result = await aiActionsService.executeAction(actionId, context)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error executing AI action:', error)
    return NextResponse.json(
      { error: 'Failed to execute AI action' },
      { status: 500 }
    )
  }
}