'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExtensionsManager from '@/components/extensions/extensions-manager'
import { 
  Settings, 
  Code, 
  Shield, 
  Download, 
  Users,
  ExternalLink,
  Github,
  X
} from 'lucide-react'

export default function ExtensionsPage() {
  const [showExtensionsManager, setShowExtensionsManager] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Extension Store Framework</h1>
              <p className="text-muted-foreground">
                Secure, sandboxed extension system with comprehensive management
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Github className="h-4 w-4 mr-2" />
                Source Code
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sandbox">Sandbox</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Extensions Manager */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Settings className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">Ready</Badge>
                    </div>
                    <CardTitle>Extensions Manager</CardTitle>
                    <CardDescription>
                      Complete UI for managing installed extensions with permissions and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Install/uninstall extensions</li>
                          <li>• Enable/disable extensions</li>
                          <li>• Permission management</li>
                          <li>• Extension settings panel</li>
                          <li>• Search and filtering</li>
                        </ul>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => setShowExtensionsManager(true)}
                      >
                        Open Extensions Manager
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Sandbox Loader */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Code className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">Ready</Badge>
                    </div>
                    <CardTitle>Sandbox Loader</CardTitle>
                    <CardDescription>
                      Secure isolated execution environment for third-party extensions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Isolated JavaScript execution</li>
                          <li>• Memory usage limits</li>
                          <li>• Execution time limits</li>
                          <li>• API permission checks</li>
                          <li>• Message-based IPC</li>
                        </ul>
                      </div>
                      <Button className="w-full" disabled>
                        View Sandbox Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Permissions Manager */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Shield className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">Ready</Badge>
                    </div>
                    <CardTitle>Permissions Manager</CardTitle>
                    <CardDescription>
                      Comprehensive permission system with user consent and history tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Permission request dialogs</li>
                          <li>• Auto-grant safe permissions</li>
                          <li>• Remember user decisions</li>
                          <li>• Permission history tracking</li>
                          <li>• Runtime permission checks</li>
                        </ul>
                      </div>
                      <Button className="w-full" disabled>
                        View Permissions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Update Mechanism */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Download className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">Ready</Badge>
                    </div>
                    <CardTitle>Update Mechanism</CardTitle>
                    <CardDescription>
                      Automatic extension updates with validation and rollback protection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Scheduled update checks</li>
                          <li>• Package validation</li>
                          <li>• Automatic rollback on failure</li>
                          <li>• Version comparison</li>
                          <li>• Update queuing</li>
                        </ul>
                      </div>
                      <Button className="w-full" disabled>
                        Check for Updates
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Extension Store */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Users className="h-8 w-8 text-primary" />
                      <Badge variant="outline">Planned</Badge>
                    </div>
                    <CardTitle>Extension Store</CardTitle>
                    <CardDescription>
                      Browse and install extensions from the Omnior extension marketplace
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Extension marketplace</li>
                          <li>• Categories and search</li>
                          <li>• Ratings and reviews</li>
                          <li>• Developer verification</li>
                          <li>• Installation statistics</li>
                        </ul>
                      </div>
                      <Button className="w-full" disabled>
                        Browse Store
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Developer Tools */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Code className="h-8 w-8 text-primary" />
                      <Badge variant="outline">Planned</Badge>
                    </div>
                    <CardTitle>Developer Tools</CardTitle>
                    <CardDescription>
                      Tools for extension developers including debugging and testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Extension debugger</li>
                          <li>• Performance profiling</li>
                          <li>• API documentation</li>
                          <li>• Test runner</li>
                          <li>• Package validator</li>
                        </ul>
                      </div>
                      <Button className="w-full" disabled>
                        Developer Portal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sandbox" className="mt-8">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Sandbox Security Features
                    </CardTitle>
                    <CardDescription>
                      Comprehensive security measures for extension isolation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Isolated Execution</div>
                          <div className="text-sm text-muted-foreground">
                            Extensions run in separate iframes with restricted access
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">API Restrictions</div>
                          <div className="text-sm text-muted-foreground">
                            Dangerous APIs blocked, safe APIs exposed via proxy
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Resource Limits</div>
                          <div className="text-sm text-muted-foreground">
                            Memory and execution time limits prevent abuse
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Message-Based IPC</div>
                          <div className="text-sm text-muted-foreground">
                            No shared memory, all communication via messages
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Content Security Policy</div>
                          <div className="text-sm text-muted-foreground">
                            Strict CSP prevents code injection and XSS attacks
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Sandbox Configuration
                    </CardTitle>
                    <CardDescription>
                      Configurable security policies and limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Memory Limit</div>
                          <div className="text-sm text-muted-foreground">50MB per extension</div>
                        </div>
                        <Badge variant="outline">Configurable</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Execution Timeout</div>
                          <div className="text-sm text-muted-foreground">5 seconds per operation</div>
                        </div>
                        <Badge variant="outline">Configurable</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Network Access</div>
                          <div className="text-sm text-muted-foreground">Restricted by default</div>
                        </div>
                        <Badge variant="outline">Permission-based</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Console Access</div>
                          <div className="text-sm text-muted-foreground">Safe logging only</div>
                        </div>
                        <Badge variant="outline">Filtered</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">DOM Access</div>
                          <div className="text-sm text-muted-foreground">Blocked by default</div>
                        </div>
                        <Badge variant="outline">API-gated</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-8">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Permission System
                    </CardTitle>
                    <CardDescription>
                      Granular permission control with user consent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Permission Requests</div>
                          <div className="text-sm text-muted-foreground">
                            User must approve dangerous permissions
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Auto-Grant Safe Permissions</div>
                          <div className="text-sm text-muted-foreground">
                            Safe permissions granted automatically
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Remember Decisions</div>
                          <div className="text-sm text-muted-foreground">
                            User choices remembered for future requests
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Runtime Checks</div>
                          <div className="text-sm text-muted-foreground">
                            Permissions verified before API calls
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Permission History</div>
                          <div className="text-sm text-muted-foreground">
                            Complete audit trail of all permission changes
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Permission Categories
                    </CardTitle>
                    <CardDescription>
                      Different permission types and their risk levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Safe Permissions</div>
                          <div className="text-sm text-muted-foreground">
                            storage, activeTab, alarms
                          </div>
                        </div>
                        <Badge variant="secondary">Auto-grant</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Medium Risk</div>
                          <div className="text-sm text-muted-foreground">
                            tabs, bookmarks, cookies
                          </div>
                        </div>
                        <Badge variant="outline">User approval</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">High Risk</div>
                          <div className="text-sm text-muted-foreground">
                            history, downloads, webRequest
                          </div>
                        </div>
                        <Badge variant="destructive">Strict review</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Dangerous</div>
                          <div className="text-sm text-muted-foreground">
                            debugger, proxy, nativeMessaging
                          </div>
                        </div>
                        <Badge variant="destructive">Blocked</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="updates" className="mt-8">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Update System
                    </CardTitle>
                    <CardDescription>
                      Automatic extension updates with safety guarantees
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Scheduled Checks</div>
                          <div className="text-sm text-muted-foreground">
                            Automatic update checks every 24 hours
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Package Validation</div>
                          <div className="text-sm text-muted-foreground">
                            Checksum verification and size validation
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Automatic Rollback</div>
                          <div className="text-sm text-muted-foreground">
                            Failed updates automatically rolled back
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Version Comparison</div>
                          <div className="text-sm text-muted-foreground">
                            Semantic versioning with downgrade protection
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Update Queuing</div>
                          <div className="text-sm text-muted-foreground">
                            Updates processed in controlled batches
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Update Configuration
                    </CardTitle>
                    <CardDescription>
                      Configurable update behavior and policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Auto-Update</div>
                          <div className="text-sm text-muted-foreground">Enabled by default</div>
                        </div>
                        <Badge variant="secondary">Configurable</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Check Interval</div>
                          <div className="text-sm text-muted-foreground">24 hours</div>
                        </div>
                        <Badge variant="outline">Adjustable</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Download Timeout</div>
                          <div className="text-sm text-muted-foreground">30 seconds</div>
                        </div>
                        <Badge variant="outline">Configurable</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Retry Attempts</div>
                          <div className="text-sm text-muted-foreground">3 attempts</div>
                        </div>
                        <Badge variant="outline">Configurable</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Backup Strategy</div>
                          <div className="text-sm text-muted-foreground">Before update</div>
                        </div>
                        <Badge variant="secondary">Automatic</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Extensions Manager Modal */}
      {showExtensionsManager && (
        <ExtensionsManager onClose={() => setShowExtensionsManager(false)} />
      )}
    </div>
  )
}