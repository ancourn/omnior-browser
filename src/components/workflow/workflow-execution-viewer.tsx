"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Square, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  currentStepId?: string
  variables: Record<string, any>
  results: Record<string, any>
  error?: string
  startedAt: Date
  completedAt?: Date
  triggerData?: Record<string, any>
}

interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'action' | 'condition' | 'loop' | 'delay' | 'parallel'
  config: Record<string, any>
  nextSteps: string[]
  condition?: string
}

interface WorkflowExecutionViewerProps {
  execution: WorkflowExecution
  workflowSteps: WorkflowStep[]
  onCancel?: (executionId: string) => void
  onRetry?: (executionId: string) => void
}

export function WorkflowExecutionViewer({ 
  execution, 
  workflowSteps, 
  onCancel, 
  onRetry 
}: WorkflowExecutionViewerProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  const [executionTime, setExecutionTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (execution.status === 'running') {
      interval = setInterval(() => {
        const now = new Date().getTime()
        const start = new Date(execution.startedAt).getTime()
        setExecutionTime(Math.floor((now - start) / 1000))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [execution.status, execution.startedAt])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStepStatus = (stepId: string) => {
    const result = execution.results[stepId]
    if (result) {
      return result.success ? 'completed' : 'failed'
    }
    
    if (execution.currentStepId === stepId && execution.status === 'running') {
      return 'running'
    }
    
    // Check if step is after current step
    const currentStepIndex = workflowSteps.findIndex(s => s.id === execution.currentStepId)
    const stepIndex = workflowSteps.findIndex(s => s.id === stepId)
    
    if (currentStepIndex >= 0 && stepIndex > currentStepIndex) {
      return 'pending'
    }
    
    return 'pending'
  }

  const toggleResultExpansion = (stepId: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepId)) {
        newSet.delete(stepId)
      } else {
        newSet.add(stepId)
      }
      return newSet
    })
  }

  const calculateProgress = () => {
    const totalSteps = workflowSteps.length
    const completedSteps = Object.keys(execution.results).length
    
    if (totalSteps === 0) return 0
    return Math.round((completedSteps / totalSteps) * 100)
  }

  const completedSteps = Object.keys(execution.results).filter(stepId => 
    execution.results[stepId]?.success
  ).length

  const failedSteps = Object.keys(execution.results).filter(stepId => 
    !execution.results[stepId]?.success
  ).length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(execution.status)}
              <div>
                <CardTitle>Workflow Execution</CardTitle>
                <CardDescription>
                  ID: {execution.id}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(execution.status)}>
                {execution.status.toUpperCase()}
              </Badge>
              {execution.status === 'running' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onCancel?.(execution.id)}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
              {execution.status === 'failed' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onRetry?.(execution.id)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {calculateProgress()}% ({completedSteps}/{workflowSteps.length} steps)
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{executionTime}s</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedSteps}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600">{workflowSteps.length}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Total Steps</div>
            </div>
          </div>

          {/* Error Display */}
          {execution.error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800 dark:text-red-200">Error</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">{execution.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Steps</CardTitle>
          <CardDescription>
            Real-time execution of workflow steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {workflowSteps.map((step, index) => {
                const stepStatus = getStepStatus(step.id)
                const result = execution.results[step.id]
                const isExpanded = expandedResults.has(step.id)
                const isCurrentStep = execution.currentStepId === step.id

                return (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {stepStatus === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {stepStatus === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                          {stepStatus === 'running' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                          {stepStatus === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{step.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {step.type}
                            </Badge>
                            {isCurrentStep && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {step.description}
                          </p>
                          
                          {result && (
                            <div className="space-y-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleResultExpansion(step.id)}
                                className="text-xs"
                              >
                                {isExpanded ? 'Hide Details' : 'Show Details'}
                              </Button>
                              
                              {isExpanded && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                  <div className="text-xs font-medium mb-2">Step Result:</div>
                                  <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-500">
                        Step {index + 1}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Variables and Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>
              Workflow execution variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {Object.keys(execution.variables).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(execution.variables).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium">{key}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No variables set</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Trigger Data */}
        {execution.triggerData && Object.keys(execution.triggerData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trigger Data</CardTitle>
              <CardDescription>
                Data that triggered this execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {Object.entries(execution.triggerData).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium">{key}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}