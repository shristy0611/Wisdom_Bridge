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
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleaned.match(fenceRegex);
  if (match && match[1]) cleaned = match[1].trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (isSingleObject) {
      if (
        parsed &&
        typeof parsed === 'object' &&
        'quote' in parsed &&
        'citation' in parsed &&
        'analysis' in parsed
      ) {
        return parsed as GeminiIndividualQuoteResponse;
      }
      return null;
    }

    if (Array.isArray(parsed)) {
      const allValid = parsed.every(
        (item) => item && 'quote' in item && 'citation' in item && 'analysis' in item,
      );
      return allValid ? (parsed as GeminiIndividualQuoteResponse[]) : null;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse Ollama JSON', err);
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

  const exampleJson = `[\n  {\n    \"quote\": \"The quote text 1\",\n    \"citation\": \"Vol. 1, \'Sunrise\' chap, p.XX\",\n    \"analysis\": \"Analysis 1\"\n  }\n]`;

  const prompt = `$${language === 'ja' ? systemInstructionJa : systemInstructionEn}\n\nUser theme: \"${theme}\". Output **only** the JSON array in this exact format:\n${exampleJson}`;

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

  const exampleObj = `{\n  \"quote\": \"Quote text\",\n  \"citation\": \"Vol. 1, ...\",\n  \"analysis\": \"Analysis\"\n}`;

  const prompt = `${language === 'ja' ? instructionJa : instructionEn}\nOutput **only** the JSON object in this format:\n${exampleObj}`;

  const raw = await callOllama(prompt);
  const parsed = parseOllamaJson(raw, true) as GeminiIndividualQuoteResponse | null;
  if (!parsed) return null;

  return {
    id: generateQuoteId(parsed.quote, parsed.citation),
    quote: parsed.quote,
    citation: parsed.citation,
    analysis: parsed.analysis,
    isFavorite: false,
  };
}; 