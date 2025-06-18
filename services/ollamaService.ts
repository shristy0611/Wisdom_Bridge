import { QuoteData, Language, GeminiIndividualQuoteResponse } from '../types';
import { generateQuoteId } from './geminiService';
import { GEMINI_FETCH_ERROR } from '../constants';

const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : process.env;
const getEnvVar = (name: string): string | undefined => env?.[name] || env?.[`VITE_${name}`];

const MODEL_NAME = getEnvVar('OLLAMA_MODEL') ?? 'llama2:7b-chat';
const OLLAMA_URL = getEnvVar('OLLAMA_URL') ?? 'http://localhost:11434/api/generate';

// ------------------ Helper ------------------
const callOllama = async (prompt: string): Promise<string> => {
  console.log('🔍 Calling Ollama API with model:', MODEL_NAME);
  console.log('🔍 Ollama URL:', OLLAMA_URL);
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL_NAME, prompt, stream: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Ollama API error:', res.status, text);
    throw new Error(`Ollama error: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (!data.response) throw new Error('Empty response from Ollama');
  console.log('✅ Ollama API response received');
  return (data.response as string).trim();
};

// Simple JSON validation mirroring Gemini parser
const parseOllamaJson = (
  jsonResponseText: string,
  isSingleObject: boolean = false,
): GeminiIndividualQuoteResponse[] | GeminiIndividualQuoteResponse | null => {
  let cleaned = jsonResponseText.trim();
  console.log('🔍 Raw text to parse:', cleaned.substring(0, 100) + '...');
  
  // Remove any <think>...</think> blocks that Qwen3 might output
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  
  // Try to extract JSON from markdown code blocks or standalone
  const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```|^\s*(\{[\s\S]*\})\s*$/s;
  const match = cleaned.match(fenceRegex);
  if (match && (match[1] || match[2])) {
    cleaned = (match[1] || match[2]).trim();
  }
  
  console.log('🔍 Cleaned JSON to parse:', cleaned.substring(0, 100) + '...');

  try {
    const parsed = JSON.parse(cleaned);
    
    // Handle single object case
    if (isSingleObject) {
      if (
        parsed &&
        typeof parsed === 'object' &&
        'quote' in parsed &&
        'citation' in parsed &&
        'analysis' in parsed
      ) {
        console.log('✅ Successfully parsed single quote object');
        return parsed as GeminiIndividualQuoteResponse;
      }
      console.error('❌ Parsed object missing required fields:', Object.keys(parsed));
      return null;
    }

    // Handle array case
    if (Array.isArray(parsed)) {
      const allValid = parsed.every(
        (item) => item && typeof item === 'object' && 'quote' in item && 'citation' in item && 'analysis' in item,
      );
      if (allValid) {
        console.log('✅ Successfully parsed array of', parsed.length, 'quotes');
        return parsed as GeminiIndividualQuoteResponse[];
      }
      console.error('❌ Some items in array missing required fields');
      return null;
    }
    
    // If we got a single object but expected an array, wrap it
    if (parsed && typeof parsed === 'object' && 'quote' in parsed && 'citation' in parsed && 'analysis' in parsed) {
      console.log('⚠️ Got single quote object but expected array, wrapping it');
      return [parsed as GeminiIndividualQuoteResponse];
    }
    
    console.error('❌ Parsed JSON is neither valid array nor object:', typeof parsed);
    return null;
  } catch (err) {
    console.error('❌ Failed to parse Ollama JSON:', err);
    return null;
  }
};

// -------------- Public API --------------
export const fetchGuidanceFromOllama = async (
  theme: string,
  language: Language,
): Promise<QuoteData[]> => {
  console.log('📚 fetchGuidanceFromOllama called with theme:', theme, 'language:', language);
  const systemInstructionEn =
    "You are an expert on Daisaku Ikeda's 'The New Human Revolution'. Provide up to 5 inspirational and distinct quotes from the book in the original language, each with a highly accurate citation (volume, chapter, page if possible) and a brief analysis. Respond strictly with JSON as shown.";
  const systemInstructionJa =
    'あなたは池田大作著「新・人間革命」の専門家です。ユーザーのテーマに関連する最大5つの引用とそれぞれの正確な出典、簡潔な解説をJSONのみで返してください。';

  const exampleJson = `[
  {
    "quote": "The quote text 1",
    "citation": "Vol. 1, 'Sunrise' chap, p.XX",
    "analysis": "Analysis 1"
  }
]`;

  const prompt = `${language === 'ja' ? systemInstructionJa : systemInstructionEn}

User theme: "${theme}"

IMPORTANT: You must respond ONLY with valid JSON in this exact format:
${exampleJson}

Do not include any explanations, markdown formatting, or anything else outside the JSON array.`;

  const raw = await callOllama(prompt);
  console.log('📝 Raw Ollama response length:', raw.length);
  const parsed = parseOllamaJson(raw, false) as GeminiIndividualQuoteResponse[] | null;
  if (!parsed) throw new Error(GEMINI_FETCH_ERROR + ' (Ollama invalid JSON)');
  console.log('✅ Successfully parsed Ollama response into', parsed.length, 'quotes');

  return parsed.map((item) => ({
    id: generateQuoteId(item.quote, item.citation),
    quote: item.quote,
    citation: item.citation,
    analysis: item.analysis,
    isFavorite: false,
  }));
};

export const fetchQuoteOfTheDayFromOllama = async (
  language: Language,
): Promise<QuoteData | null> => {
  const instructionEn =
    "Provide one universally inspirational quote from 'The New Human Revolution', its precise citation, and a short analysis. Respond with a single JSON object.";
  const instructionJa =
    '「新・人間革命」から普遍的な名言を一つ選び、その正確な出典と簡潔な解説をJSON オブジェクトで返してください。';

  const exampleObj = `{
  "quote": "Quote text",
  "citation": "Vol. 1, ...",
  "analysis": "Analysis"
}`;

  const prompt = `${language === 'ja' ? instructionJa : instructionEn}

IMPORTANT: You must respond ONLY with valid JSON in this exact format:
${exampleObj}

Do not include any explanations, markdown formatting, or anything else outside the JSON object.`;

  const raw = await callOllama(prompt);
  console.log('📝 Raw Ollama QOTD response length:', raw.length);
  const parsed = parseOllamaJson(raw, true) as GeminiIndividualQuoteResponse | null;
  if (!parsed) return null;
  console.log('✅ Successfully parsed Ollama QOTD response');

  return {
    id: generateQuoteId(parsed.quote, parsed.citation),
    quote: parsed.quote,
    citation: parsed.citation,
    analysis: parsed.analysis,
    isFavorite: false,
  };
}; 