import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, Code, Rocket, CheckCircle, Clock, Target, Brain } from "lucide-react"

export default function RoadmapPage() {
  const phases = [
    {
      number: 1,
      title: "Project Foundation",
      status: "planning",
      icon: <Target className="h-6 w-6" />,
      objectives: [
        "Project scaffold and repository setup",
        "Logo design and brand assets creation",
        "UI wireframes and mockups",
        "Documentation structure",
        "Initial team formation"
      ],
      timeline: "2-4 weeks",
      deliverables: [
        "GitHub repository with proper structure",
        "Complete brand identity package",
        "UI/UX design system",
        "Project documentation",
        "Initial team onboarding"
      ]
    },
    {
      number: 2,
      title: "Core Engine",
      status: "planning",
      icon: <Code className="h-6 w-6" />,
      objectives: [
        "Rust-based rendering engine development",
        "Basic HTML/CSS/JS parsing support",
        "GPU acceleration implementation",
        "Memory optimization",
        "Basic shell integration"
      ],
      timeline: "3-6 months",
      deliverables: [
        "Functional rendering engine alpha",
        "Basic web page rendering",
        "Performance benchmarks",
        "Engine documentation",
        "Shell integration prototype"
      ]
    },
    {
      number: 3,
      title: "Extension Layer",
      status: "planning",
      icon: <Users className="h-6 w-6" />,
      objectives: [
        "Chrome extension compatibility layer",
        "Extension sandbox implementation",
        "Omnior Add-on SDK development",
        "Extension store prototype",
        "Security model for extensions"
      ],
      timeline: "2-4 months",
      deliverables: [
        "Chrome extension compatibility",
        "Extension SDK documentation",
        "Security audit report",
        "Extension manager UI",
        "Sample extensions"
      ]
    },
    {
      number: 4,
      title: "AI & Privacy Features",
      status: "planning",
      icon: <Brain className="h-6 w-6" />,
      objectives: [
        "AI smart assistant integration",
        "Privacy tools implementation",
        "Advanced tab management system",
        "Productivity suite development",
        "User personalization engine"
      ],
      timeline: "4-6 months",
      deliverables: [
        "AI assistant beta",
        "Privacy protection suite",
        "Advanced tab system",
        "Productivity tools",
        "User preference system"
      ]
    },
    {
      number: 5,
      title: "Sync & Cloud",
      status: "planning",
      icon: <Calendar className="h-6 w-6" />,
      objectives: [
        "Cross-device sync implementation",
        "Encrypted cloud storage",
        "User account system",
        "Data backup and recovery",
        "Offline mode enhancement"
      ],
      timeline: "3-5 months",
      deliverables: [
        "Sync service backend",
        "User authentication system",
        "Cloud storage integration",
        "Mobile sync capabilities",
        "Backup/restore functionality"
      ]
    },
    {
      number: 6,
      title: "Beta Release",
      status: "planning",
      icon: <Rocket className="h-6 w-6" />,
      objectives: [
        "Public beta preparation",
        "Bug fixing and optimization",
        "User feedback system",
        "Performance tuning",
        "Security audit completion"
      ],
      timeline: "2-3 months",
      deliverables: [
        "Beta version for all platforms",
        "Feedback collection system",
        "Performance optimization report",
        "Security audit certificate",
        "Beta user documentation"
      ]
    },
    {
      number: 7,
      title: "Launch & Growth",
      status: "planning",
      icon: <CheckCircle className="h-6 w-6" />,
      objectives: [
        "Official public release",
        "Developer relations program",
        "Community building",
        "Marketing and promotion",
        "Continuous improvement"
      ],
      timeline: "Ongoing",
      deliverables: [
        "Version 1.0 release",
        "Developer portal",
        "Community forums",
        "Marketing materials",
        "Growth analytics dashboard"
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in-progress':
        return <Clock className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Development Roadmap
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">7-Phase Development Plan</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our strategic approach to building the world's most advanced web browser, 
              from initial concept to global launch.
            </p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Project Timeline Overview</h2>
              <p className="text-lg text-muted-foreground">
                A comprehensive 18-24 month journey from concept to launch
              </p>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Key Milestones</CardTitle>
                <CardDescription>
                  Major checkpoints and achievements throughout the development process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-2">Phase 1</div>
                    <p className="text-sm text-muted-foreground">Foundation</p>
                    <p className="text-xs text-muted-foreground mt-1">2-4 weeks</p>
                  </div>
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-2">Phase 2-3</div>
                    <p className="text-sm text-muted-foreground">Core Development</p>
                    <p className="text-xs text-muted-foreground mt-1">5-10 months</p>
                  </div>
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-2">Phase 4-5</div>
                    <p className="text-sm text-muted-foreground">Feature Complete</p>
                    <p className="text-xs text-muted-foreground mt-1">7-11 months</p>
                  </div>
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-2">Phase 6-7</div>
                    <p className="text-sm text-muted-foreground">Launch & Growth</p>
                    <p className="text-xs text-muted-foreground mt-1">5+ months</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Phases */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Detailed Phase Breakdown</h2>
              <p className="text-lg text-muted-foreground">
                In-depth look at each development phase, objectives, and deliverables
              </p>
            </div>

            <div className="space-y-8">
              {phases.map((phase, index) => (
                <div key={phase.number} className="relative">
                  {/* Phase Connector */}
                  {index < phases.length - 1 && (
                    <div className="absolute left-8 top-16 w-0.5 h-16 bg-border/50"></div>
                  )}
                  
                  <Card className="border-border/50 relative">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-16 h-16 rounded-full ${getStatusColor(phase.status)} text-white flex items-center justify-center`}>
                          {phase.icon}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Phase {phase.number}</Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {getStatusIcon(phase.status)}
                              {phase.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <CardTitle className="text-2xl">{phase.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {phase.timeline}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Objectives</h4>
                          <ul className="space-y-2">
                            {phase.objectives.map((objective, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-primary mt-1">•</span>
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Deliverables</h4>
                          <ul className="space-y-2">
                            {phase.deliverables.map((deliverable, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-green-600 mt-1">✓</span>
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Structure */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Team Organization</h2>
              <p className="text-lg text-muted-foreground">
                How we'll structure the development teams across phases
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Core Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Engine Development</h4>
                      <p className="text-sm text-muted-foreground">
                        Rust developers, graphics programmers, performance engineers
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Shell Development</h4>
                      <p className="text-sm text-muted-foreground">
                        Flutter/React Native developers, UI/UX designers
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">AI Development</h4>
                      <p className="text-sm text-muted-foreground">
                        ML engineers, data scientists, Python/Node.js developers
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Supporting Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Extensions Team</h4>
                      <p className="text-sm text-muted-foreground">
                        API developers, security specialists, SDK developers
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Testing Team</h4>
                      <p className="text-sm text-muted-foreground">
                        QA engineers, security testers, performance testers
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">DevOps Team</h4>
                      <p className="text-sm text-muted-foreground">
                        CI/CD specialists, infrastructure engineers, release managers
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Success Metrics</h2>
              <p className="text-lg text-muted-foreground">
                How we'll measure progress and success throughout the development journey
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Technical Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Page load performance</li>
                    <li>• Memory usage efficiency</li>
                    <li>• Security audit results</li>
                    <li>• Compatibility scores</li>
                    <li>• Extension support coverage</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>User Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• User satisfaction scores</li>
                    <li>• Feature adoption rates</li>
                    <li>• User retention metrics</li>
                    <li>• Performance feedback</li>
                    <li>• Accessibility compliance</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Community Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Developer contributions</li>
                    <li>• Extension ecosystem growth</li>
                    <li>• Community engagement</li>
                    <li>• Beta tester feedback</li>
                    <li>• Market adoption rates</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Get Involved */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Join Our Development Journey</h2>
            <p className="text-lg text-muted-foreground">
              We're looking for passionate contributors to help build the future of web browsing.
              Whether you're a developer, designer, tester, or enthusiast, there's a place for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Code className="mr-2 h-5 w-5" />
                Contribute Code
              </Button>
              <Button variant="outline" size="lg">
                <Users className="mr-2 h-5 w-5" />
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}