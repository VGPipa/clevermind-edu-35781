/**
 * AI Helper - Generic function for AI API calls
 * Supports configurable endpoints and models
 */

export interface AICallOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
  retries?: number;
  retryDelay?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface AIError {
  message: string;
  status: number;
  code?: string;
}

/**
 * Generic function to call AI API
 * Configurable endpoint and model via environment variables
 */
export async function callAI(options: AICallOptions): Promise<AIResponse> {
  const {
    systemPrompt,
    userPrompt,
    model,
    temperature = 0.7,
    maxTokens = 2000,
    responseFormat = 'text',
    retries = 3,
    retryDelay = 1000,
  } = options;

  // Get AI configuration from environment
  const AI_API_ENDPOINT = Deno.env.get('AI_API_ENDPOINT') || 'https://ai.gateway.lovable.dev/v1/chat/completions';
  const AI_API_KEY = Deno.env.get('AI_API_KEY') || Deno.env.get('LOVABLE_API_KEY');
  const AI_MODEL = model || Deno.env.get('AI_MODEL') || 'google/gemini-2.5-flash';

  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY or LOVABLE_API_KEY not configured');
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  const requestBody: any = {
    model: AI_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat === 'json_object') {
    requestBody.response_format = { type: 'json_object' };
  }

  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Error calling AI API';
        let errorCode: string | undefined;

        // Handle specific error codes
        if (response.status === 429) {
          errorMessage = 'Límite de solicitudes excedido. Intenta nuevamente en un momento.';
          errorCode = 'RATE_LIMIT';
        } else if (response.status === 402) {
          errorMessage = 'Fondos insuficientes. Contacta al administrador.';
          errorCode = 'INSUFFICIENT_FUNDS';
        } else if (response.status === 401) {
          errorMessage = 'API key inválida o expirada.';
          errorCode = 'UNAUTHORIZED';
        } else if (response.status === 400) {
          errorMessage = 'Solicitud inválida. Verifica los parámetros.';
          errorCode = 'BAD_REQUEST';
        } else {
          errorMessage = `Error ${response.status}: ${errorText}`;
        }

        // Log error for debugging
        console.error(`AI API error (attempt ${attempt + 1}/${retries}):`, {
          status: response.status,
          statusText: response.statusText,
          errorText,
          endpoint: AI_API_ENDPOINT,
          model: AI_MODEL,
        });

        // For rate limits, wait before retrying
        if (response.status === 429 && attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }

        const error: AIError = {
          message: errorMessage,
          status: response.status,
          code: errorCode,
        };
        throw error;
      }

      const data = await response.json();

      // Extract content based on API response format
      let content: string;
      if (data.choices && data.choices[0] && data.choices[0].message) {
        content = data.choices[0].message.content;
      } else if (data.content) {
        content = data.content;
      } else {
        throw new Error('Unexpected AI API response format');
      }

      // Log successful call
      console.log('AI API call successful:', {
        model: AI_MODEL,
        endpoint: AI_API_ENDPOINT,
        contentLength: content.length,
        usage: data.usage,
      });

      return {
        content,
        model: AI_MODEL,
        usage: data.usage,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's an AIError, throw it immediately
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }

      // For network errors, retry
      if (attempt < retries - 1) {
        console.warn(`AI API call failed (attempt ${attempt + 1}/${retries}), retrying...`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  // If all retries failed, throw the last error
  throw lastError || new Error('AI API call failed after all retries');
}

/**
 * Parse JSON response from AI
 * Handles both string and object responses
 */
export function parseAIJSON<T = any>(content: string): T {
  try {
    // Try parsing as JSON string
    if (typeof content === 'string') {
      return JSON.parse(content) as T;
    }
    // If already an object, return as is
    return content as unknown as T;
  } catch (error) {
    console.error('Error parsing AI JSON response:', error);
    throw new Error('Invalid JSON response from AI');
  }
}

/**
 * Helper to build prompts with context
 */
export function buildPrompt(template: string, variables: Record<string, any>): string {
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    prompt = prompt.replace(regex, String(value));
  }
  return prompt;
}

