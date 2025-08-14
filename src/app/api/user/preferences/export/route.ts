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

    const preferencesData = await userPreferencesService.exportUserPreferences(session.user.id)
    
    return new NextResponse(preferencesData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="omnior-preferences-${session.user.id}-${Date.now()}.json"`
      }
    })
  } catch (error) {
    console.error('Error exporting user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}