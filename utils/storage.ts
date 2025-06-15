import { SearchHistoryItem, CachedQuoteItem, QuoteData, ReflectionItem, QuoteOfTheDayItem, Language } from '../types';
import { FAVORITE_QUOTES_KEY, REFLECTIONS_KEY, QUOTE_OF_THE_DAY_KEY, CACHE_VERSION, CACHE_VERSION_KEY } from '../constants';


const SEARCH_HISTORY_KEY = 'wisdomBridgeSearchHistory';
const CACHED_QUOTES_KEY = 'wisdomBridgeCachedQuotes';

// --- Search History ---

export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const storedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (storedHistory) {
      const parsedHistory = JSON.parse(storedHistory) as SearchHistoryItem[];
      // Validate structure including the new 'language' field (optional for backward compatibility)
      if (Array.isArray(parsedHistory) && 
          parsedHistory.every(item => 
            item &&
            typeof item.id === 'string' &&
            typeof item.theme === 'string' && 
            typeof item.timestamp === 'number' &&
            (item.language === undefined || typeof item.language === 'string') // language can be undefined for old items
          )
      ) {
        // Ensure new items without language (e.g. from old storage) get a default or are handled
        return parsedHistory.map(item => ({
          ...item,
          // If language is missing, it might be an old item. Default to 'en' or handle as needed.
          // For now, we'll assume new items will always have it, and old items are just passed through.
          // The App.tsx logic for deleting cache will need to handle if language is missing on an item.
          // However, newly added history items WILL have language.
          language: item.language || 'en' // Provide a sensible default if parsing old items without it
        })) as SearchHistoryItem[];
      }
    }
  } catch (error) {
    console.error("Error retrieving search history from localStorage:", error);
  }
  return [];
};

export const setSearchHistory = (history: SearchHistoryItem[]): void => {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving search history to localStorage:", error);
  }
};

// --- Cached Quotes ---

export const getCachedQuotes = (): Record<string, CachedQuoteItem> => {
  try {
    const storedCacheVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (storedCacheVersion !== CACHE_VERSION) {
      console.log(`Cache version mismatch. Stored: ${storedCacheVersion}, App: ${CACHE_VERSION}. Clearing cache.`);
      localStorage.removeItem(CACHED_QUOTES_KEY); // Clear old quotes
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION); // Update stored version
      return {}; // Return empty cache
    }

    const storedCache = localStorage.getItem(CACHED_QUOTES_KEY);
    if (storedCache) {
      const parsedCache = JSON.parse(storedCache) as Record<string, CachedQuoteItem>;
      if (typeof parsedCache === 'object' && parsedCache !== null) {
        return parsedCache;
      }
    }
  } catch (error) {
    console.error("Error retrieving cached quotes from localStorage:", error);
  }
  return {};
};

export const setCachedQuotes = (cache: Record<string, CachedQuoteItem>): void => {
  try {
    localStorage.setItem(CACHED_QUOTES_KEY, JSON.stringify(cache));
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION); // Also update/set cache version
  } catch (error) {
    console.error("Error saving cached quotes to localStorage:", error);
  }
};

// --- Favorite Quotes ---

export const getFavoriteQuotes = (): QuoteData[] => {
  try {
    const storedFavorites = localStorage.getItem(FAVORITE_QUOTES_KEY);
    if (storedFavorites) {
      const parsedFavorites = JSON.parse(storedFavorites) as QuoteData[];
      // Basic validation
      if (Array.isArray(parsedFavorites) && parsedFavorites.every(item => item && typeof item.id === 'string' && typeof item.quote === 'string')) {
        return parsedFavorites.map(fav => ({ ...fav, isFavorite: true })); // Ensure isFavorite is true
      }
    }
  } catch (error) {
    console.error("Error retrieving favorite quotes from localStorage:", error);
  }
  return [];
};

export const setFavoriteQuotes = (quotes: QuoteData[]): void => {
  try {
    // Store only essential data, isFavorite is implicit for this list
    const storableQuotes = quotes.map(({ id, quote, citation, analysis }) => ({ id, quote, citation, analysis }));
    localStorage.setItem(FAVORITE_QUOTES_KEY, JSON.stringify(storableQuotes));
  } catch (error) {
    console.error("Error saving favorite quotes to localStorage:", error);
  }
};

// --- Reflections ---

export const getReflections = (): Record<string, ReflectionItem> => {
  try {
    const storedReflections = localStorage.getItem(REFLECTIONS_KEY);
    if (storedReflections) {
      const parsedReflections = JSON.parse(storedReflections) as Record<string, ReflectionItem>;
      if (typeof parsedReflections === 'object' && parsedReflections !== null) {
        // Basic validation for each item
        for (const key in parsedReflections) {
            if (Object.prototype.hasOwnProperty.call(parsedReflections, key)) {
                const item = parsedReflections[key];
                if (!(item && typeof item.quoteId === 'string' && typeof item.text === 'string' && typeof item.timestamp === 'number')) {
                    console.warn(`Invalid reflection item found for key ${key}, removing.`);
                    delete parsedReflections[key]; // Clean up malformed entries
                }
            }
        }
        return parsedReflections;
      }
    }
  } catch (error) {
    console.error("Error retrieving reflections from localStorage:", error);
  }
  return {};
};

export const setReflections = (reflections: Record<string, ReflectionItem>): void => {
  try {
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections));
  } catch (error) {
    console.error("Error saving reflections to localStorage:", error);
  }
};

// --- Quote of the Day ---

export const getQuoteOfTheDayItem = (): QuoteOfTheDayItem | null => {
  try {
    const storedQotD = localStorage.getItem(QUOTE_OF_THE_DAY_KEY);
    if (storedQotD) {
      const parsedQotD = JSON.parse(storedQotD) as QuoteOfTheDayItem;
      // Validation including language
      if (parsedQotD && 
          parsedQotD.quote && 
          typeof parsedQotD.quote.id === 'string' && 
          typeof parsedQotD.dateFetched === 'string' &&
          (parsedQotD.language === 'en' || parsedQotD.language === 'ja')) { // Validate language field
        return parsedQotD;
      } else {
        console.warn("Stored Quote of the Day item is invalid or missing language field. Discarding.");
        localStorage.removeItem(QUOTE_OF_THE_DAY_KEY); // Remove invalid item
      }
    }
  } catch (error) {
    console.error("Error retrieving Quote of the Day from localStorage:", error);
  }
  return null;
};

export const setQuoteOfTheDayItem = (item: QuoteOfTheDayItem): void => {
  try {
    // Ensure item includes language before storing
    if (item && item.quote && item.dateFetched && item.language) {
      localStorage.setItem(QUOTE_OF_THE_DAY_KEY, JSON.stringify(item));
    } else {
      console.error("Attempted to save invalid Quote of the Day item (missing language or other fields):", item);
    }
  } catch (error) {
    console.error("Error saving Quote of the Day to localStorage:", error);
  }
};