import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Github, 
  Users, 
  Code, 
  MessageCircle, 
  BookOpen, 
  Zap, 
  Shield, 
  Brain,
  Palette,
  Target,
  CheckCircle,
  Star,
  Award,
  GitBranch,
  GitPullRequest,
  Calendar,
  MapPin,
  Mail,
  Twitter,
  Linkedin,
  MessageSquare
} from "lucide-react"

export default function ContributePage() {
  const contributionWays = [
    {
      title: "Code Contributions",
      icon: <Code className="h-8 w-8" />,
      description: "Help build the core browser engine, UI, and features",
      skills: ["Rust", "JavaScript/TypeScript", "Flutter", "React Native", "Python", "Go"],
      difficulty: "Advanced",
      timeCommitment: "10+ hours/week"
    },
    {
      title: "Design & UX",
      icon: <Palette className="h-8 w-8" />,
      description: "Create beautiful interfaces and user experiences",
      skills: ["UI/UX Design", "Figma", "Adobe Creative Suite", "Prototyping", "Design Systems"],
      difficulty: "Intermediate",
      timeCommitment: "8-15 hours/week"
    },
    {
      title: "Documentation",
      icon: <BookOpen className="h-8 w-8" />,
      description: "Write and maintain project documentation",
      skills: ["Technical Writing", "Markdown", "Documentation Tools", "English"],
      difficulty: "Beginner",
      timeCommitment: "5-10 hours/week"
    },
    {
      title: "Testing & QA",
      icon: <Shield className="h-8 w-8" />,
      description: "Ensure quality and security through testing",
      skills: ["Testing", "QA", "Security Testing", "Automation", "Bug Reporting"],
      difficulty: "Intermediate",
      timeCommitment: "8-12 hours/week"
    },
    {
      title: "Community Management",
      icon: <Users className="h-8 w-8" />,
      description: "Build and engage with the Omnior community",
      skills: ["Community Management", "Social Media", "Communication", "Event Planning"],
      difficulty: "Beginner",
      timeCommitment: "5-8 hours/week"
    },
    {
      title: "AI & Machine Learning",
      icon: <Brain className="h-8 w-8" />,
      description: "Work on AI-powered features and smart assistant",
      skills: ["Machine Learning", "Python", "NLP", "Data Science", "AI Ethics"],
      difficulty: "Advanced",
      timeCommitment: "12-20 hours/week"
    }
  ]

  const teamRoles = [
    {
      title: "Core Engine Developer",
      department: "Engineering",
      description: "Build the Rust-based rendering engine and core browser functionality",
      requirements: ["5+ years Rust experience", "Systems programming", "Graphics programming", "Performance optimization"],
      type: "Full-time",
      location: "Remote"
    },
    {
      title: "Frontend Developer",
      department: "Engineering",
      description: "Develop the UI shell using Flutter/React Native for cross-platform support",
      requirements: ["3+ years Flutter/React Native", "Mobile development", "State management", "UI/UX implementation"],
      type: "Full-time",
      location: "Remote"
    },
    {
      title: "AI/ML Engineer",
      department: "Engineering",
      description: "Build AI-powered features and smart browsing assistant",
      requirements: ["3+ years ML experience", "Python/Node.js", "NLP", "Model deployment", "AI ethics"],
      type: "Full-time",
      location: "Remote"
    },
    {
      title: "Security Engineer",
      department: "Engineering",
      description: "Ensure browser security and implement privacy features",
      requirements: ["4+ years security experience", "Browser security", "Cryptography", "Security auditing"],
      type: "Full-time",
      location: "Remote"
    },
    {
      title: "UX Designer",
      department: "Design",
      description: "Design intuitive user interfaces and experiences",
      requirements: ["3+ years UX design", "Figma/Sketch", "User research", "Prototyping", "Design systems"],
      type: "Full-time",
      location: "Remote"
    },
    {
      title: "Community Manager",
      department: "Community",
      description: "Build and manage the Omnior developer community",
      requirements: ["2+ years community management", "Social media", "Developer relations", "Event planning"],
      type: "Part-time",
      location: "Remote"
    }
  ]

  const contributionProcess = [
    {
      step: 1,
      title: "Join the Community",
      description: "Join our Discord server and GitHub organization to get started",
      icon: <Users className="h-6 w-6" />
    },
    {
      step: 2,
      title: "Choose Your Path",
      description: "Pick an area that matches your skills and interests",
      icon: <Target className="h-6 w-6" />
    },
    {
      step: 3,
      title: "Start Small",
      description: "Begin with good first issues or documentation improvements",
      icon: <Star className="h-6 w-6" />
    },
    {
      step: 4,
      title: "Make Your Mark",
      description: "Contribute code, design, or ideas to help shape the future",
      icon: <CheckCircle className="h-6 w-6" />
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Join the Revolution
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">Contribute to Omnior</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Be part of building the world's most advanced web browser. Whether you're a developer, 
              designer, writer, or community builder, there's a place for you in the Omnior project.
            </p>
          </div>
        </div>
      </section>

      {/* Contribution Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">How to Contribute</h2>
              <p className="text-lg text-muted-foreground">
                Your journey to becoming an Omnior contributor in 4 simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contributionProcess.map((process) => (
                <Card key={process.step} className="border-border/50 text-center">
                  <CardHeader>
                    <div className="flex justify-center text-primary mb-2">
                      {process.icon}
                    </div>
                    <Badge variant="outline" className="w-fit mx-auto">
                      Step {process.step}
                    </Badge>
                    <CardTitle className="text-lg">{process.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {process.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ways to Contribute */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Ways to Contribute</h2>
              <p className="text-lg text-muted-foreground">
                Find the perfect way to contribute based on your skills and interests
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributionWays.map((way) => (
                <Card key={way.title} className="border-border/50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{way.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{way.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>{way.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Skills Needed:</h4>
                      <div className="flex flex-wrap gap-1">
                        {way.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <Badge variant={way.difficulty === "Beginner" ? "default" : way.difficulty === "Intermediate" ? "secondary" : "destructive"}>
                        {way.difficulty}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time Commitment:</span>
                      <span className="font-medium">{way.timeCommitment}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Open Positions</h2>
              <p className="text-lg text-muted-foreground">
                Join our core team and help shape the future of web browsing
              </p>
            </div>

            <div className="space-y-6">
              {teamRoles.map((role) => (
                <Card key={role.title} className="border-border/50">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{role.title}</CardTitle>
                          <Badge variant="outline">{role.department}</Badge>
                        </div>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <Badge variant="secondary">{role.type}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {role.location}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Requirements:</h4>
                        <ul className="space-y-1">
                          {role.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-primary mt-1">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full sm:w-auto">
                        Apply for Position
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community & Communication */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Join Our Community</h2>
              <p className="text-lg text-muted-foreground">
                Connect with fellow contributors and stay updated on project progress
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Communication Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span className="font-medium">Discord</span>
                      </div>
                      <Button variant="outline" size="sm">Join</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        <span className="font-medium">GitHub</span>
                      </div>
                      <Button variant="outline" size="sm">Follow</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        <span className="font-medium">Twitter</span>
                      </div>
                      <Button variant="outline" size="sm">Follow</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="font-medium">Newsletter</span>
                      </div>
                      <Button variant="outline" size="sm">Subscribe</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="border-l-2 border-primary/20 pl-3">
                      <h4 className="font-semibold text-sm">Community Call</h4>
                      <p className="text-xs text-muted-foreground">Every Tuesday, 18:00 UTC</p>
                    </div>
                    <div className="border-l-2 border-primary/20 pl-3">
                      <h4 className="font-semibold text-sm">Code Review Session</h4>
                      <p className="text-xs text-muted-foreground">Every Thursday, 16:00 UTC</p>
                    </div>
                    <div className="border-l-2 border-primary/20 pl-3">
                      <h4 className="font-semibold text-sm">Monthly Hackathon</h4>
                      <p className="text-xs text-muted-foreground">First weekend of each month</p>
                    </div>
                    <div className="border-l-2 border-primary/20 pl-3">
                      <h4 className="font-semibold text-sm">Office Hours</h4>
                      <p className="text-xs text-muted-foreground">Fridays, 14:00-16:00 UTC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contributor Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Why Contribute?</h2>
              <p className="text-lg text-muted-foreground">
                Join us in building something revolutionary and grow your skills along the way
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Impact</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Work on a project that could change how millions of people browse the web. 
                    Your contributions will have real, lasting impact.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Learning</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Learn cutting-edge technologies like Rust, AI/ML, and modern web development 
                    from experienced developers and architects.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Community</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Join a passionate community of developers, designers, and innovators from 
                    around the world who share your vision.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Recognition</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get recognized for your contributions through our contributor program, 
                    featuring top contributors and their achievements.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Career Growth</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Build an impressive portfolio working on complex, challenging projects 
                    that showcase your skills to potential employers.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Open Source</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Contribute to a truly open-source project with MIT license, 
                    ensuring your work remains free and accessible to everyone.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground">
              The future of web browsing is being built right now, and we need your help. 
              Whether you're ready to dive into code or just want to learn more, 
              there's never been a better time to join the Omnior community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Github className="mr-2 h-5 w-5" />
                Start Contributing
              </Button>
              <Button variant="outline" size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Join Discord
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}