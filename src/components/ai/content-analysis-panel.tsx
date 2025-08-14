"use client"

import React, { useState, useCallback } from 'react'
import { 
  Brain, 
  FileText, 
  Hash, 
  Smile, 
  Users, 
  MapPin, 
  TrendingUp,
  Quote,
  Lightbulb,
  Download,
  Copy,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { 
  ContentAnalysisRequest, 
  ContentAnalysisResult 
} from '@/lib/ai/ai-content-analysis-service'

interface ContentAnalysisPanelProps {
  initialContent?: string
  onAnalysisComplete?: (result: ContentAnalysisResult) => void
}

export function ContentAnalysisPanel({ 
  initialContent = '', 
  onAnalysisComplete 
}: ContentAnalysisPanelProps) {
  const [content, setContent] = useState(initialContent)
  const [analysisType, setAnalysisType] = useState<ContentAnalysisRequest['analysisType']>('summarize')
  const [contentType, setContentType] = useState<ContentAnalysisRequest['type']>('text')
  const [maxLength, setMaxLength] = useState<number>(200)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [extractQuotes, setExtractQuotes] = useState(false)
  const [identifyTrends, setIdentifyTrends] = useState(false)
  const [result, setResult] = useState<ContentAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const { toast } = useToast()

  const handleAnalyze = useCallback(async () => {
    if (!content.trim()) {
      toast({
        title: "No content",
        description: "Please enter some content to analyze.",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setProgress(0)
    setResult(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const request: ContentAnalysisRequest = {
        content,
        type: contentType,
        analysisType,
        options: {
          maxLength,
          includeMetadata,
          extractQuotes,
          identifyTrends
        }
      }

      const response = await fetch('/api/ai/content-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const analysisResult: ContentAnalysisResult = await response.json()
      setResult(analysisResult)
      
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult)
      }

      toast({
        title: "Analysis complete",
        description: "Content has been successfully analyzed.",
      })
    } catch (error) {
      console.error('Analysis failed:', error)
      toast({
        title: "Analysis failed",
        description: "Failed to analyze content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [content, contentType, analysisType, maxLength, includeMetadata, extractQuotes, identifyTrends, toast, onAnalysisComplete])

  const handleCopyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      })
    }
  }, [toast])

  const handleDownloadResult = useCallback(() => {
    if (!result) return

    const dataStr = JSON.stringify(result, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `content-analysis-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [result])

  const getAnalysisTypeIcon = (type: ContentAnalysisRequest['analysisType']) => {
    switch (type) {
      case 'summarize':
        return <FileText className="h-4 w-4" />
      case 'extract-keywords':
        return <Hash className="h-4 w-4" />
      case 'sentiment':
        return <Smile className="h-4 w-4" />
      case 'topics':
        return <TrendingUp className="h-4 w-4" />
      case 'entities':
        return <Users className="h-4 w-4" />
      case 'comprehensive':
        return <Brain className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600'
    if (sentiment < -0.3) return 'text-red-600'
    return 'text-yellow-600'
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Positive'
    if (sentiment < -0.3) return 'Negative'
    return 'Neutral'
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Content Analysis
          </CardTitle>
          <CardDescription>
            Analyze text content with AI-powered insights, summarization, and extraction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Content to Analyze</label>
            <Textarea
              placeholder="Enter text, article content, or any text you want to analyze..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          {/* Analysis Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Content Type</label>
              <Select value={contentType} onValueChange={(value: ContentAnalysisRequest['type']) => setContentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">General Text</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="webpage">Web Page</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Analysis Type</label>
              <Select value={analysisType} onValueChange={(value: ContentAnalysisRequest['analysisType']) => setAnalysisType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summarize">Summarize</SelectItem>
                  <SelectItem value="extract-keywords">Extract Keywords</SelectItem>
                  <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                  <SelectItem value="topics">Topic Analysis</SelectItem>
                  <SelectItem value="entities">Entity Extraction</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Max Summary Length</label>
              <Select value={maxLength.toString()} onValueChange={(value) => setMaxLength(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 words</SelectItem>
                  <SelectItem value="200">200 words</SelectItem>
                  <SelectItem value="300">300 words</SelectItem>
                  <SelectItem value="500">500 words</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Advanced Options</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include Metadata</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extractQuotes}
                  onChange={(e) => setExtractQuotes(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Extract Quotes</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={identifyTrends}
                  onChange={(e) => setIdentifyTrends(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Identify Trends</span>
              </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !content.trim()}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  {getAnalysisTypeIcon(analysisType)}
                  Analyze Content
                </>
              )}
            </Button>
            
            {result && (
              <Button 
                variant="outline" 
                onClick={handleDownloadResult}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>

          {/* Progress */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing content...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                  <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="entities">Entities</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  {result.summary && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Summary</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyToClipboard(result.summary!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed">{result.summary}</p>
                    </div>
                  )}

                  {result.quotes && result.quotes.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Quote className="h-4 w-4" />
                        Notable Quotes
                      </h3>
                      <div className="space-y-2">
                        {result.quotes.map((quote, index) => (
                          <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-sm italic">"{quote.text}"</p>
                            {quote.context && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Context: {quote.context}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="keywords" className="space-y-4">
                  {result.keywords && result.keywords.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-medium">Key Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No keywords extracted from this content.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="sentiment" className="space-y-4">
                  {result.sentiment ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <h3 className="font-medium">Sentiment Analysis</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-medium ${getSentimentColor(result.sentiment.score)}`}>
                              {getSentimentLabel(result.sentiment.score)}
                            </span>
                            <Badge variant="outline">
                              {Math.round(result.sentiment.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Negative</span>
                            <span>Positive</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                              style={{ 
                                width: '100%',
                                backgroundPosition: `${((result.sentiment.score + 1) / 2) * 100}% center`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No sentiment analysis available for this content.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="topics" className="space-y-4">
                  {result.topics && result.topics.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-medium">Main Topics</h3>
                      <div className="space-y-2">
                        {result.topics.map((topic, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No topics identified in this content.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="entities" className="space-y-4">
                  {result.entities && result.entities.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium">Named Entities</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.entities.map((entity, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              {entity.type === 'person' && <Users className="h-4 w-4 text-blue-600" />}
                              {entity.type === 'organization' && <Brain className="h-4 w-4 text-purple-600" />}
                              {entity.type === 'location' && <MapPin className="h-4 w-4 text-green-600" />}
                              <span className="font-medium text-sm">{entity.text}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {entity.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(entity.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No named entities found in this content.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4">
                  {result.metadata ? (
                    <div className="space-y-4">
                      <h3 className="font-medium">Content Metadata</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Word Count</span>
                            <span className="font-medium">{result.metadata.wordCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Reading Time</span>
                            <span className="font-medium">{result.metadata.readingTime} min</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Complexity</span>
                            <Badge variant="outline">{result.metadata.complexity}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Language</span>
                            <span className="font-medium">{result.metadata.language}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No metadata available for this content.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {result.error || 'Analysis failed. Please try again.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}