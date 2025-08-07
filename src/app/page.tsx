import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Github, ExternalLink, Shield, Zap, Brain, Palette } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="px-4 py-2 text-sm">
                Next-Gen Web Browser
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Omnior
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                The world's most advanced, cross-platform web browser—faster, more secure, more intelligent, and more personalized.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="w-full sm:w-auto">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <ExternalLink className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Our Vision</h2>
            <p className="text-lg text-muted-foreground">
              Build a browser so revolutionary that even Google would want to buy it. 
              We're creating a 100% original, open-source browser that prioritizes privacy, 
              performance, and user experience above all else.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need in a modern browser, plus revolutionary features you never knew you wanted.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  <CardTitle>Rendering Engine</CardTitle>
                </div>
                <CardDescription>
                  Built from scratch in Rust for ultimate performance and safety
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Modern CSS3/HTML5/JS support</li>
                  <li>• GPU acceleration</li>
                  <li>• Optimized memory usage</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <CardTitle>AI Smart Assistant</CardTitle>
                </div>
                <CardDescription>
                  Built-in AI that learns and adapts to your browsing habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Summarize and translate content</li>
                  <li>• Answer questions about pages</li>
                  <li>• Personalized browsing shortcuts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <CardTitle>Privacy Tools</CardTitle>
                </div>
                <CardDescription>
                  Privacy-by-design with zero tracking built into the core
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• One-click anti-tracking</li>
                  <li>• Fingerprint blocking</li>
                  <li>• Per-tab VPN toggle</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-6 w-6 text-primary" />
                  <CardTitle>Productivity Suite</CardTitle>
                </div>
                <CardDescription>
                  Tools designed to make you more efficient online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Split view & vertical tabs</li>
                  <li>• Session management</li>
                  <li>• Offline save-anything</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Github className="h-6 w-6 text-primary" />
                  <CardTitle>Extensions</CardTitle>
                </div>
                <CardDescription>
                  Chrome extension compatibility plus native add-ons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Run Chrome extensions</li>
                  <li>• Native Omnior add-ons</li>
                  <li>• Developer SDK</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-6 w-6 text-primary" />
                  <CardTitle>Customization</CardTitle>
                </div>
                <CardDescription>
                  Make the browser truly yours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Drag-and-drop toolbar</li>
                  <li>• Custom shortcuts</li>
                  <li>• Themes & styling</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Technology Stack</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with modern, performant technologies for the best browsing experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Core Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Rust</Badge>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">UI Shell</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Flutter</Badge>
                  <Badge variant="secondary">React Native</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">AI Layer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Python</Badge>
                  <Badge variant="secondary">Node.js</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Storage & Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">SQLite</Badge>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">AES</Badge>
                  <Badge variant="secondary">WebAuthn</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Backend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Node.js</Badge>
                  <Badge variant="secondary">Go</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Development Phases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Development Roadmap</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our 7-phase approach to building the world's most advanced browser.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7].map((phase) => (
              <Card key={phase} className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Phase {phase}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {phase === 1 && "Project scaffold, logo, brand assets, UI wireframes"}
                    {phase === 2 && "Core engine + basic shell integration"}
                    {phase === 3 && "Extension layer + Chrome extension support"}
                    {phase === 4 && "AI assistant, privacy tools, tab system"}
                    {phase === 5 && "Cross-device sync, cloud storage"}
                    {phase === 6 && "Beta release + feedback system"}
                    {phase === 7 && "Launch + growth via DevRel and communities"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Join the Revolution</h2>
            <p className="text-lg text-muted-foreground">
              We're looking for passionate developers, designers, and contributors to help build the future of web browsing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="w-full sm:w-auto">
                <Github className="mr-2 h-5 w-5" />
                Contribute on GitHub
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Read Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Omnior Browser. Open source with MIT license.
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}