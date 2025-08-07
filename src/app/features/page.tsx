import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Zap, 
  Brain, 
  Shield, 
  Palette, 
  Github, 
  Settings, 
  Globe, 
  Lock, 
  Database, 
  Cpu, 
  Smartphone,
  Monitor,
  Fingerprint,
  Network,
  FileText,
  Layers,
  Layout,
  Keyboard,
  Eye,
  Download,
  Search,
  Map,
  Cloud,
  User,
  Star
} from "lucide-react"

export default function FeaturesPage() {
  const featureCategories = [
    {
      title: "Rendering Engine",
      icon: <Cpu className="h-8 w-8" />,
      description: "Built from scratch in Rust for ultimate performance and safety",
      features: [
        {
          name: "Modern Web Standards",
          description: "Full support for HTML5, CSS3, and modern JavaScript",
          icon: <Globe className="h-5 w-5" />
        },
        {
          name: "GPU Acceleration",
          description: "Hardware-accelerated rendering for smooth performance",
          icon: <Zap className="h-5 w-5" />
        },
        {
          name: "Memory Optimization",
          description: "Intelligent memory management for efficient resource usage",
          icon: <Database className="h-5 w-5" />
        },
        {
          name: "Multi-Process Architecture",
          description: "Isolated processes for stability and security",
          icon: <Layers className="h-5 w-5" />
        }
      ]
    },
    {
      title: "AI Smart Assistant",
      icon: <Brain className="h-8 w-8" />,
      description: "Built-in AI that learns and adapts to your browsing habits",
      features: [
        {
          name: "Content Summarization",
          description: "AI-powered summarization of long articles and documents",
          icon: <FileText className="h-5 w-5" />
        },
        {
          name: "Real-time Translation",
          description: "Translate web pages instantly in 100+ languages",
          icon: <Globe className="h-5 w-5" />
        },
        {
          name: "Smart Q&A",
          description: "Ask questions about page content and get instant answers",
          icon: <Search className="h-5 w-5" />
        },
        {
          name: "Personalized Shortcuts",
          description: "AI-generated browsing shortcuts based on your habits",
          icon: <Star className="h-5 w-5" />
        }
      ]
    },
    {
      title: "Privacy Tools",
      icon: <Shield className="h-8 w-8" />,
      description: "Privacy-by-design with zero tracking built into the core",
      features: [
        {
          name: "One-Click Anti-Tracking",
          description: "Block trackers, ads, and unwanted scripts instantly",
          icon: <Eye className="h-5 w-5" />
        },
        {
          name: "Fingerprint Blocking",
          description: "Prevent browser fingerprinting and profiling",
          icon: <Fingerprint className="h-5 w-5" />
        },
        {
          name: "Per-Tab VPN",
          description: "Individual VPN controls for each browser tab",
          icon: <Network className="h-5 w-5" />
        },
        {
          name: "Incognito Plus",
          description: "Enhanced private mode with Tor integration and sandboxing",
          icon: <Lock className="h-5 w-5" />
        }
      ]
    },
    {
      title: "Productivity Suite",
      icon: <Palette className="h-8 w-8" />,
      description: "Tools designed to make you more efficient online",
      features: [
        {
          name: "Split View",
          description: "View multiple web pages side-by-side in a single window",
          icon: <Layout className="h-5 w-5" />
        },
        {
          name: "Vertical Tabs",
          description: "Space-efficient vertical tab management",
          icon: <Layers className="h-5 w-5" />
        },
        {
          name: "Session Manager",
          description: "Save, restore, and manage browsing sessions",
          icon: <Database className="h-5 w-5" />
        },
        {
          name: "Tab Search & History Mind-Map",
          description: "Visual search and organization of tabs and history",
          icon: <Map className="h-5 w-5" />
        },
        {
          name: "Offline Save-Anything",
          description: "Save complete web pages for offline reading",
          icon: <Download className="h-5 w-5" />
        }
      ]
    },
    {
      title: "Extensions",
      icon: <Github className="h-8 w-8" />,
      description: "Chrome extension compatibility plus native add-ons",
      features: [
        {
          name: "Chrome Extension Support",
          description: "Run most Chrome extensions in a compatibility layer",
          icon: <Github className="h-5 w-5" />
        },
        {
          name: "Native Omnior Add-ons",
          description: "High-performance native extensions with full API access",
          icon: <Cpu className="h-5 w-5" />
        },
        {
          name: "Developer SDK",
          description: "Complete toolkit for building Omnior extensions",
          icon: <Code className="h-5 w-5" />
        },
        {
          name: "Extension Marketplace",
          description: "Curated store for extensions and add-ons",
          icon: <Store className="h-5 w-5" />
        }
      ]
    },
    {
      title: "Customization",
      icon: <Settings className="h-8 w-8" />,
      description: "Make the browser truly yours",
      features: [
        {
          name: "Drag-and-Drop Toolbar",
          description: "Fully customizable toolbar arrangement",
          icon: <Layout className="h-5 w-5" />
        },
        {
          name: "Custom Keyboard Shortcuts",
          description: "Personalized keyboard shortcuts for every action",
          icon: <Keyboard className="h-5 w-5" />
        },
        {
          name: "Themes & Styling",
          description: "Built-in dark/light themes plus custom UI styling",
          icon: <Palette className="h-5 w-5" />
        },
        {
          name: "Profile Management",
          description: "Multiple user profiles with separate settings",
          icon: <User className="h-5 w-5" />
        }
      ]
    }
  ]

  const platformSupport = [
    {
      name: "Desktop",
      icon: <Monitor className="h-8 w-8" />,
      platforms: ["Windows", "macOS", "Linux"],
      description: "Full-featured desktop experience with native performance"
    },
    {
      name: "Mobile",
      icon: <Smartphone className="h-8 w-8" />,
      platforms: ["Android", "iOS"],
      description: "Optimized mobile experience with sync capabilities"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Core Features
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">Revolutionary Browser Features</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the cutting-edge features that make Omnior the world's most advanced web browser.
              From AI-powered assistance to enterprise-grade privacy, we've reimagined what a browser can do.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Support */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Cross-Platform Support</h2>
              <p className="text-lg text-muted-foreground">
                Available on all major platforms with consistent experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {platformSupport.map((platform) => (
                <Card key={platform.name} className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{platform.icon}</div>
                      <div>
                        <CardTitle>{platform.name}</CardTitle>
                        <CardDescription>{platform.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {platform.platforms.map((p) => (
                        <Badge key={p} variant="secondary">{p}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Feature Categories</h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive suite of features designed for the modern web
              </p>
            </div>

            <div className="space-y-16">
              {featureCategories.map((category) => (
                <div key={category.title} className="space-y-8">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center text-primary">
                      {category.icon}
                    </div>
                    <h3 className="text-2xl font-bold">{category.title}</h3>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      {category.description}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.features.map((feature) => (
                      <Card key={feature.name} className="border-border/50 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="text-primary">{feature.icon}</div>
                            <CardTitle className="text-lg">{feature.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">How We Compare</h2>
              <p className="text-lg text-muted-foreground">
                See how Omnior stacks up against other popular browsers
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Omnior</th>
                    <th className="text-center p-4 font-semibold">Chrome</th>
                    <th className="text-center p-4 font-semibold">Firefox</th>
                    <th className="text-center p-4 font-semibold">Safari</th>
                    <th className="text-center p-4 font-semibold">Brave</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/20">
                    <td className="p-4">AI Assistant</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✗</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="p-4">Privacy-by-Design</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✓</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="p-4">Custom Engine</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✗</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="p-4">Vertical Tabs</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✓</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="p-4">Split View</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="p-4">Per-Tab VPN</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✗</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="p-4">Open Source</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✗</td>
                    <td className="text-center p-4">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Technical Specifications</h2>
              <p className="text-lg text-muted-foreground">
                Detailed technical information for developers and tech enthusiasts
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Rendering Engine</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Language:</span>
                    <Badge variant="secondary">Rust</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Graphics API:</span>
                    <Badge variant="secondary">Vulkan/Metal</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Layout Engine:</span>
                    <Badge variant="secondary">Custom</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">JS Engine:</span>
                    <Badge variant="secondary">Custom V8-based</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>System Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">RAM:</span>
                    <span className="text-sm">4GB minimum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Storage:</span>
                    <span className="text-sm">500MB minimum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">GPU:</span>
                    <span className="text-sm">DirectX 11 / OpenGL 3.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Network:</span>
                    <span className="text-sm">Broadband connection</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Experience the Future?</h2>
            <p className="text-lg text-muted-foreground">
              Join us on this revolutionary journey to build the world's most advanced web browser.
              Whether you're a user looking for a better browsing experience or a developer wanting
              to contribute to the future of the web, there's a place for you in the Omnior community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download Beta
              </Button>
              <Button variant="outline" size="lg">
                <Github className="mr-2 h-5 w-5" />
                View Source Code
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Store icon component (since it's not in lucide-react)
function Store(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m2 7 4.5-4.5a2.12 2.12 0 0 1 3 0L14 7" />
      <path d="M22 7l-4.5-4.5a2.12 2.12 0 0 0-3 0L10 7" />
      <path d="M8 21V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12" />
      <path d="M6 21h12" />
      <path d="M6 13h12" />
    </svg>
  )
}

// Code icon component (since it's not in lucide-react)
function Code(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}