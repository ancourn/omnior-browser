import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Shield, Zap, Brain, Palette, Download, Users, Code, Rocket, Globe, Lock, Smartphone, Monitor, Github } from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
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
              <Link href="/features" className="text-primary font-medium">Features</Link>
              <Link href="/developers" className="text-muted-foreground hover:text-primary transition-colors">Developers</Link>
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
              Feature Overview
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Powerful Features for Modern Browsing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the comprehensive set of features that make Omnior the most advanced web browser available today.
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
              Everything you need in a modern browser, engineered for excellence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="h-full">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Blazing Fast Performance</CardTitle>
                <CardDescription>
                  Optimized rendering engine with hardware acceleration and intelligent resource management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 2x faster page loads</li>
                  <li>• 50% less memory usage</li>
                  <li>• Hardware acceleration</li>
                  <li>• Smart preloading</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Advanced Privacy Protection</CardTitle>
                <CardDescription>
                  Comprehensive privacy suite with built-in tracking protection and security features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Ad and tracker blocking</li>
                  <li>• Built-in VPN</li>
                  <li>• HTTPS Everywhere</li>
                  <li>• Zero data collection</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI-Powered Intelligence</CardTitle>
                <CardDescription>
                  Smart features that learn from your browsing habits and enhance your experience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Smart tab management</li>
                  <li>• Predictive navigation</li>
                  <li>• Content summarization</li>
                  <li>• Personalized recommendations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Palette className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Deep Customization</CardTitle>
                <CardDescription>
                  Make Omnior truly yours with extensive customization options and themes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Custom themes</li>
                  <li>• Flexible layout</li>
                  <li>• Extension support</li>
                  <li>• Personalized workspace</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Code className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Developer Tools</CardTitle>
                <CardDescription>
                  Professional-grade development tools built right into the browser.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Advanced debugger</li>
                  <li>• Performance profiler</li>
                  <li>• Network analyzer</li>
                  <li>• Built-in console</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Open Source</CardTitle>
                <CardDescription>
                  100% transparent and community-driven development.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Transparent code</li>
                  <li>• Community contributions</li>
                  <li>• Regular audits</li>
                  <li>• Permissive licensing</li>
                </ul>
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
              Cutting-edge technology that pushes the boundaries of what a browser can do.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Smart Tab Management</CardTitle>
                <CardDescription>
                  AI-powered tab organization and memory optimization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Automatic tab grouping</li>
                  <li>• Intelligent suspension</li>
                  <li>• Tab search and preview</li>
                  <li>• Memory optimization</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Built-in VPN</CardTitle>
                <CardDescription>
                  Integrated VPN service with unlimited bandwidth.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Unlimited bandwidth</li>
                  <li>• Military-grade encryption</li>
                  <li>• Multiple server locations</li>
                  <li>• No logging policy</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Cross-Platform Sync</CardTitle>
                <CardDescription>
                  Seamless synchronization across all your devices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• End-to-end encryption</li>
                  <li>• Real-time sync</li>
                  <li>• Offline access</li>
                  <li>• Selective syncing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Monitor className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Extension Ecosystem</CardTitle>
                <CardDescription>
                  Powerful extension framework with Chrome compatibility.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Chrome extension support</li>
                  <li>• Native extension API</li>
                  <li>• Extension marketplace</li>
                  <li>• Security sandboxing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Compare</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Omnior stacks up against other popular browsers.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Feature</th>
                    <th className="text-center p-4">Omnior</th>
                    <th className="text-center p-4">Chrome</th>
                    <th className="text-center p-4">Firefox</th>
                    <th className="text-center p-4">Safari</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">Performance</td>
                    <td className="text-center p-4">🚀🚀🚀🚀🚀</td>
                    <td className="text-center p-4">🚀🚀🚀🚀</td>
                    <td className="text-center p-4">🚀🚀🚀</td>
                    <td className="text-center p-4">🚀🚀🚀🚀</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Privacy</td>
                    <td className="text-center p-4">🛡️🛡️🛡️🛡️🛡️</td>
                    <td className="text-center p-4">🛡️🛡️</td>
                    <td className="text-center p-4">🛡️🛡️🛡️🛡️</td>
                    <td className="text-center p-4">🛡️🛡️🛡️</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Customization</td>
                    <td className="text-center p-4">🎨🎨🎨🎨🎨</td>
                    <td className="text-center p-4">🎨🎨🎨🎨</td>
                    <td className="text-center p-4">🎨🎨🎨🎨</td>
                    <td className="text-center p-4">🎨🎨</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Open Source</td>
                    <td className="text-center p-4">✅</td>
                    <td className="text-center p-4">❌</td>
                    <td className="text-center p-4">✅</td>
                    <td className="text-center p-4">❌</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Built-in VPN</td>
                    <td className="text-center p-4">✅</td>
                    <td className="text-center p-4">❌</td>
                    <td className="text-center p-4">❌</td>
                    <td className="text-center p-4">❌</td>
                  </tr>
                  <tr>
                    <td className="p-4">AI Features</td>
                    <td className="text-center p-4">🤖🤖🤖🤖🤖</td>
                    <td className="text-center p-4">🤖🤖</td>
                    <td className="text-center p-4">🤖</td>
                    <td className="text-center p-4">🤖🤖</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Experience the Future?</h2>
            <p className="text-lg opacity-90">
              Download Omnior today and discover why it's the most advanced browser ever created.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <Download className="mr-2 h-5 w-5" />
                Download Now
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Github className="mr-2 h-5 w-5" />
                View Source
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