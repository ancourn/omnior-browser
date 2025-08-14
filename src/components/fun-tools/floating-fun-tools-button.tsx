'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  Smile, 
  Heart, 
  Star, 
  PartyPopper, 
  Music,
  Users,
  Award,
  Brain,
  Palette,
  X
} from 'lucide-react'
import { FunToolsService, FunTool, FunToolContext, UserFunPreferences } from '@/lib/fun-tools/fun-tools-service'

interface FloatingFunToolsButtonProps {
  initialMood?: 'happy' | 'neutral' | 'stressed' | 'focused' | 'bored'
}

export function FloatingFunToolsButton({ initialMood = 'neutral' }: FloatingFunToolsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [funToolsService] = useState(() => new FunToolsService())
  const [recommendedTools, setRecommendedTools] = useState<FunTool[]>([])
  const [happinessScore, setHappinessScore] = useState(5)
  const [currentMood, setCurrentMood] = useState(initialMood)
  const [dailyFunProgress, setDailyFunProgress] = useState(0)
  const [recentActivities, setRecentActivities] = useState<string[]>([])

  // Simulate user context
  const getUserContext = (): FunToolContext => {
    const now = new Date()
    const hour = now.getHours()
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    
    if (hour < 12) timeOfDay = 'morning'
    else if (hour < 17) timeOfDay = 'afternoon'
    else if (hour < 21) timeOfDay = 'evening'
    else timeOfDay = 'night'

    return {
      currentUrl: typeof window !== 'undefined' ? window.location.href : '',
      pageTitle: typeof document !== 'undefined' ? document.title : '',
      timeSpent: Math.floor(Math.random() * 600000), // Random time spent
      userMood: currentMood,
      deviceType: 'desktop',
      timeOfDay,
      weather: 'sunny',
      userPreferences: {
        favoriteTools: [],
        humorLevel: 'moderate',
        animationPreference: 'balanced',
        soundEnabled: true,
        privacyMode: 'private',
        dailyFunGoal: 5
      }
    }
  }

  useEffect(() => {
    const context = getUserContext()
    const tools = funToolsService.getRecommendedTools(context)
    setRecommendedTools(tools)
    setHappinessScore(funToolsService.getHappinessScore())
  }, [currentMood])

  const handleToolClick = async (tool: FunTool) => {
    const context = getUserContext()
    const result = await funToolsService.executeTool(tool.id, context)
    
    // Update UI with feedback
    if (result.success) {
      setRecentActivities(prev => [result.message, ...prev.slice(0, 4)])
      setDailyFunProgress(prev => Math.min(prev + 1, 5))
      setHappinessScore(funToolsService.getHappinessScore())
      
      // Show animation feedback
      if (result.animation) {
        showAnimation(result.animation)
      }
      
      // Show sound feedback if enabled
      if (result.sound && context.userPreferences.soundEnabled) {
        playSound(result.sound)
      }
    }
  }

  const showAnimation = (animationType: string) => {
    // Create animation element
    const animation = document.createElement('div')
    animation.className = 'fixed inset-0 pointer-events-none z-50'
    animation.id = 'fun-animation'
    
    // Add different animation types
    switch (animationType) {
      case 'confetti-burst':
        animation.innerHTML = createConfettiAnimation()
        break
      case 'rainbow-gradient':
        document.body.style.background = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)'
        setTimeout(() => {
          document.body.style.background = ''
        }, 5000)
        break
      case 'achievement-unlock':
        animation.innerHTML = createAchievementAnimation()
        break
      default:
        animation.innerHTML = createSparkleAnimation()
    }
    
    document.body.appendChild(animation)
    
    // Remove animation after duration
    setTimeout(() => {
      document.getElementById('fun-animation')?.remove()
    }, 3000)
  }

  const playSound = (soundType: string) => {
    // Create audio context for sound effects
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different sounds for different types
      switch (soundType) {
        case 'celebration':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
          break
        case 'achievement':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4
          oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime + 0.15) // C#5
          break
        case 'cute':
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
          oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.1) // C6
          break
        default:
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Sound not supported')
    }
  }

  const createConfettiAnimation = () => {
    return `
      <style>
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #ff6b6b;
          animation: confetti-fall 3s linear forwards;
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      </style>
      ${Array.from({ length: 50 }, (_, i) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const left = Math.random() * 100
        return `<div class="confetti" style="left: ${left}%; background: ${color}; animation-delay: ${i * 0.1}s;"></div>`
      }).join('')}
    `
  }

  const createAchievementAnimation = () => {
    return `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
        <div style="font-size: 4rem; animation: bounce 1s ease-in-out;">🏆</div>
        <div style="font-size: 1.5rem; font-weight: bold; color: #ffd700; margin-top: 1rem; animation: fadeInUp 1s ease-out;">
          Achievement Unlocked!
        </div>
      </div>
      <style>
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0) translate(-50%, -50%); }
          40% { transform: translateY(-30px) translate(-50%, -50%); }
          60% { transform: translateY(-15px) translate(-50%, -50%); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translate(-50%, -50%) translateY(20px); }
          100% { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
        }
      </style>
    `
  }

  const createSparkleAnimation = () => {
    return `
      <style>
        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          animation: sparkle 2s linear forwards;
        }
        @keyframes sparkle {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
      </style>
      ${Array.from({ length: 30 }, (_, i) => {
        const x = Math.random() * window.innerWidth
        const y = Math.random() * window.innerHeight
        return `<div class="sparkle" style="left: ${x}px; top: ${y}px; animation-delay: ${i * 0.1}s;"></div>`
      }).join('')}
    `
  }

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊'
      case 'stressed': return '😰'
      case 'focused': return '🎯'
      case 'bored': return '😴'
      default: return '😐'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visual': return <Palette className="h-4 w-4" />
      case 'interactive': return <Sparkles className="h-4 w-4" />
      case 'productivity': return <Award className="h-4 w-4" />
      case 'social': return <Users className="h-4 w-4" />
      case 'wellness': return <Heart className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  if (!isOpen) {
    return (
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-40 rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative">
          <Sparkles className="h-6 w-6 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-h-[80vh] overflow-hidden">
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Fun Tools</CardTitle>
                <CardDescription>Make browsing delightful!</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Happiness Score */}
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Happiness Score</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {happinessScore}/10
              </span>
            </div>
            <Progress value={happinessScore * 10} className="h-2" />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Current mood:</span>
              <span className="text-lg">{getMoodIcon(currentMood)}</span>
              <select
                value={currentMood}
                onChange={(e) => setCurrentMood(e.target.value as any)}
                className="text-sm bg-transparent border rounded px-2 py-1"
              >
                <option value="happy">😊 Happy</option>
                <option value="neutral">😐 Neutral</option>
                <option value="stressed">😰 Stressed</option>
                <option value="focused">🎯 Focused</option>
                <option value="bored">😴 Bored</option>
              </select>
            </div>
          </div>

          {/* Daily Fun Goal */}
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily Fun Goal</span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {dailyFunProgress}/5 activities
              </span>
            </div>
            <Progress value={(dailyFunProgress / 5) * 100} className="h-2" />
          </div>

          {/* Recommended Tools */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Recommended for You
            </h3>
            <div className="space-y-2">
              {recommendedTools.map((tool) => (
                <Button
                  key={tool.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900 dark:hover:to-pink-900"
                  onClick={() => handleToolClick(tool)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: tool.color + '20', color: tool.color }}
                      >
                        {getCategoryIcon(tool.category)}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {tool.happinessBoost}/10 😊
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          {recentActivities.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Music className="h-4 w-4" />
                Recent Activities
              </h3>
              <div className="space-y-1">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="text-sm p-2 bg-muted/50 rounded text-muted-foreground">
                    {activity}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fun Stats */}
          <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 p-3 rounded-lg">
            <h3 className="font-medium mb-2">Today&apos;s Fun Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>🎉 Celebrations: {Math.floor(Math.random() * 10)}</div>
              <div>✨ Sparkles: {Math.floor(Math.random() * 50)}</div>
              <div>🎵 Sounds played: {Math.floor(Math.random() * 20)}</div>
              <div>🏆 Achievements: {Math.floor(Math.random() * 5)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}