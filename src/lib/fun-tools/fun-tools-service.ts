export interface FunTool {
  id: string
  name: string
  description: string
  category: 'visual' | 'interactive' | 'productivity' | 'social' | 'wellness'
  icon: string
  color: string
  trigger: 'manual' | 'automatic' | 'scheduled'
  happinessBoost: number // 1-10 scale
  engagementLevel: 'low' | 'medium' | 'high'
  isPremium: boolean
  execute: (context: FunToolContext) => Promise<FunToolResult>
}

export interface FunToolContext {
  currentUrl: string
  pageTitle: string
  timeSpent: number
  userMood: 'happy' | 'neutral' | 'stressed' | 'focused' | 'bored'
  deviceType: 'desktop' | 'mobile' | 'tablet'
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  weather?: string
  userPreferences: UserFunPreferences
}

export interface FunToolResult {
  success: boolean
  data?: any
  message: string
  happinessImpact: number
  shareable?: boolean
  animation?: string
  sound?: string
}

export interface UserFunPreferences {
  favoriteTools: string[]
  humorLevel: 'subtle' | 'moderate' | 'wild'
  animationPreference: 'minimal' | 'balanced' | 'extravagant'
  soundEnabled: boolean
  privacyMode: 'private' | 'social' | 'public'
  dailyFunGoal: number
}

export class FunToolsService {
  private tools: Map<string, FunTool> = new Map()
  private userPreferences: UserFunPreferences
  private usageStats: Map<string, number> = new Map()
  private happinessHistory: { timestamp: Date; level: number }[] = []

  constructor() {
    this.userPreferences = this.getDefaultPreferences()
    this.registerFunTools()
  }

  private getDefaultPreferences(): UserFunPreferences {
    return {
      favoriteTools: [],
      humorLevel: 'moderate',
      animationPreference: 'balanced',
      soundEnabled: true,
      privacyMode: 'private',
      dailyFunGoal: 5
    }
  }

  private registerFunTools() {
    // Visual Fun Tools
    this.registerTool({
      id: 'confetti-celebration',
      name: 'Confetti Celebration',
      description: 'Celebrate your browsing achievements with animated confetti!',
      category: 'visual',
      icon: '🎉',
      color: '#FF6B6B',
      trigger: 'automatic',
      happinessBoost: 8,
      engagementLevel: 'high',
      isPremium: false,
      execute: this.executeConfettiCelebration.bind(this)
    })

    this.registerTool({
      id: 'rainbow-tabs',
      name: 'Rainbow Tabs',
      description: 'Transform your tabs into a beautiful rainbow gradient!',
      category: 'visual',
      icon: '🌈',
      color: '#4ECDC4',
      trigger: 'manual',
      happinessBoost: 6,
      engagementLevel: 'medium',
      isPremium: false,
      execute: this.executeRainbowTabs.bind(this)
    })

    this.registerTool({
      id: 'dancing-cursor',
      name: 'Dancing Cursor',
      description: 'Your cursor dances and leaves colorful trails!',
      category: 'visual',
      icon: '💃',
      color: '#45B7D1',
      trigger: 'manual',
      happinessBoost: 7,
      engagementLevel: 'high',
      isPremium: false,
      execute: this.executeDancingCursor.bind(this)
    })

    // Interactive Fun Tools
    this.registerTool({
      id: 'companion-pet',
      name: 'Browser Pet',
      description: 'A cute virtual pet that keeps you company while browsing!',
      category: 'interactive',
      icon: '🐱',
      color: '#96CEB4',
      trigger: 'automatic',
      happinessBoost: 9,
      engagementLevel: 'high',
      isPremium: false,
      execute: this.executeCompanionPet.bind(this)
    })

    this.registerTool({
      id: 'page-transformation',
      name: 'Page Magic',
      description: 'Transform any webpage into a magical experience!',
      category: 'interactive',
      icon: '✨',
      color: '#DDA0DD',
      trigger: 'manual',
      happinessBoost: 8,
      engagementLevel: 'high',
      isPremium: true,
      execute: this.executePageTransformation.bind(this)
    })

    this.registerTool({
      id: 'sound-scape',
      name: 'Browsing Soundscapes',
      description: 'Ambient sounds that match your browsing mood!',
      category: 'interactive',
      icon: '🎵',
      color: '#FFB6C1',
      trigger: 'automatic',
      happinessBoost: 6,
      engagementLevel: 'medium',
      isPremium: false,
      execute: this.executeSoundScape.bind(this)
    })

    // Productivity Fun Tools
    this.registerTool({
      id: 'achievement-unlocked',
      name: 'Achievement Hunter',
      description: 'Unlock fun achievements for your browsing milestones!',
      category: 'productivity',
      icon: '🏆',
      color: '#FFD700',
      trigger: 'automatic',
      happinessBoost: 7,
      engagementLevel: 'high',
      isPremium: false,
      execute: this.executeAchievementUnlocked.bind(this)
    })

    this.registerTool({
      id: 'focus-party',
      name: 'Focus Party',
      description: 'Turn focused work sessions into celebrations!',
      category: 'productivity',
      icon: '🎯',
      color: '#FF69B4',
      trigger: 'manual',
      happinessBoost: 8,
      engagementLevel: 'medium',
      isPremium: false,
      execute: this.executeFocusParty.bind(this)
    })

    // Social Fun Tools
    this.registerTool({
      id: 'browsing-together',
      name: 'Browse Together',
      description: 'Share fun browsing moments with friends in real-time!',
      category: 'social',
      icon: '👥',
      color: '#87CEEB',
      trigger: 'manual',
      happinessBoost: 9,
      engagementLevel: 'high',
      isPremium: false,
      execute: this.executeBrowsingTogether.bind(this)
    })

    this.registerTool({
      id: 'mood-sharing',
      name: 'Mood Sharing',
      description: 'Share your current browsing mood with friends!',
      category: 'social',
      icon: '😊',
      color: '#98FB98',
      trigger: 'manual',
      happinessBoost: 6,
      engagementLevel: 'medium',
      isPremium: false,
      execute: this.executeMoodSharing.bind(this)
    })

    // Wellness Fun Tools
    this.registerTool({
      id: 'breathing-break',
      name: 'Breathing Break',
      description: 'Guided breathing exercises during your browsing sessions!',
      category: 'wellness',
      icon: '🧘',
      color: '#E6E6FA',
      trigger: 'scheduled',
      happinessBoost: 7,
      engagementLevel: 'low',
      isPremium: false,
      execute: this.executeBreathingBreak.bind(this)
    })

    this.registerTool({
      id: 'positive-affirmations',
      name: 'Positive Affirmations',
      description: 'Receive encouraging messages while you browse!',
      category: 'wellness',
      icon: '💭',
      color: '#F0E68C',
      trigger: 'automatic',
      happinessBoost: 8,
      engagementLevel: 'low',
      isPremium: false,
      execute: this.executePositiveAffirmations.bind(this)
    })

    this.registerTool({
      id: 'gratitude-jar',
      name: 'Gratitude Jar',
      description: 'Collect moments of digital gratitude!',
      category: 'wellness',
      icon: '🙏',
      color: '#DEB887',
      trigger: 'manual',
      happinessBoost: 9,
      engagementLevel: 'medium',
      isPremium: false,
      execute: this.executeGratitudeJar.bind(this)
    })
  }

  registerTool(tool: FunTool) {
    this.tools.set(tool.id, tool)
  }

  getAvailableTools(context: FunToolContext): FunTool[] {
    return Array.from(this.tools.values())
      .filter(tool => {
        // Filter based on user preferences and context
        if (tool.isPremium && !this.userPreferences.favoriteTools.includes(tool.id)) {
          return false
        }

        // Context-based filtering
        if (context.userMood === 'stressed' && tool.category === 'visual') {
          return true // Visual tools help with stress
        }

        if (context.userMood === 'bored' && tool.engagementLevel === 'high') {
          return true // High engagement tools for boredom
        }

        if (context.timeOfDay === 'night' && tool.category === 'wellness') {
          return true // Wellness tools at night
        }

        return true
      })
      .sort((a, b) => b.happinessBoost - a.happinessBoost)
  }

  async executeTool(toolId: string, context: FunToolContext): Promise<FunToolResult> {
    const tool = this.tools.get(toolId)
    if (!tool) {
      return {
        success: false,
        message: 'Tool not found',
        happinessImpact: 0
      }
    }

    try {
      const result = await tool.execute(context)
      
      // Track usage
      this.usageStats.set(toolId, (this.usageStats.get(toolId) || 0) + 1)
      
      // Record happiness impact
      this.happinessHistory.push({
        timestamp: new Date(),
        level: result.happinessImpact
      })

      return result
    } catch (error) {
      return {
        success: false,
        message: `Failed to execute tool: ${error.message}`,
        happinessImpact: 0
      }
    }
  }

  getRecommendedTools(context: FunToolContext): FunTool[] {
    const availableTools = this.getAvailableTools(context)
    
    // Smart recommendations based on context
    const recommendations = availableTools.filter(tool => {
      // Recommend based on time spent
      if (context.timeSpent > 300000 && tool.category === 'wellness') { // 5+ minutes
        return true
      }

      // Recommend based on mood
      if (context.userMood === 'stressed' && tool.category === 'wellness') {
        return true
      }

      if (context.userMood === 'bored' && tool.engagementLevel === 'high') {
        return true
      }

      // Recommend based on time of day
      if (context.timeOfDay === 'morning' && tool.category === 'productivity') {
        return true
      }

      if (context.timeOfDay === 'evening' && tool.category === 'visual') {
        return true
      }

      return false
    })

    return recommendations.slice(0, 3) // Top 3 recommendations
  }

  getHappinessScore(): number {
    if (this.happinessHistory.length === 0) return 5
    
    const recent = this.happinessHistory.slice(-10) // Last 10 interactions
    const average = recent.reduce((sum, item) => sum + item.level, 0) / recent.length
    return Math.round(average * 10) / 10
  }

  getMostUsedTools(): Array<{ tool: FunTool; usage: number }> {
    return Array.from(this.usageStats.entries())
      .map(([toolId, usage]) => ({
        tool: this.tools.get(toolId)!,
        usage
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)
  }

  updateUserPreferences(preferences: Partial<UserFunPreferences>) {
    this.userPreferences = { ...this.userPreferences, ...preferences }
  }

  // Tool Implementations
  private async executeConfettiCelebration(context: FunToolContext): Promise<FunToolResult> {
    return {
      success: true,
      message: '🎉 Confetti explosion! You\'re doing amazing!',
      happinessImpact: 8,
      animation: 'confetti-burst',
      sound: 'celebration'
    }
  }

  private async executeRainbowTabs(context: FunToolContext): Promise<FunToolResult> {
    return {
      success: true,
      message: '🌈 Your tabs are now rainbow-colored! Enjoy the colors!',
      happinessImpact: 6,
      animation: 'rainbow-gradient',
      shareable: true
    }
  }

  private async executeDancingCursor(context: FunToolContext): Promise<FunToolResult> {
    return {
      success: true,
      message: '💃 Your cursor is now dancing! Move it around to see the magic!',
      happinessImpact: 7,
      animation: 'dancing-cursor',
      sound: 'upbeat'
    }
  }

  private async executeCompanionPet(context: FunToolContext): Promise<FunToolResult> {
    const pets = ['🐱', '🐶', '🐰', '🐹', '🐸', '🐙']
    const randomPet = pets[Math.floor(Math.random() * pets.length)]
    
    return {
      success: true,
      data: { pet: randomPet, mood: 'happy' },
      message: `${randomPet} appeared to keep you company! They love browsing with you!`,
      happinessImpact: 9,
      animation: 'pet-entrance',
      sound: 'cute'
    }
  }

  private async executePageTransformation(context: FunToolContext): Promise<FunToolResult> {
    const transformations = [
      'magical-sparkles',
      'underwater-theme',
      'space-galaxy',
      'enchanted-forest',
      'candy-land'
    ]
    const transformation = transformations[Math.floor(Math.random() * transformations.length)]
    
    return {
      success: true,
      data: { transformation },
      message: `✨ Page transformed into ${transformation.replace('-', ' ')}! Magic is real!`,
      happinessImpact: 8,
      animation: transformation,
      sound: 'magical',
      shareable: true
    }
  }

  private async executeSoundScape(context: FunToolContext): Promise<FunToolResult> {
    const soundscapes = [
      'gentle-rain',
      'forest-ambient',
      'ocean-waves',
      'coffee-shop',
      'crackling-fire'
    ]
    const soundscape = soundscapes[Math.floor(Math.random() * soundscapes.length)]
    
    return {
      success: true,
      data: { soundscape },
      message: `🎵 Playing ${soundscape.replace('-', ' ')} sounds to enhance your browsing!`,
      happinessImpact: 6,
      sound: soundscape
    }
  }

  private async executeAchievementUnlocked(context: FunToolContext): Promise<FunToolResult> {
    const achievements = [
      '🌟 Early Bird - Browsing before 8 AM!',
      '🚀 Speed Reader - Visited 10 pages in 5 minutes!',
      '🎯 Focus Master - 30 minutes of uninterrupted browsing!',
      '🌍 Explorer - Visited 5 different domains!',
      '📚 Knowledge Seeker - Read 3 long articles!'
    ]
    const achievement = achievements[Math.floor(Math.random() * achievements.length)]
    
    return {
      success: true,
      data: { achievement },
      message: `🏆 Achievement Unlocked: ${achievement.split(' - ')[1]}`,
      happinessImpact: 7,
      animation: 'achievement-unlock',
      sound: 'achievement',
      shareable: true
    }
  }

  private async executeFocusParty(context: FunToolContext): Promise<FunToolResult> {
    return {
      success: true,
      message: '🎯 Focus Party activated! Let\'s make productivity fun!',
      happinessImpact: 8,
      animation: 'focus-party',
      sound: 'motivational'
    }
  }

  private async executeBrowsingTogether(context: FunToolContext): Promise<FunToolResult> {
    return {
      success: true,
      message: '👥 Browsing Together mode activated! Share the fun with friends!',
      happinessImpact: 9,
      animation: 'social-connect',
      sound: 'social',
      shareable: true
    }
  }

  private async executeMoodSharing(context: FunToolContext): Promise<FunToolResult> {
    const moodEmojis = {
      happy: '😊',
      neutral: '😐',
      stressed: '😰',
      focused: '🎯',
      bored: '😴'
    }
    
    return {
      success: true,
      data: { mood: context.userMood, emoji: moodEmojis[context.userMood] },
      message: `${moodEmojis[context.userMood]} Your mood has been shared! Friends can see how you're feeling!`,
      happinessImpact: 6,
      animation: 'mood-share',
      shareable: true
    }
  }

  private async executeBreathingBreak(context: FunToolContext): Promise<FunToolResult> {
    return {
      success: true,
      message: '🧘 Breathing break time! Take 3 deep breaths and relax...',
      happinessImpact: 7,
      animation: 'breathing-guide',
      sound: 'calm'
    }
  }

  private async executePositiveAffirmations(context: FunToolContext): Promise<FunToolResult> {
    const affirmations = [
      'You are doing amazing work!',
      'Your curiosity is wonderful!',
      'Every click you make is progress!',
      'You are a digital explorer!',
      'Your browsing journey is unique and valuable!'
    ]
    const affirmation = affirmations[Math.floor(Math.random() * affirmations.length)]
    
    return {
      success: true,
      data: { affirmation },
      message: `💭 ${affirmation}`,
      happinessImpact: 8,
      animation: 'affirmation-fade',
      sound: 'gentle'
    }
  }

  private async executeGratitudeJar(context: FunToolContext): Promise<FunToolResult> {
    return {
      success: true,
      message: '🙏 Gratitude moment! What are you thankful for today?',
      happinessImpact: 9,
      animation: 'gratitude-jar',
      sound: 'heartwarming',
      shareable: true
    }
  }
}