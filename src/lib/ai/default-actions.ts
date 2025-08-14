import { aiActionRegistry } from './ai-actions-service'
import ZAI from 'z-ai-web-dev-sdk'

// Search Actions
const searchActions = [
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for information',
    category: 'search' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const searchResult = await zai.functions.invoke("web_search", {
          query: context.query,
          num: 5
        })

        return {
          success: true,
          data: searchResult,
          suggestedActions: ['summarize-results', 'extract-key-points']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Search failed'
        }
      }
    }
  },
  {
    id: 'summarize-page',
    name: 'Summarize Page',
    description: 'Create a concise summary of the current page content',
    category: 'search' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const prompt = `Please provide a concise summary of the following content:\n\n${context.selectedText || context.query}`
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates concise, informative summaries.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 300
        })

        const summary = completion.choices[0]?.message?.content || 'Unable to generate summary'
        
        return {
          success: true,
          data: { summary },
          suggestedActions: ['extract-key-points', 'create-notes']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Summarization failed'
        }
      }
    }
  }
]

// Automation Actions
const automationActions = [
  {
    id: 'create-workflow',
    name: 'Create Workflow',
    description: 'Create an automated workflow based on your requirements',
    category: 'automation' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const prompt = `Based on the following request, create a step-by-step workflow automation plan:\n\nRequest: ${context.query}\n\nPlease provide a detailed workflow with steps, triggers, and actions.`
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an automation expert that creates detailed workflow plans.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })

        const workflow = completion.choices[0]?.message?.content || 'Unable to create workflow'
        
        return {
          success: true,
          data: { workflow },
          suggestedActions: ['save-workflow', 'test-workflow']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Workflow creation failed'
        }
      }
    }
  },
  {
    id: 'batch-process',
    name: 'Batch Process',
    description: 'Process multiple items or URLs simultaneously',
    category: 'automation' as const,
    handler: async (context: any) => {
      // This would typically parse URLs or items from the context
      const items = context.metadata?.items || []
      
      return {
        success: true,
        data: { 
          message: `Batch processing initiated for ${items.length} items`,
          itemsProcessed: 0,
          totalItems: items.length
        },
        suggestedActions: ['monitor-progress', 'export-results']
      }
    }
  }
]

// Analysis Actions
const analysisActions = [
  {
    id: 'analyze-sentiment',
    name: 'Analyze Sentiment',
    description: 'Analyze the sentiment and emotional tone of text',
    category: 'analysis' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const text = context.selectedText || context.query
        
        const prompt = `Analyze the sentiment and emotional tone of the following text. Provide a detailed analysis including:\n1. Overall sentiment (positive, negative, neutral)\n2. Emotional indicators\n3. Key phrases that contribute to the sentiment\n4. Confidence level\n\nText: "${text}"`
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a sentiment analysis expert that provides detailed emotional analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 400
        })

        const analysis = completion.choices[0]?.message?.content || 'Unable to analyze sentiment'
        
        return {
          success: true,
          data: { analysis },
          suggestedActions: ['extract-key-phrases', 'create-report']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Sentiment analysis failed'
        }
      }
    }
  },
  {
    id: 'extract-data',
    name: 'Extract Data',
    description: 'Extract structured data from unstructured text',
    category: 'analysis' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const text = context.selectedText || context.query
        
        const prompt = `Extract structured data from the following text. Identify and organize:\n1. Names and entities\n2. Dates and numbers\n3. Key facts and figures\n4. Categories and classifications\n\nPresent the extracted data in a structured format.\n\nText: "${text}"`
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a data extraction expert that identifies and structures information from unstructured text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        })

        const extractedData = completion.choices[0]?.message?.content || 'Unable to extract data'
        
        return {
          success: true,
          data: { extractedData },
          suggestedActions: ['export-to-csv', 'create-chart']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Data extraction failed'
        }
      }
    }
  }
]

// Productivity Actions
const productivityActions = [
  {
    id: 'create-notes',
    name: 'Create Notes',
    description: 'Create organized notes from content',
    category: 'productivity' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const content = context.selectedText || context.query
        
        const prompt = `Create well-organized notes from the following content. Include:\n1. Main points and key ideas\n2. Important details and facts\n3. Structure with headings and bullet points\n4. Summary of key takeaways\n\nContent: "${content}"`
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a note-taking expert that creates clear, organized notes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 600
        })

        const notes = completion.choices[0]?.message?.content || 'Unable to create notes'
        
        return {
          success: true,
          data: { notes },
          suggestedActions: ['save-notes', 'share-notes']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Note creation failed'
        }
      }
    }
  },
  {
    id: 'generate-report',
    name: 'Generate Report',
    description: 'Create a comprehensive report from analysis',
    category: 'productivity' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const data = context.metadata?.analysisResults || context.query
        
        const prompt = `Generate a comprehensive report based on the following data and analysis. Include:\n1. Executive summary\n2. Key findings and insights\n3. Data analysis and trends\n4. Recommendations and next steps\n5. Visual representation suggestions\n\nData/Analysis: "${data}"`
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a report generation expert that creates professional, insightful reports.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 800
        })

        const report = completion.choices[0]?.message?.content || 'Unable to generate report'
        
        return {
          success: true,
          data: { report },
          suggestedActions: ['export-report', 'create-presentation']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Report generation failed'
        }
      }
    }
  }
]

// Privacy Actions
const privacyActions = [
  {
    id: 'privacy-scan',
    name: 'Privacy Scan',
    description: 'Scan current page for privacy concerns',
    category: 'privacy' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const url = context.currentUrl || ''
        
        const prompt = `Analyze the following website URL for potential privacy concerns. Check for:\n1. Data collection practices\n2. Cookie and tracking technologies\n3. Third-party scripts and trackers\n4. Privacy policy transparency\n5. Data security measures\n\nURL: ${url}\n\nProvide a privacy assessment with recommendations.`
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a privacy expert that analyzes websites for privacy concerns and provides recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })

        const privacyReport = completion.choices[0]?.message?.content || 'Unable to perform privacy scan'
        
        return {
          success: true,
          data: { privacyReport },
          suggestedActions: ['block-trackers', 'enable-privacy-mode']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Privacy scan failed'
        }
      }
    }
  },
  {
    id: 'anonymize-data',
    name: 'Anonymize Data',
    description: 'Remove personal information from text',
    category: 'privacy' as const,
    handler: async (context: any) => {
      try {
        const zai = await ZAI.create()
        const text = context.selectedText || context.query
        
        const prompt = `Anonymize the following text by removing or replacing personally identifiable information (PII) including:\n1. Names and usernames\n2. Email addresses\n3. Phone numbers\n4. Addresses\n5. Financial information\n6. Other sensitive personal data\n\nReplace with generic placeholders like [NAME], [EMAIL], [PHONE], etc.\n\nText: "${text}"`
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a data privacy expert that anonymizes personal information in text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 600
        })

        const anonymizedText = completion.choices[0]?.message?.content || 'Unable to anonymize text'
        
        return {
          success: true,
          data: { anonymizedText },
          suggestedActions: ['save-anonymized', 'share-safely']
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Data anonymization failed'
        }
      }
    }
  }
]

// Register all default actions
export function registerDefaultActions() {
  // Register search actions
  searchActions.forEach(action => aiActionRegistry.register(action))
  
  // Register automation actions
  automationActions.forEach(action => aiActionRegistry.register(action))
  
  // Register analysis actions
  analysisActions.forEach(action => aiActionRegistry.register(action))
  
  // Register productivity actions
  productivityActions.forEach(action => aiActionRegistry.register(action))
  
  // Register privacy actions
  privacyActions.forEach(action => aiActionRegistry.register(action))
  
  console.log(`Registered ${aiActionRegistry.getAll().length} default AI actions`)
}