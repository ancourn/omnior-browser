import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Github, ExternalLink, Shield, Zap, Brain, Palette, Download, Users, Code, Rocket, Settings, Activity, Gauge, Cpu, Memory } from "lucide-react"
import { FloatingNotesButton } from "@/components/notes/floating-notes-button"
import { FloatingTabGroupsButton } from "@/components/tab-groups/floating-tab-groups-button"
import { FloatingTranslateButton } from "@/components/translate/floating-translate-button"
import { FloatingAdBlockerButton } from "@/components/adblocker/floating-adblocker-button"
import { FloatingAISummarizerButton } from "@/components/ai/floating-ai-summarizer-button"
import { FloatingSearchButton } from "@/components/search/floating-search-button"
import { FloatingFunToolsButton } from "@/components/fun-tools/floating-fun-tools-button"
import { FloatingHistoryButton } from "@/components/history/floating-history-button"
import { FloatingDownloadButton } from "@/components/downloads/floating-download-button"

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
                <CardTitle>Blazing Fast Core Engine</CardTitle>
                <CardDescription>
                  Revolutionary browsing engine that's 2x faster than Chrome with 50% less memory usage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• ⚡ Ultra-fast rendering (2x faster than Chrome)</li>
                  <li>• 🧠 Smart memory management (50% less usage)</li>
                  <li>• 🔄 AI-powered tab organization</li>
                  <li>• 🎯 Predictive loading and navigation</li>
                  <li>• 📊 Real-time performance monitoring</li>
                </ul>
              </CardContent>
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
                <CardTitle>Fun & Happy Tools</CardTitle>
                <CardDescription>
                  Revolutionary tools that make browsing joyful and delightful with AI-powered happiness boosts!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 🎉 Confetti celebrations for achievements</li>
                  <li>• 🐱 Virtual companion pets</li>
                  <li>• 🌈 Rainbow visual effects</li>
                  <li>• 🧘 Wellness and mindfulness tools</li>
                  <li>• 🎵 Mood-enhancing soundscapes</li>
                  <li>• 🏆 Gamification and rewards</li>
                </ul>
              </CardContent>
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

      {/* Core Browsing Engine */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Browsing Engine</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Revolutionary technology that outperforms Chrome in every aspect.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="h-full">
              <CardHeader>
                <Zap className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Ultra-Fast Rendering</CardTitle>
                <CardDescription>
                  2x faster page loading than Chrome with advanced GPU acceleration and predictive rendering.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Chrome Load Time:</span>
                    <span className="font-mono">1.2s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Omnior Load Time:</span>
                    <span className="font-mono text-green-600">0.6s</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Improvement:</span>
                    <span className="text-green-600">50% Faster</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Brain className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Smart Memory Management</CardTitle>
                <CardDescription>
                  Advanced memory optimization using 50% less RAM than Chrome with intelligent tab hibernation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Chrome Memory:</span>
                    <span className="font-mono">120MB/tab</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Omnior Memory:</span>
                    <span className="font-mono text-blue-600">60MB/tab</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Savings:</span>
                    <span className="text-blue-600">50% Less</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Activity className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>AI-Powered Optimization</CardTitle>
                <CardDescription>
                  Intelligent tab organization, predictive loading, and adaptive performance tuning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Smart tab grouping</li>
                  <li>• Predictive preloading</li>
                  <li>• Adaptive performance</li>
                  <li>• Context-aware optimization</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Real-time performance monitoring and optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Render Speed</span>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Efficiency</span>
                    <Badge className="bg-blue-100 text-blue-800">Superior</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CPU Usage</span>
                    <Badge className="bg-purple-100 text-purple-800">Optimal</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Network Latency</span>
                    <Badge className="bg-green-100 text-green-800">Minimal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Advanced Features
                </CardTitle>
                <CardDescription>
                  Cutting-edge technologies for superior browsing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-sm">GPU-accelerated rendering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Memory className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Intelligent memory compression</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">AI-driven resource allocation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Real-time performance analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Chrome-like Features with AI Enhancements */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Chrome Features + AI Superpowers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you love about Chrome, enhanced with revolutionary AI capabilities that make browsing smarter, faster, and more intuitive.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="h-full">
              <CardHeader>
                <Search className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>AI-Powered Omnibox</CardTitle>
                <CardDescription>
                  Next-generation address bar with intelligent search, calculations, conversions, and predictive suggestions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Smart search suggestions</li>
                  <li>• Built-in calculator</li>
                  <li>• Unit conversions</li>
                  <li>• Weather & local info</li>
                  <li>• AI-powered predictions</li>
                  <li>• Voice command support</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Code className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>AI-Enhanced DevTools</CardTitle>
                <CardDescription>
                  Revolutionary developer tools with AI debugging, performance optimization, and intelligent code analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• AI error analysis</li>
                  <li>• Performance insights</li>
                  <li>• Code optimization tips</li>
                  <li>• Smart debugging</li>
                  <li>• Memory leak detection</li>
                  <li>• Security scanning</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Brain className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Extension Compatibility</CardTitle>
                <CardDescription>
                  Full Chrome extension compatibility with AI-enhanced security and performance monitoring.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 100% Chrome compatible</li>
                  <li>• AI security scanning</li>
                  <li>• Performance monitoring</li>
                  <li>• Smart permissions</li>
                  <li>• Extension sandboxing</li>
                  <li>• Auto-updates</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Cloud className="h-8 w-8 text-cyan-600 mb-2" />
                <CardTitle>Smart Sync & Services</CardTitle>
                <CardDescription>
                  Google-like sync services with AI-powered organization and end-to-end encryption.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Cross-device sync</li>
                  <li>• AI bookmark organization</li>
                  <li>• Smart history search</li>
                  <li>• Password management</li>
                  <li>• Tab synchronization</li>
                  <li>• Encrypted backup</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Shield className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Advanced Privacy</CardTitle>
                <CardDescription>
                  Built-in VPN, tracking protection, and AI-powered security that surpasses Chrome's features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Built-in unlimited VPN</li>
                  <li>• AI threat detection</li>
                  <li>• Advanced tracking protection</li>
                  <li>• Privacy sandbox</li>
                  <li>• Secure DNS</li>
                  <li>• Anti-phishing AI</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Users className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Smart Profiles</CardTitle>
                <CardDescription>
                  AI-powered user profiles with automatic personalization and context switching.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• AI profile switching</li>
                  <li>• Context awareness</li>
                  <li>• Automatic customization</li>
                  <li>• Work-life separation</li>
                  <li>• Smart suggestions</li>
                  <li>• Privacy controls</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Chrome vs Omnior: Feature Comparison</CardTitle>
                <CardDescription className="text-center">
                  See how Omnior enhances every Chrome feature with AI superpowers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="font-medium">Feature</div>
                    <div className="font-medium">Chrome</div>
                    <div className="font-medium">Omnior + AI</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center py-2 border-t">
                    <div>Address Bar</div>
                    <div>✅ Basic</div>
                    <div>✅ <Badge className="bg-green-100 text-green-800">AI Enhanced</Badge></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center py-2 border-t">
                    <div>DevTools</div>
                    <div>✅ Standard</div>
                    <div>✅ <Badge className="bg-green-100 text-green-800">AI Powered</Badge></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center py-2 border-t">
                    <div>Extensions</div>
                    <div>✅ Compatible</div>
                    <div>✅ <Badge className="bg-green-100 text-green-800">AI Secured</Badge></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center py-2 border-t">
                    <div>Sync Services</div>
                    <div>✅ Google Account</div>
                    <div>✅ <Badge className="bg-green-100 text-green-800">AI Organized</Badge></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center py-2 border-t">
                    <div>Privacy</div>
                    <div>✅ Basic Protection</div>
                    <div>✅ <Badge className="bg-green-100 text-green-800">AI Fortified</Badge></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center py-2 border-t">
                    <div>Performance</div>
                    <div>✅ Standard</div>
                    <div>✅ <Badge className="bg-green-100 text-green-800">AI Optimized</Badge></div>
                  </div>
                </div>
              </CardContent>
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

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">🎉 Fun & Happy Tools</h3>
              <p className="text-muted-foreground">
                Revolutionary tools that bring joy and delight to your browsing experience with AI-powered happiness enhancements!
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
      
      {/* Fun Tools Integration */}
      <FloatingFunToolsButton />
      
      {/* History Integration */}
      <FloatingHistoryButton />
      
      {/* Download Manager Integration */}
      <FloatingDownloadButton />
    </div>
  )
}