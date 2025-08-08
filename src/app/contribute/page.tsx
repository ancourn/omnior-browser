import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, Code, Bug, BookOpen, MessageSquare, Heart, GitPullRequest, Star, Fork } from "lucide-react"
import Link from "next/link"

export default function ContributePage() {
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
              <Link href="/contribute" className="text-primary font-medium">Contribute</Link>
              <Link href="/roadmap" className="text-muted-foreground hover:text-primary transition-colors">Roadmap</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Join Our Community
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Contribute to Omnior
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us build the world's most advanced web browser. Every contribution, big or small, makes a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg">
                <Code className="mr-2 h-5 w-5" />
                Start Contributing
              </Button>
              <Button variant="outline" size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Join Discussion
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ways to Contribute */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Ways to Contribute</h2>
            
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
              </TabsList>
              
              <TabsContent value="code" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Development
                      </CardTitle>
                      <CardDescription>
                        Contribute to the core browser codebase.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Fix bugs and issues</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Implement new features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Optimize performance</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Improve security</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        View Good First Issues
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GitPullRequest className="h-5 w-5" />
                        Extensions & Themes
                      </CardTitle>
                      <CardDescription>
                        Create extensions and themes for the community.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Build browser extensions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Create beautiful themes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Submit to extension store</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Help others with development</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Extension Developer Guide
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="design" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        UI/UX Design
                      </CardTitle>
                      <CardDescription>
                        Help design the user interface and experience.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Create wireframes and mockups</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Design user interfaces</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Improve user experience</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Create design systems</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Design Resources
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Icon & Asset Design
                      </CardTitle>
                      <CardDescription>
                        Create icons, illustrations, and other assets.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Design app icons</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Create UI icons</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Design illustrations</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Create marketing assets</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Brand Guidelines
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="docs" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Documentation
                      </CardTitle>
                      <CardDescription>
                        Help improve our documentation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Write technical documentation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Create user guides</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Translate documentation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Fix documentation errors</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Documentation Guide
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Tutorials & Blog
                      </CardTitle>
                      <CardDescription>
                        Create educational content for users.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Write tutorials</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Create video content</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Write blog posts</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Share best practices</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Content Guidelines
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="testing" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bug className="h-5 w-5" />
                        Bug Testing
                      </CardTitle>
                      <CardDescription>
                        Help find and report bugs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Test new features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Report bugs and issues</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Reproduce reported issues</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Test on different platforms</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Bug Reporting Guide
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Automated Testing
                      </CardTitle>
                      <CardDescription>
                        Write and maintain automated tests.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Write unit tests</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Create integration tests</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Set up CI/CD pipelines</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Improve test coverage</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Testing Framework
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="community" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Community Support
                      </CardTitle>
                      <CardDescription>
                        Help users and grow the community.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Answer user questions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Moderate discussions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Organize community events</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Help new contributors</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Join Community
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Advocacy & Promotion
                      </CardTitle>
                      <CardDescription>
                        Help promote Omnior Browser.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Share on social media</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Write reviews</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Give presentations</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Spread the word</span>
                        </li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Promotion Kit
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Getting Started</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">1. Learn</CardTitle>
                  <CardDescription>
                    Read our contribution guidelines and understand the project structure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Read Guidelines
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">2. Setup</CardTitle>
                  <CardDescription>
                    Set up your development environment and get the code running locally.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Setup Instructions
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <GitPullRequest className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">3. Contribute</CardTitle>
                  <CardDescription>
                    Find an issue to work on and submit your first pull request.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Find Issues
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Community Impact</h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <CardDescription className="text-base">Contributors</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="text-3xl font-bold text-primary">10K+</div>
                  <CardDescription className="text-base">GitHub Stars</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="text-3xl font-bold text-primary">2K+</div>
                  <CardDescription className="text-base">Pull Requests</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <CardDescription className="text-base">Countries</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Make a Difference?</h2>
            <p className="text-lg opacity-90">
              Join our amazing community of contributors and help shape the future of web browsing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <Code className="mr-2 h-5 w-5" />
                Start Contributing
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <MessageSquare className="mr-2 h-5 w-5" />
                Join Discord
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