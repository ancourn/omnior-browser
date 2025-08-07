import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Palette, Type, Image, Download } from "lucide-react"

export default function BrandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Brand Guidelines
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">Omnior Brand Identity</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive guide to the Omnior browser brand identity, including logo usage, 
              color palette, typography, and visual style.
            </p>
          </div>
        </div>
      </section>

      {/* Brand Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Brand Overview</h2>
              <p className="text-lg text-muted-foreground">
                Understanding the essence of the Omnior brand
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Name & Meaning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Omnior</h4>
                    <p className="text-sm text-muted-foreground">
                      "Omni" (all, universal) + "Or" (light, origin)
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Numerology</h4>
                    <p className="text-sm text-muted-foreground">
                      Total = 8 (power, authority)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Brand Personality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="secondary">Innovative</Badge>
                    <Badge variant="secondary">Secure</Badge>
                    <Badge variant="secondary">Fast</Badge>
                    <Badge variant="secondary">Intelligent</Badge>
                    <Badge variant="secondary">Open</Badge>
                    <Badge variant="secondary">Modern</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Logo & Mark</h2>
              <p className="text-lg text-muted-foreground">
                The visual representation of the Omnior brand
              </p>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" alt="" />
                  Primary Logo
                </CardTitle>
                <CardDescription>
                  The main logo to be used in most applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center items-center py-12 bg-background rounded-lg">
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      OMNIOR
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Primary Logotype
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <div className="text-2xl font-bold mb-2">OMNIOR</div>
                    <p className="text-xs text-muted-foreground">Large Scale</p>
                  </div>
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <div className="text-lg font-bold mb-2">OMNIOR</div>
                    <p className="text-xs text-muted-foreground">Medium Scale</p>
                  </div>
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <div className="text-sm font-bold mb-2">OMNIOR</div>
                    <p className="text-xs text-muted-foreground">Small Scale</p>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download SVG
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Logo Usage Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Do's</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        Use adequate clear space around the logo
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        Use the logo on light backgrounds
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        Maintain aspect ratio
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        Use high-resolution versions
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">Don'ts</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">✗</span>
                        Stretch or distort the logo
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">✗</span>
                        Change colors or add effects
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">✗</span>
                        Use on busy backgrounds
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">✗</span>
                        Rotate or angle the logo
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Color Palette</h2>
              <p className="text-lg text-muted-foreground">
                The official colors that represent the Omnior brand
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="h-24 bg-primary rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold">Primary</h4>
                    <p className="text-sm text-muted-foreground">
                      Main brand color
                    </p>
                    <div className="text-xs font-mono">
                      #3B82F6
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="h-24 bg-primary/80 rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold">Primary Light</h4>
                    <p className="text-sm text-muted-foreground">
                      Secondary brand color
                    </p>
                    <div className="text-xs font-mono">
                      #60A5FA
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="h-24 bg-primary/20 rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold">Primary Pale</h4>
                    <p className="text-sm text-muted-foreground">
                      Background accents
                    </p>
                    <div className="text-xs font-mono">
                      #DBEAFE
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="h-24 bg-background border border-border/50 rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold">Background</h4>
                    <p className="text-sm text-muted-foreground">
                      Main background
                    </p>
                    <div className="text-xs font-mono">
                      #FFFFFF
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="h-24 bg-muted rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold">Muted</h4>
                    <p className="text-sm text-muted-foreground">
                      Subtle backgrounds
                    </p>
                    <div className="text-xs font-mono">
                      #F3F4F6
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="h-24 bg-foreground rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold text-background">Foreground</h4>
                    <p className="text-sm text-background">
                      Main text color
                    </p>
                    <div className="text-xs font-mono text-background">
                      #111827
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Typography</h2>
              <p className="text-lg text-muted-foreground">
                The fonts and typography that define our brand voice
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Primary Font</CardTitle>
                  <CardDescription>
                    Sleek sans-serif for headlines and important text
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold">Inter</div>
                    <div className="text-2xl font-semibold">Bold Weight</div>
                    <div className="text-lg font-medium">Medium Weight</div>
                    <div className="text-base font-normal">Regular Weight</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Modern, clean, and highly readable. Perfect for digital interfaces.
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Accent Font</CardTitle>
                  <CardDescription>
                    Geometric font for special emphasis and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-geometric)' }}>
                      Geometric
                    </div>
                    <div className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-geometric)' }}>
                      Display Style
                    </div>
                    <div className="text-lg font-medium" style={{ fontFamily: 'var(--font-geometric)' }}>
                      Headline Use
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Used for logos, special headings, and brand elements.
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Typography Scale</CardTitle>
                <CardDescription>
                  Consistent sizing hierarchy across all applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold">Heading 1</span>
                    <span className="text-sm text-muted-foreground">2.5rem / 40px</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">Heading 2</span>
                    <span className="text-sm text-muted-foreground">2rem / 32px</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">Heading 3</span>
                    <span className="text-sm text-muted-foreground">1.5rem / 24px</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-semibold">Heading 4</span>
                    <span className="text-sm text-muted-foreground">1.25rem / 20px</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Heading 5</span>
                    <span className="text-sm text-muted-foreground">1.125rem / 18px</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base">Body Text</span>
                    <span className="text-sm text-muted-foreground">1rem / 16px</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Small Text</span>
                    <span className="text-sm text-muted-foreground">0.875rem / 14px</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Brand in Action</h2>
              <p className="text-lg text-muted-foreground">
                Examples of how the brand identity comes together
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Digital Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Website and web applications</li>
                    <li>• Mobile app interfaces</li>
                    <li>• Desktop application UI</li>
                    <li>• Email signatures</li>
                    <li>• Social media profiles</li>
                    <li>• Digital presentations</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Print Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Business cards</li>
                    <li>• Letterheads and envelopes</li>
                    <li>• Brochures and flyers</li>
                    <li>• Conference materials</li>
                    <li>• Merchandise and apparel</li>
                    <li>• Documentation covers</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}