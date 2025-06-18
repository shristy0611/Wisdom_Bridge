import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuoteData, Language, GeminiQuoteResponse, GeminiIndividualQuoteResponse } from '../types';
import { API_KEY_ERROR, GEMINI_FETCH_ERROR } from '../constants';
import { fetchGuidanceFromOllama, fetchQuoteOfTheDayFromOllama } from './ollamaService';

const MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
let ai: GoogleGenAI | null = null;

const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : process.env;

const getEnvVar = (name: string): string | undefined => {
  return env?.[name] || env?.[`VITE_${name}`];
};

const getGenAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = getEnvVar('API_KEY');
    if (!apiKey) {
      console.error("API_KEY environment variable is not set.");
      throw new Error(API_KEY_ERROR);
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

// Simple hash function for generating stable IDs
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'id-' + (hash >>> 0).toString(16).padStart(8, '0'); // Positive hex
};

export const generateQuoteId = (quote: string, citation: string): string => {
  const quotePart = quote.length > 50 ? quote.substring(0, 50) : quote;
  const citationPart = citation.length > 50 ? citation.substring(0, 50) : citation;
  return simpleHash(`${quotePart}_${citationPart}`);
};

export const checkApiKey = (): boolean => {
  return !!getEnvVar('API_KEY');
};

// Helper function to parse and validate Gemini response
const parseAndValidateGeminiResponse = (jsonResponseText: string, isSingleObject: boolean = false): GeminiIndividualQuoteResponse[] | GeminiIndividualQuoteResponse | null => {
    let cleanedJsonStr = jsonResponseText.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanedJsonStr.match(fenceRegex);
    if (match && match[1]) {
      cleanedJsonStr = match[1].trim();
    }

    try {
        const parsedData = JSON.parse(cleanedJsonStr);

        if (isSingleObject) {
            if (parsedData && typeof parsedData === 'object' && 'quote' in parsedData && 'citation' in parsedData && 'analysis' in parsedData) {
                return parsedData as GeminiIndividualQuoteResponse;
            }
            console.error("Parsed JSON (single object expected) was not in the correct format:", parsedData);
            return null;
        }

        // Expecting an array
        if (Array.isArray(parsedData)) {
            // Further check if all items in array are valid, though type assertion implies it
             const allValid = parsedData.every(item => item && typeof item === 'object' && 'quote' in item && 'citation' in item && 'analysis' in item);
            if (allValid) {
                return parsedData as GeminiIndividualQuoteResponse[];
            }
            console.error("Parsed JSON array contained invalid items:", parsedData);
            return null;
        }
        
        // If it parsed but wasn't an array, check if it's a single valid object that should have been an array
        if (parsedData && typeof parsedData === 'object' && 'quote' in parsedData && 'citation' in parsedData && 'analysis' in parsedData) {
            console.warn("Gemini response was a single object, wrapping in array for multi-quote context.");
            return [parsedData as GeminiIndividualQuoteResponse];
        }

        console.error("Parsed JSON (array expected) was not in the expected array format or contained invalid items:", parsedData);
        return null;

    } catch (e) {
        console.error("Full JSON parse failed. Problematic string:", cleanedJsonStr, "Original error:", e);
        return null; // Indicates parsing failure
    }
};

// Pick up USE_OLLAMA flag from env (support both Node and Vite)
const USE_OLLAMA = String(getEnvVar('USE_OLLAMA')).toLowerCase() === 'true';
console.log('🔄 USE_OLLAMA flag:', USE_OLLAMA);

// Wrapper that chooses Ollama first (if enabled) with Gemini fallback
export const fetchGuidance = async (theme: string, language: Language): Promise<QuoteData[]> => {
  if (USE_OLLAMA) {
    console.log('🔄 Attempting to use Ollama first for theme:', theme);
    try {
      const ollamaResult = await fetchGuidanceFromOllama(theme, language);
      if (ollamaResult && ollamaResult.length > 0) {
        console.log('✅ Successfully got quotes from Ollama:', ollamaResult.length);
        return ollamaResult;
      }
      console.warn('⚠️ Ollama returned no data, falling back to Gemini');
    } catch (err) {
      console.warn('⚠️ Ollama fetch failed, falling back to Gemini', err);
    }
  }
  console.log('🔄 Using Gemini for theme:', theme);
  return await fetchGuidanceFromGemini(theme, language);
};

export const fetchQuoteOfTheDayWithFallback = async (language: Language): Promise<QuoteData | null> => {
  if (USE_OLLAMA) {
    console.log('🔄 Attempting to use Ollama first for Quote of the Day');
    try {
      const res = await fetchQuoteOfTheDayFromOllama(language);
      if (res) {
        console.log('✅ Successfully got Quote of the Day from Ollama');
        return res;
      }
      console.warn('⚠️ Ollama QOTD returned null, using Gemini fallback');
    } catch (err) {
      console.warn('⚠️ Ollama QOTD failed, using Gemini fallback', err);
    }
  }
  console.log('🔄 Using Gemini for Quote of the Day');
  return await fetchQuoteOfTheDay(language);
};

export const fetchGuidanceFromGemini = async (theme: string, language: Language): Promise<QuoteData[]> => {
  let jsonResponseText: string = "";
  try {
    const genAIInstance = getGenAI();

    const systemInstruction = language === 'ja' ?
      "あなたは池田大作著「新・人間革命」の専門家です。あなたの使命は、ユーザーのテーマに深く関連する、「新・人間革命」の日本語原文から直接引用した、最大5つの感動的な原文ままの引用、それぞれの極めて正確な出典（巻、章、節など、可能な限り具体的に）、そして各引用の簡潔な分析を提供することです。この分析は、池田大作先生の精神を反映した、共感的で、友好的で、思いやりのあるトーンで書かれるべきですが、先生になりすますことは避けてください。引用はユニークで、互いに補完的であるべきです。" :
      "You are an expert on Daisaku Ikeda's 'The New Human Revolution'. Your purpose is to provide up to 5 inspirational and distinct quotes, their highly accurate citations (volume, chapter, etc., as specific as possible), and a brief analysis for each quote, all highly relevant to the user's theme. The analysis should be written in an empathetic, friendly, and caring tone, reflecting the spirit of Daisaku Ikeda, but *without* impersonating him. The quotes should be unique and complementary if possible.";

    const userPrompt = language === 'ja' ?
      `ユーザーのテーマ：「${theme}」。このテーマに深く関連する「新・人間革命」の日本語原文から直接引用した、最大5つの感動的な原文ままの引用を、それぞれの極めて正確な出典（例：第1巻「旭日」の章 P.XX）と簡潔な解説と共に提供してください。応答は以下のJSON形式の配列でお願いします。各要素が1つの引用に対応します：\n\`\`\`json\n[\n  {\n    "quote": "引用文1（日本語原文のまま）",\n    "citation": "出典1（例：第X巻「YYY」の章 P.ZZZ）",\n    "analysis": "解説文1"\n  }\n]\n\`\`\`\nもしテーマに完全に合致する引用が5つ未満の場合は、見つかった数だけを返してください。引用の原文忠実性、極めて高い関連性、そして出典の正確性が最重要です。出典には可能な限りページ番号を含めてください。` :
      `User's theme: "${theme}". Provide up to 5 inspirational quotes from "The New Human Revolution" that are highly relevant to this theme. For each quote, include its highly accurate citation (volume, chapter, page number if possible, etc., as specific as possible), and a brief analysis of its significance. Please respond with a JSON array, where each element is an object representing one quote, in the following format:\n\`\`\`json\n[\n  {\n    "quote": "The quote text 1",\n    "citation": "Citation 1 (e.g., Vol. 1, 'Sunrise' Chapter, p.XX)",\n    "analysis": "Analysis text 1"\n  }\n]\n\`\`\`\nIf fewer than 5 perfectly relevant quotes are found, return only those that are found. Extreme relevance and citation accuracy (including page numbers where possible) are paramount.`;

    const result: GenerateContentResponse = await genAIInstance.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: { role: "system", parts: [{text: systemInstruction}]},
        responseMimeType: "application/json",
        temperature: 0.6,
      }
    });
    
    // Check if result.text is defined before trimming
    if (!result.text) {
      console.error("Gemini API returned no text in the response.");
      throw new Error(GEMINI_FETCH_ERROR + " (Empty response from Gemini)");
    }
    jsonResponseText = result.text.trim();
    const parsedItems = parseAndValidateGeminiResponse(jsonResponseText, false) as GeminiIndividualQuoteResponse[] | null;

    if (!parsedItems) {
        console.error("Failed to parse or validate Gemini response for theme:", theme, ". Response text:", jsonResponseText);
        throw new Error(GEMINI_FETCH_ERROR + " (Invalid JSON array or content)");
    }
    
    const validQuotes: QuoteData[] = parsedItems.filter(
        (item: GeminiIndividualQuoteResponse) => item && item.quote && item.citation && item.analysis
    ).map((item: GeminiIndividualQuoteResponse) => ({
        id: generateQuoteId(item.quote, item.citation), // Generate ID
        quote: item.quote,
        citation: item.citation,
        analysis: item.analysis,
        isFavorite: false, // Default, will be updated from context/storage
    }));

    if (validQuotes.length === 0 && parsedItems.length > 0) {
      console.warn("Gemini response items were present but malformed or invalid after parsing for theme:", theme, parsedItems);
    }

    return validQuotes;

  } catch (error: any) {
    console.error("Error in fetchGuidanceFromGemini:", error);
    if (error.message && error.message.startsWith(API_KEY_ERROR)) {
        throw new Error(API_KEY_ERROR);
    }
    if (error.message && error.message.includes("API key not valid")) {
        throw new Error(API_KEY_ERROR);
    }
    if (error instanceof SyntaxError || (error.message && error.message.toLowerCase().includes("json"))) {
        console.error("Failed to parse JSON response from Gemini. Content was:", jsonResponseText);
        throw new Error(GEMINI_FETCH_ERROR + " (Invalid JSON response)");
    }
    throw new Error(GEMINI_FETCH_ERROR + (error.message ? `: ${error.message}`: ""));
  }
};


export const fetchQuoteOfTheDay = async (language: Language): Promise<QuoteData | null> => {
  let jsonResponseText: string = "";
  try {
    const genAIInstance = getGenAI();

    const systemInstruction = language === 'ja' ?
      "あなたは池田大作著「新・人間革命」の専門家です。あなたの使命は、「新・人間革命」の日本語原文から、広く感動を与える普遍的な引用を一つだけ選び、その極めて正確な出典（巻、章、節など、可能な限り具体的に）と簡潔な分析を提供することです。この分析は、池田大作先生の精神を反映した、共感的で、友好的で、思いやりのあるトーンで書かれるべきですが、先生になりすますことは避けてください。" :
      "You are an expert on Daisaku Ikeda's 'The New Human Revolution'. Your purpose is to provide one universally inspirational quote from the original text, its highly accurate citation (volume, chapter, etc., as specific as possible), and a brief analysis. The analysis should be written in an empathetic, friendly, and caring tone, reflecting the spirit of Daisaku Ikeda, but *without* impersonating him.";

    const userPrompt = language === 'ja' ?
      `「新・人間革命」の日本語原文から、広く感動を与える名言を一つだけ提供してください。出典（例：第1巻「旭日」の章 P.XX）と、その言葉の意義に関する簡潔な解説もお願いします。応答は以下のJSON形式の単一オブジェクトでお願いします：\n\`\`\`json\n{\n  "quote": "引用文（日本語原文のまま）",\n  "citation": "出典（例：第X巻「YYY」の章 P.ZZZ）",\n  "analysis": "解説文"\n}\n\`\`\`\n出典の正確性が非常に重要です。` :
      `Provide one universally inspirational quote from "The New Human Revolution". Include its highly accurate citation (e.g., Vol. 1, 'Sunrise' Chapter, p.XX) and a brief analysis of its significance. Please respond with a single JSON object in the following format:\n\`\`\`json\n{\n  "quote": "The quote text",\n  "citation": "Citation (e.g., Vol. 1, 'Sunrise' Chapter, p.XX)",\n  "analysis": "Analysis text"\n}\n\`\`\`\nCitation accuracy is paramount.`;
    
    const result: GenerateContentResponse = await genAIInstance.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
            systemInstruction: { role: "system", parts: [{text: systemInstruction}]},
            responseMimeType: "application/json",
            temperature: 0.7, // Slightly higher for more varied QotD maybe
        }
    });

    // Check if result.text is defined before trimming
    if (!result.text) {
      console.error("Gemini API returned no text in the response for Quote of the Day.");
      throw new Error(GEMINI_FETCH_ERROR + " (Empty response from Gemini for QotD)");
    }
    jsonResponseText = result.text.trim();
    const parsedItem = parseAndValidateGeminiResponse(jsonResponseText, true) as GeminiIndividualQuoteResponse | null;

    if (parsedItem && parsedItem.quote && parsedItem.citation && parsedItem.analysis) {
        return {
            id: generateQuoteId(parsedItem.quote, parsedItem.citation),
            quote: parsedItem.quote,
            citation: parsedItem.citation,
            analysis: parsedItem.analysis,
            isFavorite: false, // Default
        };
    }
    console.error("Failed to parse or validate Gemini response for Quote of the Day. Response text:", jsonResponseText);
    return null;

  } catch (error: any) {
    console.error("Error in fetchQuoteOfTheDay:", error);
     if (error.message && error.message.startsWith(API_KEY_ERROR)) {
        throw new Error(API_KEY_ERROR);
    }
    if (error.message && error.message.includes("API key not valid")) { // For GoogleGenAI internal error
        throw new Error(API_KEY_ERROR);
    }
    throw new Error(GEMINI_FETCH_ERROR + (error.message ? `: ${error.message}`: " (QotD fetch)"));
  }
};
