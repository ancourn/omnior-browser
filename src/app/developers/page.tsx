import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Code, BookOpen, Users, Zap, Shield, GitBranch, Database, Cloud, Terminal } from "lucide-react"
import Link from "next/link"

export default function DevelopersPage() {
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
              <Link href="/developers" className="text-primary font-medium">Developers</Link>
              <Link href="/contribute" className="text-muted-foreground hover:text-primary transition-colors">Contribute</Link>
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
              Developer Resources
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Build with Omnior
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive documentation, APIs, and tools to help you build amazing extensions and integrate with Omnior Browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                <Code className="mr-2 h-5 w-5" />
                View API Docs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Quick Start Guide</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">1. Setup Development</CardTitle>
                  <CardDescription>
                    Install the necessary tools and set up your development environment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="bg-muted p-3 rounded font-mono text-xs">
                      git clone https://github.com/omnior/browser.git<br />
                      cd browser<br />
                      npm install
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">2. Build & Run</CardTitle>
                  <CardDescription>
                    Build the browser and run it in development mode.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="bg-muted p-3 rounded font-mono text-xs">
                      npm run build<br />
                      npm run dev
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Terminal className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">3. Start Building</CardTitle>
                  <CardDescription>
                    Create your first extension or modify the browser core.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="bg-muted p-3 rounded font-mono text-xs">
                      mkdir my-extension<br />
                      cd my-extension<br />
                      omnior init
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* API Documentation */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">API Documentation</h2>
            
            <Tabs defaultValue="extensions" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="extensions">Extensions</TabsTrigger>
                <TabsTrigger value="web-api">Web API</TabsTrigger>
                <TabsTrigger value="native">Native API</TabsTrigger>
                <TabsTrigger value="themes">Themes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="extensions" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Extension API</CardTitle>
                      <CardDescription>
                        Build powerful extensions that enhance browser functionality.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">chrome.tabs</Badge>
                          <span>Tab management and control</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">chrome.storage</Badge>
                          <span>Local and cloud storage</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">chrome.runtime</Badge>
                          <span>Runtime messaging and events</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">omnior.ai</Badge>
                          <span>AI-powered features integration</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Extension Types</CardTitle>
                      <CardDescription>
                        Different types of extensions you can build.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Browser Actions - Toolbar buttons</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Page Actions - Context-specific tools</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Content Scripts - Page modification</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Background Scripts - Service workers</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="web-api" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Web Platform APIs</CardTitle>
                      <CardDescription>
                        Enhanced web APIs available in Omnior.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">WebRTC</Badge>
                          <span>Enhanced video/audio streaming</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">WebAssembly</Badge>
                          <span>High-performance computing</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">Service Workers</Badge>
                          <span>Offline capabilities</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">WebGPU</Badge>
                          <span>Advanced graphics rendering</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Omnior-Specific APIs</CardTitle>
                      <CardDescription>
                        Exclusive APIs available only in Omnior Browser.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">omnior.ai</Badge>
                          <span>AI integration APIs</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">omnior.vpn</Badge>
                          <span>VPN service integration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">omnior.privacy</Badge>
                          <span>Privacy control APIs</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">omnior.sync</Badge>
                          <span>Cloud synchronization</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="native" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Native Module API</CardTitle>
                      <CardDescription>
                        Build native modules for maximum performance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">C++ API</Badge>
                          <span>Native C++ module development</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">Rust API</Badge>
                          <span>Safe and fast Rust modules</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">Node.js API</Badge>
                          <span>JavaScript native modules</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">Go API</Badge>
                          <span>Go language support</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Integration</CardTitle>
                      <CardDescription>
                        Integrate with operating system features.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>File system access</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>System notifications</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Hardware integration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Network configuration</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="themes" className="mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Theme Development</CardTitle>
                      <CardDescription>
                        Create beautiful themes for Omnior Browser.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">CSS Variables</Badge>
                          <span>Custom color schemes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">SVG Icons</Badge>
                          <span>Custom icon sets</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">Animations</Badge>
                          <span>Custom transitions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary">Layouts</Badge>
                          <span>Custom UI layouts</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Theme Tools</CardTitle>
                      <CardDescription>
                        Tools and utilities for theme development.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Theme Builder GUI</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Color palette generator</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Live preview</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>Export tools</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Development Tools */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Development Tools</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    CLI Tools
                  </CardTitle>
                  <CardDescription>
                    Command-line tools for efficient development.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• omnior create - Project scaffolding</li>
                    <li>• omnior build - Build and package</li>
                    <li>• omnior test - Run tests</li>
                    <li>• omnior publish - Publish to store</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Debugging Tools
                  </CardTitle>
                  <CardDescription>
                    Advanced debugging and profiling tools.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Extension Debugger</li>
                    <li>• Performance Profiler</li>
                    <li>• Memory Analyzer</li>
                    <li>• Network Inspector</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Cloud Services
                  </CardTitle>
                  <CardDescription>
                    Cloud-based development and deployment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Extension Hosting</li>
                    <li>• Automatic Updates</li>
                    <li>• Analytics Dashboard</li>
                    <li>• User Management</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community Resources
                  </CardTitle>
                  <CardDescription>
                    Connect with other developers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Developer Forums</li>
                    <li>• Discord Community</li>
                    <li>• Stack Overflow</li>
                    <li>• GitHub Discussions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Start Building Today</h2>
            <p className="text-lg opacity-90">
              Join thousands of developers building the future of web browsing with Omnior.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <BookOpen className="mr-2 h-5 w-5" />
                Read Documentation
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Code className="mr-2 h-5 w-5" />
                View Examples
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