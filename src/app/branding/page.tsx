import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Palette, Download, Eye, Copy, ExternalLink, FileText, Image } from "lucide-react"
import Link from "next/link"

export default function BrandingPage() {
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
              <Link href="/roadmap" className="text-muted-foreground hover:text-primary transition-colors">Roadmap</Link>
              <Link href="/branding" className="text-primary font-medium">Branding</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Brand Resources
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Omnior Brand Guidelines
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Download official logos, colors, and brand assets to use in your projects, presentations, and promotional materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download Brand Kit
              </Button>
              <Button variant="outline" size="lg">
                <FileText className="mr-2 h-5 w-5" />
                View Guidelines
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Assets */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Brand Assets</h2>
            
            <Tabs defaultValue="logo" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="logo">Logo</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="assets">Downloads</TabsTrigger>
              </TabsList>
              
              <TabsContent value="logo" className="mt-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Primary Logo</CardTitle>
                      <CardDescription>
                        The main Omnior logo for most use cases.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="w-32 h-32 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                        <img src="/logo.svg" alt="Omnior Logo" className="w-24 h-24 object-contain" />
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          SVG
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          PNG
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Logo Variations</CardTitle>
                      <CardDescription>
                        Different versions for various contexts.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8">
                              <img src="/logo.svg" alt="Omnior icon logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm">Icon Only</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8">
                              <img src="/logo.svg" alt="Omnior icon logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm">White Version</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8">
                              <img src="/logo.svg" alt="Omnior icon logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm">Horizontal</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Logo Usage Guidelines</CardTitle>
                    <CardDescription>
                      Important rules for using the Omnior logo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-green-600">Do's</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            <span>Use the logo in its original colors</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            <span>Maintain proper spacing around logo</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            <span>Use on light backgrounds when possible</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            <span>Scale proportionally</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-red-600">Don'ts</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                            <span>Don't modify the logo design</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                            <span>Don't stretch or distort</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                            <span>Don't use in low contrast situations</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                            <span>Don't combine with other logos</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="colors" className="mt-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Primary Colors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="w-full h-16 bg-primary rounded-lg"></div>
                          <div className="text-center">
                            <div className="font-semibold">Primary</div>
                            <div className="text-sm text-muted-foreground">#6366F1</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full h-16 bg-primary-foreground rounded-lg border"></div>
                          <div className="text-center">
                            <div className="font-semibold">Primary Foreground</div>
                            <div className="text-sm text-muted-foreground">#FFFFFF</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Secondary Colors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="w-full h-16 bg-secondary rounded-lg"></div>
                          <div className="text-center">
                            <div className="font-semibold">Secondary</div>
                            <div className="text-sm text-muted-foreground">#F1F5F9</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full h-16 bg-secondary-foreground rounded-lg border"></div>
                          <div className="text-center">
                            <div className="font-semibold">Secondary Foreground</div>
                            <div className="text-sm text-muted-foreground">#0F172A</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Accent Colors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="w-full h-16 bg-green-500 rounded-lg"></div>
                          <div className="text-center">
                            <div className="font-semibold">Success</div>
                            <div className="text-sm text-muted-foreground">#10B981</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full h-16 bg-blue-500 rounded-lg"></div>
                          <div className="text-center">
                            <div className="font-semibold">Info</div>
                            <div className="text-sm text-muted-foreground">#3B82F6</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Color Usage</CardTitle>
                    <CardDescription>
                      How to use colors in your designs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Primary Usage</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Main brand elements</li>
                          <li>• Call-to-action buttons</li>
                          <li>• Important highlights</li>
                          <li>• Navigation elements</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Secondary Usage</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Backgrounds and surfaces</li>
                          <li>• Secondary buttons</li>
                          <li>• Text and content</li>
                          <li>• Subtle elements</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="typography" className="mt-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Primary Font</CardTitle>
                      <CardDescription>
                        Geist - Modern, clean, and highly readable.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-3xl font-bold mb-2">Geist Bold</div>
                          <div className="text-sm text-muted-foreground">Headings, titles, emphasis</div>
                        </div>
                        <div>
                          <div className="text-xl font-semibold mb-2">Geist Semibold</div>
                          <div className="text-sm text-muted-foreground">Subheadings, highlights</div>
                        </div>
                        <div>
                          <div className="text-base mb-2">Geist Regular</div>
                          <div className="text-sm text-muted-foreground">Body text, content</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Font Scale</CardTitle>
                      <CardDescription>
                        Consistent typography hierarchy.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="border-l-4 border-primary pl-4">
                          <div className="text-4xl font-bold">Heading 1</div>
                          <div className="text-sm text-muted-foreground">48px - Hero titles</div>
                        </div>
                        <div className="border-l-4 border-primary/70 pl-4">
                          <div className="text-3xl font-bold">Heading 2</div>
                          <div className="text-sm text-muted-foreground">36px - Section titles</div>
                        </div>
                        <div className="border-l-4 border-primary/50 pl-4">
                          <div className="text-2xl font-bold">Heading 3</div>
                          <div className="text-sm text-muted-foreground">24px - Subsections</div>
                        </div>
                        <div className="border-l-4 border-primary/30 pl-4">
                          <div className="text-lg">Body Text</div>
                          <div className="text-sm text-muted-foreground">16px - Main content</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Typography Guidelines</CardTitle>
                    <CardDescription>
                      Best practices for text usage.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Readability</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Use proper line height (1.5x)</li>
                          <li>• Maintain contrast ratios</li>
                          <li>• Limit line length to 80 characters</li>
                          <li>• Use consistent spacing</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Hierarchy</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Clear visual distinction</li>
                          <li>• Consistent sizing</li>
                          <li>• Proper use of weight</li>
                          <li>• Logical structure</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assets" className="mt-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Logo Pack
                      </CardTitle>
                      <CardDescription>
                        Complete logo package with all variations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download (ZIP, 15MB)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Color Palette
                      </CardTitle>
                      <CardDescription>
                        Color swatches and hex values.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download (ASE, 2MB)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Brand Guidelines
                      </CardTitle>
                      <CardDescription>
                        Complete brand guidelines document.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download (PDF, 8MB)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Copy className="h-5 w-5" />
                        Presentation Template
                      </CardTitle>
                      <CardDescription>
                        Branded presentation template.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download (PPTX, 12MB)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Social Media Kit
                      </CardTitle>
                      <CardDescription>
                        Templates for social media posts.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download (ZIP, 25MB)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Complete Brand Kit
                      </CardTitle>
                      <CardDescription>
                        All brand assets in one package.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download (ZIP, 50MB)
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Usage Examples</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Approved Use Cases</CardTitle>
                  <CardDescription>
                    Examples of appropriate brand usage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>News articles and press releases</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Conference presentations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Educational materials</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Community events and meetups</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Partnership announcements</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prohibited Use Cases</CardTitle>
                  <CardDescription>
                    Examples of inappropriate brand usage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span>Product merchandise without permission</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span>Political campaigns or endorsements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span>Adult content or illegal activities</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span>Competing products or services</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span>Misleading or false representations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Questions About Brand Usage?</h2>
            <p className="text-lg opacity-90">
              If you have questions about using the Omnior brand or need special permissions, our team is here to help.
            </p>
            <Button size="lg" variant="secondary">
              Contact Brand Team
            </Button>
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