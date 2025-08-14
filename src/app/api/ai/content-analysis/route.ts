import { NextRequest, NextResponse } from 'next/server'
import { aiContentAnalysisService } from '@/lib/ai/ai-content-analysis-service'
import type { ContentAnalysisRequest } from '@/lib/ai/ai-content-analysis-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, type, analysisType, options }: ContentAnalysisRequest = body

    // Validate required fields
    if (!content || !type || !analysisType) {
      return NextResponse.json(
        { error: 'Missing required fields: content, type, analysisType' },
        { status: 400 }
      )
    }

    // Validate content length
    if (content.length > 50000) {
      return NextResponse.json(
        { error: 'Content too long. Maximum 50,000 characters allowed.' },
        { status: 400 }
      )
    }

    // Perform analysis
    const result = await aiContentAnalysisService.analyzeContent({
      content,
      type,
      analysisType,
      options
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Content analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}