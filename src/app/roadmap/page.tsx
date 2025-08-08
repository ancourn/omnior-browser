import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Rocket, CheckCircle, Clock, AlertCircle, Calendar, Users, Code, Star } from "lucide-react"
import Link from "next/link"

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8">
                  <img src="/logo.svg" alt="Omnior Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-semibold">Omnior Browser</span>
              </div>
            </div>
            <nav className="hidden md:flex gap-6">
              <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
              <Link href="/developers" className="text-muted-foreground hover:text-primary transition-colors">Developers</Link>
              <Link href="/contribute" className="text-muted-foreground hover:text-primary transition-colors">Contribute</Link>
              <Link href="/roadmap" className="text-primary font-medium">Roadmap</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Development Roadmap
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Our Journey to Revolutionize Browsing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow our development progress as we build the world's most advanced web browser, phase by phase.
            </p>
          </div>
        </div>
      </section>

      {/* Overall Progress */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Overall Progress</h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Total Project Completion</span>
                  <Badge variant="secondary">25%</Badge>
                </CardTitle>
                <CardDescription>
                  We're currently in Phase 2 of our 5-phase development plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={25} className="h-3" />
                <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                  <span>Started: Q1 2024</span>
                  <span>Estimated Completion: Q4 2025</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Phase Details */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Development Phases</h2>
            
            <div className="space-y-8">
              {/* Phase 1 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Phase 1: Foundation</CardTitle>
                        <CardDescription>Q1 2024 - Q2 2024</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Key Deliverables</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Project scaffold and architecture</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Branding and visual identity</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>UI wireframes and design system</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Basic development environment setup</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Milestones</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Repository creation and structure</li>
                        <li>• Brand guidelines completion</li>
                        <li>• Design system finalization</li>
                        <li>• Initial team formation</li>
                      </ul>
                    </div>
                  </div>
                  <Progress value={100} className="mt-4 h-2" />
                </CardContent>
              </Card>

              {/* Phase 2 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Phase 2: Core Engine</CardTitle>
                        <CardDescription>Q2 2024 - Q4 2024</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Key Deliverables</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Basic browsing engine</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Tab management system</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>Navigation controls</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>Bookmark system</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Current Focus</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Rendering engine optimization</li>
                        <li>• Memory management improvements</li>
                        <li>• Basic extension framework</li>
                        <li>• Security foundation</li>
                      </ul>
                    </div>
                  </div>
                  <Progress value={60} className="mt-4 h-2" />
                </CardContent>
              </Card>

              {/* Phase 3 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Phase 3: Advanced Features</CardTitle>
                        <CardDescription>Q1 2025 - Q2 2025</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">Planned</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Key Deliverables</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>AI integration and features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Advanced privacy features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Developer tools suite</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Extension system completion</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Innovation Focus</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Machine learning integration</li>
                        <li>• Advanced threat protection</li>
                        <li>• Professional debugging tools</li>
                        <li>• Rich extension API</li>
                      </ul>
                    </div>
                  </div>
                  <Progress value={0} className="mt-4 h-2" />
                </CardContent>
              </Card>

              {/* Phase 4 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Phase 4: Ecosystem</CardTitle>
                        <CardDescription>Q3 2025 - Q4 2025</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">Planned</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Key Deliverables</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Cross-platform sync</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Cloud services integration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Mobile app development</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Third-party integrations</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Ecosystem Goals</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Seamless device synchronization</li>
                        <li>• Cloud-based services</li>
                        <li>• Mobile platform support</li>
                        <li>• Partner integrations</li>
                      </ul>
                    </div>
                  </div>
                  <Progress value={0} className="mt-4 h-2" />
                </CardContent>
              </Card>

              {/* Phase 5 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Rocket className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Phase 5: Launch & Growth</CardTitle>
                        <CardDescription>Q1 2026 - Ongoing</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">Future</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Key Deliverables</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Public release</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Marketing campaign</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Community building</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Continuous improvement</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Growth Strategy</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Global user acquisition</li>
                        <li>• Developer community growth</li>
                        <li>• Enterprise partnerships</li>
                        <li>• Long-term sustainability</li>
                      </ul>
                    </div>
                  </div>
                  <Progress value={0} className="mt-4 h-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Project Timeline</h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Key Dates & Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-semibold">Project Kickoff</div>
                      <div className="text-sm text-muted-foreground">January 2024</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-semibold">Phase 1 Completion</div>
                      <div className="text-sm text-muted-foreground">June 2024</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-semibold">Beta Release</div>
                      <div className="text-sm text-muted-foreground">December 2024</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-semibold">Phase 3 Completion</div>
                      <div className="text-sm text-muted-foreground">June 2025</div>
                    </div>
                    <Badge variant="outline">Planned</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-semibold">Public Launch</div>
                      <div className="text-sm text-muted-foreground">March 2026</div>
                    </div>
                    <Badge variant="outline">Planned</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Get Involved */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Shape the Future with Us</h2>
            <p className="text-lg opacity-90">
              Our roadmap is ambitious, but we can't do it alone. Join our community and help us build the browser of tomorrow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <Code className="mr-2 h-5 w-5" />
                Contribute Code
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Users className="mr-2 h-5 w-5" />
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8">
                <img src="/logo.svg" alt="Omnior Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold">Omnior Browser</span>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            © 2024 Omnior Browser. Open source and built with ❤️ by the community.
          </div>
        </div>
      </footer>
    </div>
  )
}