import { NextRequest, NextResponse } from 'next/server'
import { userPreferencesService } from '@/lib/user/user-preferences-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const preferencesData = await file.text()
    
    const preferences = await userPreferencesService.importUserPreferences(
      session.user.id,
      preferencesData
    )
    
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error importing user preferences:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}