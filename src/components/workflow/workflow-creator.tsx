"use client"

import { useState } from "react"
import { Brain, Zap, Save, Play, Trash2, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'action' | 'condition' | 'loop' | 'delay' | 'parallel'
  config: Record<string, any>
  nextSteps: string[]
  condition?: string
}

interface Workflow {
  name: string
  description: string
  trigger: {
    type: 'manual' | 'schedule' | 'event' | 'webhook'
    config: Record<string, any>
  }
  steps: WorkflowStep[]
  variables: Record<string, any>
}

interface WorkflowCreatorProps {
  onSave?: (workflow: Workflow) => void
  onExecute?: (workflow: Workflow) => void
  initialWorkflow?: Partial<Workflow>
}

export function WorkflowCreator({ onSave, onExecute, initialWorkflow }: WorkflowCreatorProps) {
  const [workflow, setWorkflow] = useState<Workflow>({
    name: initialWorkflow?.name || '',
    description: initialWorkflow?.description || '',
    trigger: initialWorkflow?.trigger || { type: 'manual', config: {} },
    steps: initialWorkflow?.steps || [],
    variables: initialWorkflow?.variables || {}
  })

  const [aiDescription, setAiDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)

  const stepTypes = [
    { value: 'action', label: 'Action', icon: '⚡' },
    { value: 'condition', label: 'Condition', icon: '🔀' },
    { value: 'delay', label: 'Delay', icon: '⏱️' },
    { value: 'loop', label: 'Loop', icon: '🔄' },
    { value: 'parallel', label: 'Parallel', icon: '⚡' }
  ]

  const triggerTypes = [
    { value: 'manual', label: 'Manual Trigger' },
    { value: 'schedule', label: 'Scheduled' },
    { value: 'event', label: 'Event-based' },
    { value: 'webhook', label: 'Webhook' }
  ]

  const actionTypes = [
    'web-search', 'extract-data', 'create-notes', 'send-email', 'analyze-sentiment',
    'create-workflow', 'privacy-scan', 'anonymize-data', 'generate-report'
  ]

  const generateWorkflowFromAI = async () => {
    if (!aiDescription.trim()) return

    setIsGenerating(true)
    try {
      // Simulate AI generation (in real app, this would call the workflow service)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const generatedSteps: WorkflowStep[] = [
        {
          id: 'step_1',
          name: 'Search for Information',
          description: 'Search the web for relevant information',
          type: 'action',
          config: { actionType: 'web-search', query: aiDescription },
          nextSteps: ['step_2']
        },
        {
          id: 'step_2',
          name: 'Extract Key Data',
          description: 'Extract structured data from search results',
          type: 'action',
          config: { actionType: 'extract-data' },
          nextSteps: ['step_3']
        },
        {
          id: 'step_3',
          name: 'Create Summary Report',
          description: 'Generate a comprehensive summary report',
          type: 'action',
          config: { actionType: 'generate-report' },
          nextSteps: []
        }
      ]

      setWorkflow(prev => ({
        ...prev,
        steps: generatedSteps,
        name: prev.name || `AI Generated Workflow - ${new Date().toLocaleDateString()}`,
        description: prev.description || `Automatically generated workflow: ${aiDescription}`
      }))
    } catch (error) {
      console.error('Failed to generate workflow:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step_${workflow.steps.length + 1}`,
      name: `New ${type} Step`,
      description: `Description for ${type} step`,
      type,
      config: {},
      nextSteps: []
    }

    setWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }))
  }

  const removeStep = (stepId: string) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }))
    if (selectedStep === stepId) {
      setSelectedStep(null)
    }
  }

  const updateTrigger = (field: string, value: any) => {
    setWorkflow(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    onSave?.(workflow)
  }

  const handleExecute = () => {
    onExecute?.(workflow)
  }

  const selectedStepData = workflow.steps.find(step => step.id === selectedStep)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Workflow Creator
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Design and automate your workflows with AI assistance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!workflow.name}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleExecute} disabled={!workflow.name || workflow.steps.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            Execute
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="ai-assist">AI Assist</TabsTrigger>
          <TabsTrigger value="steps">Workflow Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Define the basic properties of your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Workflow Name</label>
                <Input
                  value={workflow.name}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter workflow name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={workflow.description}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Trigger Type</label>
                <Select 
                  value={workflow.trigger.type} 
                  onValueChange={(value) => updateTrigger('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {workflow.trigger.type === 'schedule' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Schedule</label>
                  <Input
                    placeholder="e.g., 0 9 * * * (9 AM daily)"
                    onChange={(e) => updateTrigger('config', { ...workflow.trigger.config, schedule: e.target.value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-assist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Workflow Generation
              </CardTitle>
              <CardDescription>
                Describe what you want to automate and let AI create the workflow for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Describe your workflow in natural language
                </label>
                <Textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="e.g., I want to monitor social media for mentions of my brand, analyze sentiment, and send me a daily report"
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={generateWorkflowFromAI}
                disabled={isGenerating || !aiDescription.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Generating Workflow...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Workflow with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Steps List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Workflow Steps</span>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Add and organize workflow steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {workflow.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedStep === step.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedStep(step.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm">
                                  {stepTypes.find(t => t.value === step.type)?.icon}
                                </span>
                                <span className="font-medium text-sm">{step.name}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {step.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeStep(step.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {workflow.steps.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <p className="text-sm">No steps added yet</p>
                          <p className="text-xs mt-1">Add steps to build your workflow</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="mt-4">
                    <Select onValueChange={(value) => addStep(value as WorkflowStep['type'])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add step type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {stepTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step Editor */}
            <div className="lg:col-span-2">
              {selectedStepData ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Edit Step
                    </CardTitle>
                    <CardDescription>
                      Configure the selected workflow step
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Step Name</label>
                      <Input
                        value={selectedStepData.name}
                        onChange={(e) => updateStep(selectedStepData.id, { name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea
                        value={selectedStepData.description}
                        onChange={(e) => updateStep(selectedStepData.id, { description: e.target.value })}
                        rows={2}
                      />
                    </div>

                    {selectedStepData.type === 'action' && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Action Type</label>
                        <Select 
                          value={selectedStepData.config.actionType || ''}
                          onValueChange={(value) => updateStep(selectedStepData.id, { 
                            config: { ...selectedStepData.config, actionType: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select action type" />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTypes.map(action => (
                              <SelectItem key={action} value={action}>
                                {action.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedStepData.type === 'delay' && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Duration (ms)</label>
                        <Input
                          type="number"
                          value={selectedStepData.config.duration || ''}
                          onChange={(e) => updateStep(selectedStepData.id, { 
                            config: { ...selectedStepData.config, duration: parseInt(e.target.value) || 1000 }
                          })}
                        />
                      </div>
                    )}

                    {selectedStepData.type === 'condition' && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Condition</label>
                        <Textarea
                          value={selectedStepData.condition || ''}
                          onChange={(e) => updateStep(selectedStepData.id, { condition: e.target.value })}
                          placeholder="e.g., ${results.step_1.success} === true"
                          rows={2}
                        />
                      </div>
                    )}

                    <Separator />

                    <div>
                      <label className="text-sm font-medium mb-2 block">Next Steps</label>
                      <div className="space-y-2">
                        {workflow.steps
                          .filter(step => step.id !== selectedStepData.id)
                          .map(step => (
                            <label key={step.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedStepData.nextSteps.includes(step.id)}
                                onChange={(e) => {
                                  const nextSteps = e.target.checked
                                    ? [...selectedStepData.nextSteps, step.id]
                                    : selectedStepData.nextSteps.filter(id => id !== step.id)
                                  updateStep(selectedStepData.id, { nextSteps })
                                }}
                              />
                              <span className="text-sm">{step.name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        Select a Step to Edit
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Choose a step from the list to configure its properties
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}