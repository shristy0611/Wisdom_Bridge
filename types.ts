export type Language = 'en' | 'ja';

export interface QuoteData {
  id: string; // Unique ID for the quote
  quote: string;
  citation: string;
  analysis: string;
  isFavorite?: boolean;
}

export interface QuoteOfTheDayItem {
  quote: QuoteData;
  dateFetched: string; // YYYY-MM-DD format
  language: Language; // Language the QotD was fetched in
}

export interface ReflectionItem {
  quoteId: string;
  text: string;
  timestamp: number;
}

export interface SearchHistoryItem {
  id: string; // Unique ID, e.g., timestamp or uuid
  theme: string;
  timestamp: number;
  language: Language; // Language of the search, crucial for cache clearing
}

export interface CachedQuoteItem {
  data: QuoteData[];
  timestamp: number;
}

export type Page = 'home' | 'input' | 'quote' | 'favorites' | 'journal' | 'explore';

export interface AppContextType {
  page: Page;
  setPage: (page: Page) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  transcription: string; // User's theme input (text or voice)
  setTranscription: (transcription: string) => void;
  quoteData: QuoteData[] | null;
  setQuoteData: (quote: QuoteData[] | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  apiKeyAvailable: boolean;
  searchHistory: SearchHistoryItem[];
  cachedQuotes: Record<string, CachedQuoteItem>; // Key: theme:language
  addSearchToHistoryAndCache: (theme: string, language: Language, data: QuoteData[]) => void;
  getCachedQuote: (theme: string, language: Language) => QuoteData[] | null;
  deleteSearchHistoryItem: (itemId: string) => void; // Replaces clearSearchHistoryAndCache

  // Features from Phase 1 & 2
  favoriteQuotes: QuoteData[];
  toggleFavorite: (quote: QuoteData) => void;
  reflections: Record<string, ReflectionItem>; // Keyed by quote.id
  getReflection: (quoteId: string) => ReflectionItem | undefined;
  saveReflection: (quoteId: string, text: string) => void;
  deleteReflection: (quoteId: string) => void;
  quoteOfTheDay: QuoteOfTheDayItem | null;
  fetchAndSetQuoteOfTheDay: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;

  // Modal states for Phase 2
  isReflectionModalOpen: boolean;
  setIsReflectionModalOpen: (isOpen: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (isOpen: boolean) => void;
  modalQuote: QuoteData | null; // Quote to be used in modals
  setModalQuote: (quote: QuoteData | null) => void;
}

export interface Translations {
  [key: string]: {
    title: string;
    homeTitle: string;
    homeSubtitle: string;
    startSearching: string;
    footerHome: string;
    footerInput: string;
    footerQuote: string;
    footerFavorites: string; // New
    footerJournal: string; // New
    footerExplore: string; // New
    statusTap: string;
    statusListening: string;
    statusProcessing: string;
    statusError: string;
    quoteViewTitle: string;
    analysis: string;
    findAnother: string;
    errorTitle: string;
    retry: string;
    findingQuoteTitle: string;
    findingQuoteSubtitle: string;
    langSwitch: string;
    errorApiKey: string;
    errorFetchingGuidance: string;
    inputPlaceholder: string;
    submitTheme: string;
    voiceInputTitle: string;
    statusVoiceError: string;
    statusVoiceSuccess: string;
    quoteIndicator: string;
    searchHistoryTitle: string;
    clearHistory: string; // Retained for translations if any other part uses it, but not for button
    historyItemAriaLabel: string; // Generic label for clicking history item
    deleteHistoryItemAriaLabel: string; // New for delete button
    historyItemDeleted: string; // New for toast
    confirmClearHistory: string; // Retained in case of future use for mass clear
    favoritesTitle: string;
    addToFavorites: string;
    removeFromFavorites: string;
    shareQuote: string;
    shareViaEmail: string;
    shareViaTwitter: string;
    copyToClipboard: string;
    copiedSuccess: string;
    exploreThemesTitle: string;
    quoteOfTheDayTitle: string;
    viewQuoteOfTheDay: string;
    journalTitle: string;
    journalTab: string; // For footer navigation (already exists, ensure usage)
    addReflection: string;
    editReflection: string;
    saveReflection: string;
    deleteReflection: string;
    confirmDeleteReflection: string;
    noFavoritesMessage: string;
    noReflectionsMessage: string;
    reflectionPlaceholder: string;
    toastAddedToFavorites: string;
    toastRemovedFromFavorites: string;
    toastReflectionSaved: string;
    toastReflectionDeleted: string;
    errorSavingReflection: string;
    errorDeletingReflection: string;
    errorFetchingQuoteOfTheDay: string;
    loadingQuoteOfTheDay: string;
    noQuoteOfTheDay: string;
    backToInput: string;
    myReflections: string;
    loadMoreThemes: string; 
    theme: string; 
    searchByTheme: string;
    reflectionForQuote: string; // "Reflection for: {quote}"
    noReflectionsFound: string;
    shareOriginalText: string;
    closeModal: string;
    confirm: string; // Generic confirm
    cancel: string; // Generic cancel
  };
}

// Gemini specific response type for an individual quote object
export interface GeminiIndividualQuoteResponse {
  quote: string;
  citation: string;
  analysis: string;
}

// The overall response from Gemini will be an array of these individual quotes
export type GeminiQuoteResponse = GeminiIndividualQuoteResponse[];