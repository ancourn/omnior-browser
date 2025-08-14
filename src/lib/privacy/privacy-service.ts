"use server"

import { db } from "@/lib/db"
import ZAI from 'z-ai-web-dev-sdk'

// Privacy interfaces
export interface PrivacyScan {
  id: string
  url: string
  scanDate: Date
  risks: PrivacyRisk[]
  overallScore: number // 0-100, higher is better
  recommendations: string[]
  status: 'pending' | 'scanning' | 'completed' | 'failed'
}

export interface PrivacyRisk {
  id: string
  type: 'tracker' | 'cookie' | 'fingerprinting' | 'data_collection' | 'encryption' | 'policy'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence?: string
  recommendation: string
  category: 'tracking' | 'data_security' | 'transparency' | 'user_control'
}

export interface ProductivityTool {
  id: string
  name: string
  description: string
  type: 'focus_timer' | 'site_blocker' | 'task_manager' | 'note_taker' | 'content_analyzer'
  config: Record<string, any>
  isActive: boolean
  createdAt: Date
  lastUsed?: Date
}

export interface FocusSession {
  id: string
  userId?: string
  duration: number // in minutes
  actualDuration?: number // in minutes
  tasks: string[]
  distractions: string[]
  productivity: number // 0-100
  startTime: Date
  endTime?: Date
  status: 'active' | 'completed' | 'cancelled'
}

// Privacy Service
export class PrivacyService {
  private zai: ZAI | null = null

  constructor() {
    this.initializeZAI()
  }

  private async initializeZAI(): Promise<void> {
    try {
      this.zai = await ZAI.create()
    } catch (error) {
      console.error('Failed to initialize ZAI:', error)
    }
  }

  // Scan a website for privacy risks
  async scanWebsitePrivacy(url: string): Promise<PrivacyScan> {
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      if (!this.zai) {
        throw new Error('AI service not available')
      }

      const prompt = `
        Analyze the following website URL for privacy and security risks. Provide a comprehensive assessment including:
        
        1. Data collection practices
        2. Cookie and tracking technologies
        3. Third-party scripts and trackers
        4. Privacy policy transparency
        5. Data security measures
        6. User control options
        
        URL: ${url}
        
        Please provide a JSON response with:
        - risks: array of risk objects with type, severity, description, evidence, recommendation, and category
        - overallScore: overall privacy score (0-100)
        - recommendations: array of specific recommendations for improving privacy
        
        Risk types should be one of: tracker, cookie, fingerprinting, data_collection, encryption, policy
        Severity levels: low, medium, high, critical
        Categories: tracking, data_security, transparency, user_control
      `

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a privacy and security expert that analyzes websites for privacy risks and provides detailed assessments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from AI')
      }

      const analysis = JSON.parse(response)
      
      const privacyScan: PrivacyScan = {
        id: scanId,
        url,
        scanDate: new Date(),
        risks: analysis.risks || [],
        overallScore: analysis.overallScore || 50,
        recommendations: analysis.recommendations || [],
        status: 'completed'
      }

      // Store scan result in database
      await db.privacyScan.create({
        data: {
          id: privacyScan.id,
          url: privacyScan.url,
          scanDate: privacyScan.scanDate,
          risks: JSON.stringify(privacyScan.risks),
          overallScore: privacyScan.overallScore,
          recommendations: JSON.stringify(privacyScan.recommendations),
          status: privacyScan.status
        }
      })

      return privacyScan
    } catch (error) {
      console.error('Privacy scan failed:', error)
      
      // Store failed scan
      await db.privacyScan.create({
        data: {
          id: scanId,
          url,
          scanDate: new Date(),
          risks: JSON.stringify([]),
          overallScore: 0,
          recommendations: JSON.stringify([]),
          status: 'failed'
        }
      })

      throw error
    }
  }

  // Anonymize text by removing PII
  async anonymizeText(text: string): Promise<{ anonymizedText: string; detectedPII: string[] }> {
    try {
      if (!this.zai) {
        throw new Error('AI service not available')
      }

      const prompt = `
        Anonymize the following text by removing or replacing personally identifiable information (PII). 
        Identify and replace:
        1. Names and usernames
        2. Email addresses
        3. Phone numbers
        4. Physical addresses
        5. Financial information (credit cards, bank accounts)
        6. Social Security numbers or national IDs
        7. Dates of birth
        8. Other sensitive personal data
        
        Replace with generic placeholders like [NAME], [EMAIL], [PHONE], [ADDRESS], etc.
        
        Text: "${text}"
        
        Please provide a JSON response with:
        - anonymizedText: the anonymized version of the text
        - detectedPII: array of detected PII items that were replaced
      `

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a data privacy expert that identifies and anonymizes personally identifiable information in text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from AI')
      }

      const result = JSON.parse(response)
      return {
        anonymizedText: result.anonymizedText || text,
        detectedPII: result.detectedPII || []
      }
    } catch (error) {
      console.error('Text anonymization failed:', error)
      throw error
    }
  }

  // Generate privacy report
  async generatePrivacyReport(urls: string[]): Promise<{
    summary: string
    overallScore: number
    topRisks: PrivacyRisk[]
    recommendations: string[]
  }> {
    try {
      const scans = await Promise.all(
        urls.map(url => this.scanWebsitePrivacy(url))
      )

      const allRisks = scans.flatMap(scan => scan.risks)
      const averageScore = scans.reduce((sum, scan) => sum + scan.overallScore, 0) / scans.length

      // Group risks by type and severity
      const riskCounts = allRisks.reduce((acc, risk) => {
        const key = `${risk.type}-${risk.severity}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Get top risks
      const topRisks = allRisks
        .sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          return severityOrder[b.severity] - severityOrder[a.severity]
        })
        .slice(0, 10)

      // Generate summary
      const summary = `Privacy analysis completed for ${urls.length} websites. 
        Average privacy score: ${averageScore.toFixed(1)}/100. 
        Found ${allRisks.length} total risks across all sites.`

      // Aggregate recommendations
      const allRecommendations = scans.flatMap(scan => scan.recommendations)
      const uniqueRecommendations = [...new Set(allRecommendations)]

      return {
        summary,
        overallScore: Math.round(averageScore),
        topRisks,
        recommendations: uniqueRecommendations
      }
    } catch (error) {
      console.error('Privacy report generation failed:', error)
      throw error
    }
  }

  // Productivity tools methods
  async createFocusSession(duration: number, tasks: string[]): Promise<FocusSession> {
    const session: FocusSession = {
      id: `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      duration,
      tasks,
      distractions: [],
      productivity: 0,
      startTime: new Date(),
      status: 'active'
    }

    try {
      await db.focusSession.create({
        data: {
          id: session.id,
          duration: session.duration,
          actualDuration: session.actualDuration,
          tasks: JSON.stringify(session.tasks),
          distractions: JSON.stringify(session.distractions),
          productivity: session.productivity,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status
        }
      })

      return session
    } catch (error) {
      console.error('Failed to create focus session:', error)
      throw error
    }
  }

  async completeFocusSession(sessionId: string, actualDuration?: number, distractions: string[] = []): Promise<FocusSession> {
    try {
      const session = await db.focusSession.update({
        where: { id: sessionId },
        data: {
          actualDuration,
          distractions: JSON.stringify(distractions),
          endTime: new Date(),
          status: 'completed'
        }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      // Calculate productivity score
      const plannedDuration = session.duration
      const completedDuration = actualDuration || plannedDuration
      const distractionCount = distractions.length
      
      // Simple productivity calculation
      let productivity = 100
      if (completedDuration < plannedDuration) {
        productivity -= (plannedDuration - completedDuration) / plannedDuration * 50
      }
      productivity -= Math.min(distractionCount * 10, 30)
      productivity = Math.max(0, Math.round(productivity))

      await db.focusSession.update({
        where: { id: sessionId },
        data: { productivity }
      })

      return {
        id: session.id,
        duration: session.duration,
        actualDuration: session.actualDuration || undefined,
        tasks: JSON.parse(session.tasks),
        distractions: JSON.parse(session.distractions),
        productivity,
        startTime: session.startTime,
        endTime: session.endTime || undefined,
        status: session.status as FocusSession['status']
      }
    } catch (error) {
      console.error('Failed to complete focus session:', error)
      throw error
    }
  }

  async getProductivityStats(userId?: string): Promise<{
    totalSessions: number
    totalFocusTime: number
    averageProductivity: number
    mostProductiveHour: number
    weeklyTrend: number
  }> {
    try {
      const sessions = await db.focusSession.findMany({
        where: {
          status: 'completed',
          ...(userId && { userId }) // Add userId field to schema if needed
        },
        orderBy: { startTime: 'desc' }
      })

      const totalSessions = sessions.length
      const totalFocusTime = sessions.reduce((sum, session) => 
        sum + (session.actualDuration || session.duration), 0
      )
      
      const averageProductivity = sessions.length > 0
        ? sessions.reduce((sum, session) => sum + session.productivity, 0) / sessions.length
        : 0

      // Find most productive hour
      const hourCounts: Record<number, { total: number; count: number }> = {}
      sessions.forEach(session => {
        const hour = new Date(session.startTime).getHours()
        if (!hourCounts[hour]) {
          hourCounts[hour] = { total: 0, count: 0 }
        }
        hourCounts[hour].total += session.productivity
        hourCounts[hour].count += 1
      })

      let mostProductiveHour = 9 // Default to 9 AM
      let maxAvgProductivity = 0
      Object.entries(hourCounts).forEach(([hour, data]) => {
        const avgProductivity = data.total / data.count
        if (avgProductivity > maxAvgProductivity) {
          maxAvgProductivity = avgProductivity
          mostProductiveHour = parseInt(hour)
        }
      })

      // Calculate weekly trend (last 7 days vs previous 7 days)
      const now = new Date()
      const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      const lastWeekSessions = sessions.filter(session => 
        new Date(session.startTime) >= lastWeekStart
      )
      const prevWeekSessions = sessions.filter(session => 
        new Date(session.startTime) >= prevWeekStart && 
        new Date(session.startTime) < lastWeekStart
      )

      const lastWeekTime = lastWeekSessions.reduce((sum, session) => 
        sum + (session.actualDuration || session.duration), 0
      )
      const prevWeekTime = prevWeekSessions.reduce((sum, session) => 
        sum + (session.actualDuration || session.duration), 0
      )

      const weeklyTrend = prevWeekTime > 0 
        ? ((lastWeekTime - prevWeekTime) / prevWeekTime) * 100 
        : 0

      return {
        totalSessions,
        totalFocusTime,
        averageProductivity: Math.round(averageProductivity),
        mostProductiveHour,
        weeklyTrend: Math.round(weeklyTrend)
      }
    } catch (error) {
      console.error('Failed to get productivity stats:', error)
      throw error
    }
  }
}

// Export singleton instance
export const privacyService = new PrivacyService()