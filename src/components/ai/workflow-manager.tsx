/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Settings, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  Search,
  FileText,
  Code,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { workflowAutomationService, type Workflow, type WorkflowExecution, type WorkflowTemplate } from '@/lib/ai/workflow-automation-service'

interface WorkflowManagerProps {
  onClose?: () => void
}

export function WorkflowManager({ onClose }: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [activeTab, setActiveTab] = useState('workflows')
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  useEffect(() => {
    // Load data
    setTemplates(workflowAutomationService.getTemplates())
    
    // Set up progress listener
    const handleProgress = (execution: WorkflowExecution) => {
      setExecutions(prev => {
        const existing = prev.find(e => e.id === execution.id)
        if (existing) {
          return prev.map(e => e.id === execution.id ? execution : e)
        }
        return [...prev, execution]
      })
    }
    
    // Listen to all active executions
    workflowAutomationService.getActiveExecutions().forEach(execution => {
      workflowAutomationService.onProgress(execution.id, handleProgress)
    })
    
    return () => {
      // Cleanup listeners
      executions.forEach(execution => {
        workflowAutomationService.offProgress(execution.id)
      })
    }
  }, [executions])

  const handleCreateWorkflow = (templateId: string) => {
    try {
      const workflow = workflowAutomationService.createWorkflowFromTemplate(templateId)
      workflowAutomationService.registerWorkflow(workflow)
      setWorkflows(prev => [...prev, workflow])
      setSelectedWorkflow(workflow)
    } catch (error: any) {
      console.error('Failed to create workflow:', error)
    }
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      const execution = await workflowAutomationService.executeWorkflow(workflowId)
      setExecutions(prev => [...prev, execution])
      
      // Listen to progress
      workflowAutomationService.onProgress(execution.id, (updatedExecution) => {
        setExecutions(prev => 
          prev.map(e => e.id === execution.id ? updatedExecution : e)
        )
      })
    } catch (error: any) {
      console.error('Failed to execute workflow:', error)
    }
  }

  const handleCancelExecution = (executionId: string) => {
    workflowAutomationService.cancelExecution(executionId)
    setExecutions(prev => 
      prev.map(e => e.id === executionId ? { ...e, status: 'cancelled' as const } : e)
    )
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    workflowAutomationService.deleteWorkflow(workflowId)
    setWorkflows(prev => prev.filter(w => w.id !== workflowId))
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null)
    }
  }

  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'research':
        return <Search className="h-5 w-5" />
      case 'content':
        return <FileText className="h-5 w-5" />
      case 'development':
        return <Code className="h-5 w-5" />
      case 'productivity':
        return <Zap className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Workflow Automation
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage AI-powered workflows
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflow List */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>My Workflows</span>
                    <Button size="sm" onClick={() => setActiveTab('templates')}>
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Active workflows and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {workflows.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          No workflows yet
                        </p>
                        <Button onClick={() => setActiveTab('templates')}>
                          Create your first workflow
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {workflows.map((workflow) => (
                          <div
                            key={workflow.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedWorkflow?.id === workflow.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{workflow.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                                  {workflow.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">
                                  v{workflow.version}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              {workflow.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {workflow.steps.length} steps
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {workflow.triggers.length} triggers
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleExecuteWorkflow(workflow.id)
                                  }}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteWorkflow(workflow.id)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Workflow Details */}
            <div>
              {selectedWorkflow ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedWorkflow.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedWorkflow.isActive ? 'default' : 'secondary'}>
                          {selectedWorkflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleExecuteWorkflow(selectedWorkflow.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {selectedWorkflow.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {/* Steps */}
                        <div>
                          <h4 className="font-medium mb-2">Steps</h4>
                          <div className="space-y-2">
                            {selectedWorkflow.steps.map((step, index) => (
                              <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="flex items-center justify-center w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm">{step.name}</h5>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {step.description}
                                  </p>
                                  {step.dependsOn && step.dependsOn.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      Depends on: {step.dependsOn.join(', ')}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {step.actionId}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Triggers */}
                        <div>
                          <h4 className="font-medium mb-2">Triggers</h4>
                          <div className="space-y-2">
                            {selectedWorkflow.triggers.map((trigger) => (
                              <div key={trigger.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="flex items-center justify-center w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full">
                                  {trigger.type === 'manual' && <Play className="h-3 w-3" />}
                                  {trigger.type === 'schedule' && <Clock className="h-3 w-3" />}
                                  {trigger.type === 'event' && <Zap className="h-3 w-3" />}
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm capitalize">{trigger.type}</h5>
                                  {trigger.schedule && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                      Schedule: {trigger.schedule}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div>
                          <h4 className="font-medium mb-2">Metadata</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-600 dark:text-slate-400">Created:</span>
                              <span className="ml-2">{formatTimestamp(selectedWorkflow.createdAt)}</span>
                            </div>
                            <div>
                              <span className="text-slate-600 dark:text-slate-400">Updated:</span>
                              <span className="ml-2">{formatTimestamp(selectedWorkflow.updatedAt)}</span>
                            </div>
                            {selectedWorkflow.timeout && (
                              <div>
                                <span className="text-slate-600 dark:text-slate-400">Timeout:</span>
                                <span className="ml-2">{Math.round(selectedWorkflow.timeout / 1000)}s</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Select a workflow to view details
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      {getTemplateIcon(template.category)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>{template.workflow.steps.length} steps</span>
                      <span>~{formatDuration(template.estimatedDuration)}</span>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={() => handleCreateWorkflow(template.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create Workflow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Monitor workflow execution status and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {executions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No executions yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {executions
                      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
                      .map((execution) => {
                        const workflow = workflows.find(w => w.id === execution.workflowId)
                        
                        return (
                          <div key={execution.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(execution.status)}
                                <div>
                                  <h3 className="font-medium">
                                    {workflow?.name || 'Unknown Workflow'}
                                  </h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {formatTimestamp(execution.startTime)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  execution.status === 'completed' ? 'default' :
                                  execution.status === 'failed' ? 'destructive' :
                                  execution.status === 'running' ? 'default' : 'secondary'
                                }>
                                  {execution.status}
                                </Badge>
                                {execution.status === 'running' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCancelExecution(execution.id)}
                                  >
                                    <Square className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {execution.progress > 0 && execution.progress < 100 && (
                              <div className="mt-2">
                                <Progress value={execution.progress} className="h-2" />
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                  {execution.progress}% complete
                                </p>
                              </div>
                            )}
                            
                            {execution.error && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-sm text-red-600 dark:text-red-400">
                                {execution.error}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}