import { NextRequest, NextResponse } from 'next/server'
import { userPreferencesService } from '@/lib/user/user-preferences-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const preferences = await userPreferencesService.getUserPreferences(session.user.id)
    
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const updates = await request.json()
    
    const preferences = await userPreferencesService.updateUserPreferences(
      session.user.id,
      updates
    )
    
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await userPreferencesService.resetUserPreferences(session.user.id)
    
    return NextResponse.json({ message: 'Preferences reset successfully' })
  } catch (error) {
    console.error('Error resetting user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}