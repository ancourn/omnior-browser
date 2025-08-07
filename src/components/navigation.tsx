"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Menu, Github, ExternalLink } from "lucide-react"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Branding", href: "/branding" },
  { name: "Contribute", href: "/contribute" },
  { name: "Developers", href: "/developers" },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Omnior
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* GitHub Link */}
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/ancourn/omnior-browser"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>

            {/* Mobile Navigation */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-sm font-medium transition-colors hover:text-primary py-2 ${
                        pathname === item.href
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Separator />
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <a
                      href="https://github.com/ancourn/omnior-browser"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Github className="h-4 w-4" />
                      GitHub Repository
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}