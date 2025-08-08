import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Github, ExternalLink, Shield, Zap, Brain, Palette, Download, Users, Code, Rocket, Settings } from "lucide-react"
import { FloatingNotesButton } from "@/components/notes/floating-notes-button"
import { FloatingTabGroupsButton } from "@/components/tab-groups/floating-tab-groups-button"
import { FloatingTranslateButton } from "@/components/translate/floating-translate-button"
import { FloatingAdBlockerButton } from "@/components/adblocker/floating-adblocker-button"
import { FloatingAISummarizerButton } from "@/components/ai/floating-ai-summarizer-button"
import { FloatingSearchButton } from "@/components/search/floating-search-button"

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
                <Download className="mr-2 h-5 w-5" />
                Download Beta
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <a href="/tools">
                  <Code className="mr-2 h-5 w-5" />
                  Try Tools
                </a>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <a href="/extensions">
                  <Settings className="mr-2 h-5 w-5" />
                  Extensions
                </a>
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
            <Card className="h-full">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Blazing Fast</CardTitle>
                <CardDescription>
                  Built with performance in mind. Omnior loads pages faster than any other browser while using less memory.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  Advanced tracking protection, built-in VPN, and zero data collection. Your privacy is our priority.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI-Powered</CardTitle>
                <CardDescription>
                  Intelligent browsing assistance, smart tab management, and predictive navigation powered by advanced AI.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Palette className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Highly Customizable</CardTitle>
                <CardDescription>
                  Complete theming system, customizable UI, and powerful extensions. Make it truly yours.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Code className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Developer Tools</CardTitle>
                <CardDescription>
                  Advanced debugging tools, built-in console, and comprehensive web development features.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Open Source</CardTitle>
                <CardDescription>
                  100% open source with community-driven development. Contribute and help shape the future of browsing.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cutting-edge technology that sets Omnior apart from the competition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Smart Tab Management</h3>
              <p className="text-muted-foreground">
                AI-powered tab organization, automatic grouping, and intelligent suspension of inactive tabs to save memory.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Built-in VPN</h3>
              <p className="text-muted-foreground">
                Integrated VPN service with unlimited bandwidth, multiple server locations, and military-grade encryption.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Cross-Platform Sync</h3>
              <p className="text-muted-foreground">
                Seamless synchronization across all your devices with end-to-end encryption for your data.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Extension Ecosystem</h3>
              <p className="text-muted-foreground">
                Compatible with Chrome extensions while offering our own powerful extension framework.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Development Roadmap</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our journey to revolutionize web browsing, phase by phase.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <div className="w-0.5 h-full bg-primary/30 mt-2"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-xl font-semibold mb-2">Phase 1: Foundation</h3>
                <p className="text-muted-foreground">
                  Project scaffold, branding, UI wireframes, and basic architecture setup.
                </p>
                <Badge variant="secondary" className="mt-2">Completed</Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
                <div className="w-0.5 h-full bg-primary/30 mt-2"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-xl font-semibold mb-2">Phase 2: Core Engine</h3>
                <p className="text-muted-foreground">
                  Basic browsing engine, tab management, navigation controls, and bookmark system.
                </p>
                <Badge variant="secondary" className="mt-2">In Progress</Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  3
                </div>
                <div className="w-0.5 h-full bg-primary/30 mt-2"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-xl font-semibold mb-2">Phase 3: Advanced Features</h3>
                <p className="text-muted-foreground">
                  AI integration, advanced privacy features, developer tools, and extension system.
                </p>
                <Badge variant="outline" className="mt-2">Planned</Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  4
                </div>
                <div className="w-0.5 h-full bg-primary/30 mt-2"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-xl font-semibold mb-2">Phase 4: Ecosystem</h3>
                <p className="text-muted-foreground">
                  Cross-platform sync, cloud services, mobile app, and third-party integrations.
                </p>
                <Badge variant="outline" className="mt-2">Planned</Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  5
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Phase 5: Launch & Growth</h3>
                <p className="text-muted-foreground">
                  Public release, marketing campaign, community building, and continuous improvement.
                </p>
                <Badge variant="outline" className="mt-2">Future</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Join the Revolution</h2>
            <p className="text-lg opacity-90">
              Be part of the future of web browsing. Whether you're a developer, designer, or just passionate about better technology, there's a place for you in the Omnior community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <Github className="mr-2 h-5 w-5" />
                Contribute on GitHub
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
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            © 2024 Omnior Browser. Open source and built with ❤️ by the community.
          </div>
        </div>
      </footer>
      
      {/* Quick Notes Integration */}
      <FloatingNotesButton />
      
      {/* Tab Groups Manager Integration */}
      <FloatingTabGroupsButton />
      
      {/* Quick Translate Integration */}
      <FloatingTranslateButton />
      
      {/* Ad Blocker Integration */}
      <FloatingAdBlockerButton showStats={true} />
      
      {/* AI Summarizer Integration */}
      <FloatingAISummarizerButton />
      
      {/* Advanced Search Integration */}
      <FloatingSearchButton />
    </div>
  )
}