// @ts-ignore - Suppress node-domexception warnings
import Groq from 'groq-sdk'

const groqApiKey = import.meta.env.VITE_GROQ_API_KEY

if (!groqApiKey) {
  console.warn('Missing Groq API key - AI features will be disabled')
}

// Create Groq instance only if API key exists
export const groq = groqApiKey ? new Groq({
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true
}) : null

export interface SymptomAnalysis {
  conditions: string[]
  urgencyLevel: 'Low' | 'Medium' | 'High'
  urgencyColor: string
  recommendations: string[]
  disclaimer: string
}

export interface ReportAnalysis {
  summary: string
  abnormalValues: Array<{ name: string; value: string; range: string }>
  normalValues: Array<{ name: string; value: string; range: string }>
  recommendations: string[]
  followUp: string
}

export async function getAIResponse(prompt: string, systemPrompt?: string) {
  if (!groq) {
    throw new Error('Groq API key not configured')
  }
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are a helpful medical AI assistant. Always include disclaimers when giving medical advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    })

    return completion.choices[0]?.message?.content || 'No response generated'
  } catch (error) {
    console.error('Groq API error:', error)
    throw error
  }
}

export async function analyzeSymptoms(symptoms: string[]): Promise<SymptomAnalysis> {
  if (!groq) {
    return {
      conditions: ['AI features disabled - API key missing'],
      urgencyLevel: 'Medium',
      urgencyColor: 'yellow',
      recommendations: ['Configure Groq API key in environment variables', 'Consult with a healthcare professional'],
      disclaimer: 'AI analysis is currently unavailable. Please consult a doctor.'
    }
  }

  const prompt = `Patient reported symptoms: ${symptoms.join(', ')}. 
  
  Return a JSON object with this exact structure (no markdown, just raw JSON):
  {
    "conditions": ["Condition 1", "Condition 2", "Condition 3"],
    "urgencyLevel": "Low|Medium|High",
    "recommendations": ["Action 1", "Action 2", "Action 3", "Action 4"],
    "disclaimer": "Medical disclaimer text"
  }
  
  Base urgency on: High = severe symptoms (chest pain, breathing difficulty, severe pain), Medium = moderate concerning symptoms, Low = mild common symptoms.`

  const systemPrompt = `You are a medical AI assistant. Return ONLY valid JSON, no markdown formatting, no backticks, just the raw JSON object.`
  
  try {
    const response = await getAIResponse(prompt, systemPrompt)
    
    // Clean the response - remove any markdown code blocks if present
    let cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    const analysis = JSON.parse(cleanedResponse)
    
    // Add color based on urgency
    let urgencyColor = 'yellow'
    if (analysis.urgencyLevel === 'High') urgencyColor = 'red'
    else if (analysis.urgencyLevel === 'Low') urgencyColor = 'green'
    
    return {
      ...analysis,
      urgencyColor
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    // Fallback structured response
    return {
      conditions: ['Unable to analyze - please consult a doctor'],
      urgencyLevel: 'Medium',
      urgencyColor: 'yellow',
      recommendations: ['Consult with a healthcare professional', 'Monitor your symptoms', 'Seek immediate care if symptoms worsen'],
      disclaimer: 'This is not a substitute for professional medical advice. Please consult a doctor.'
    }
  }
}

export async function analyzeMedicalReport(reportText: string): Promise<ReportAnalysis> {
  if (!groq) {
    return {
      summary: 'AI features disabled - API key missing',
      abnormalValues: [],
      normalValues: [],
      recommendations: ['Configure Groq API key in environment variables'],
      followUp: 'Please consult with your healthcare provider.'
    }
  }

  const prompt = `Analyze this medical report and return a JSON object with this exact structure:
  ${reportText}
  
  Return format (no markdown, just raw JSON):
  {
    "summary": "Brief overall summary",
    "abnormalValues": [{"name": "Test name", "value": "result", "range": "normal range"}],
    "normalValues": [{"name": "Test name", "value": "result", "range": "normal range"}],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "followUp": "Follow-up recommendations"
  }
  
  Only include truly abnormal values in abnormalValues array. Borderline values can go in normalValues with a note.`

  const systemPrompt = `You are a medical AI assistant. Return ONLY valid JSON, no markdown formatting, no backticks, just the raw JSON object.`
  
  try {
    const response = await getAIResponse(prompt, systemPrompt)
    
    let cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    return JSON.parse(cleanedResponse)
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return {
      summary: 'Unable to analyze report automatically. Please review manually.',
      abnormalValues: [],
      normalValues: [],
      recommendations: ['Consult with your healthcare provider for proper interpretation'],
      followUp: 'Schedule an appointment with your doctor to discuss these results.'
    }
  }
}