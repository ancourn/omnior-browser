"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Shield, 
  Database, 
  Clock, 
  Trash2, 
  Download,
  Upload
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClipboardSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function ClipboardSettings({ isOpen, onClose }: ClipboardSettingsProps) {
  const [settings, setSettings] = useState({
    maxItems: 100,
    autoDeleteDays: 30,
    encryptData: false,
    captureImages: true,
    captureCode: true,
    showNotifications: true,
    keyboardShortcut: "Ctrl+Shift+C"
  })
  
  const { toast } = useToast()

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const saveSettings = () => {
    // In a real app, this would save to localStorage or backend
    localStorage.setItem('clipboardSettings', JSON.stringify(settings))
    toast({
      title: "Settings saved",
      description: "Clipboard manager settings have been updated"
    })
    onClose()
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all clipboard data? This action cannot be undone.")) {
      // In a real app, this would clear the database
      toast({
        title: "Data cleared",
        description: "All clipboard data has been deleted"
      })
    }
  }

  const exportSettings = () => {
    const exportData = {
      settings,
      exported_at: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clipboard-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string)
          if (imported.settings) {
            setSettings(imported.settings)
            toast({
              title: "Settings imported",
              description: "Clipboard settings have been imported successfully"
            })
          }
        } catch (err) {
          toast({
            title: "Import failed",
            description: "Could not import settings file",
            variant: "destructive"
          })
        }
      }
      reader.readAsText(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Clipboard Settings</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxItems">Maximum Items</Label>
                  <Input
                    id="maxItems"
                    type="number"
                    value={settings.maxItems}
                    onChange={(e) => handleSettingChange('maxItems', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of items to store in clipboard history
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyboardShortcut">Keyboard Shortcut</Label>
                  <Input
                    id="keyboardShortcut"
                    value={settings.keyboardShortcut}
                    onChange={(e) => handleSettingChange('keyboardShortcut', e.target.value)}
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    Shortcut to open clipboard manager
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Auto-Delete Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Auto-Delete Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="autoDeleteDays">Auto-delete after (days)</Label>
                  <Input
                    id="autoDeleteDays"
                    type="number"
                    value={settings.autoDeleteDays}
                    onChange={(e) => handleSettingChange('autoDeleteDays', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically delete items older than specified days
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable auto-delete</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically delete old clipboard items
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoDeleteDays > 0}
                    onCheckedChange={(checked) => 
                      handleSettingChange('autoDeleteDays', checked ? 30 : 0)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Encrypt stored data</Label>
                    <p className="text-xs text-muted-foreground">
                      Encrypt clipboard data for additional security
                    </p>
                  </div>
                  <Switch
                    checked={settings.encryptData}
                    onCheckedChange={(checked) => 
                      handleSettingChange('encryptData', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Capture images</Label>
                    <p className="text-xs text-muted-foreground">
                      Store copied images in clipboard history
                    </p>
                  </div>
                  <Switch
                    checked={settings.captureImages}
                    onCheckedChange={(checked) => 
                      handleSettingChange('captureImages', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Capture code snippets</Label>
                    <p className="text-xs text-muted-foreground">
                      Store copied code snippets with syntax highlighting
                    </p>
                  </div>
                  <Switch
                    checked={settings.captureCode}
                    onCheckedChange={(checked) => 
                      handleSettingChange('captureCode', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Show notifications when items are copied
                    </p>
                  </div>
                  <Switch
                    checked={settings.showNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange('showNotifications', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-destructive">Danger Zone</Label>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={clearAllData}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Clipboard Data
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will permanently delete all stored clipboard items
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}