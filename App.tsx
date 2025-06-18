import React, { useState, useEffect, createContext, useCallback, useRef } from 'react';
import Screen from './components/Screen';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeScreen from './components/HomeScreen';
import InputScreen from './components/InputScreen';
import QuoteViewScreen from './components/QuoteViewScreen';
import LanguageSwitcher from './components/LanguageSwitcher';
import FavoritesScreen from './components/FavoritesScreen'; // New
import JournalScreen from './components/JournalScreen';   // New
import ExploreThemesScreen from './components/ExploreThemesScreen'; // New
import ReflectionModal from './components/ReflectionModal'; // New
import ShareModal from './components/ShareModal';       // New
import Toast from './components/Toast'; // New

import { translations, MAX_HISTORY_ITEMS } from './constants';
import { AppContextType, Language, QuoteData, SearchHistoryItem, CachedQuoteItem, QuoteOfTheDayItem, ReflectionItem, Page } from './types';
import { checkApiKey, fetchQuoteOfTheDayWithFallback as fetchQotDService } from './services/geminiService';
import * as storage from './utils/storage';

export const AppContext = createContext<AppContextType | null>(null);

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [transcription, setTranscription] = useState<string>('');
  const [quoteData, setQuoteData] = useState<QuoteData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(false);

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [cachedQuotes, setCachedQuotes] = useState<Record<string, CachedQuoteItem>>({});

  const [favoriteQuotes, setFavoriteQuotes] = useState<QuoteData[]>([]);
  const [reflections, setReflections] = useState<Record<string, ReflectionItem>>({});
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<QuoteOfTheDayItem | null>(null);
  const [toastInfo, setToastInfo] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);

  // Modal States for Phase 2
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [modalQuote, setModalQuote] = useState<QuoteData | null>(null);

  const prevLanguageRef = useRef<Language>(language);
  const fetchingQotDRef = useRef<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastInfo({ id: Date.now().toString(), message, type });
  };

  const fetchAndSetQuoteOfTheDay = useCallback(async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentAppLanguage = language; 

    if (fetchingQotDRef.current) {
      console.log('🛑 Already fetching Quote of the Day, skipping duplicate call');
      return;
    }
    fetchingQotDRef.current = true;

    if (quoteOfTheDay && 
        quoteOfTheDay.dateFetched === todayStr && 
        quoteOfTheDay.language === currentAppLanguage &&
        quoteOfTheDay.quote?.id) {
      const isFav = favoriteQuotes.some(fq => fq.id === quoteOfTheDay.quote.id);
      if (quoteOfTheDay.quote.isFavorite !== isFav) {
        setQuoteOfTheDay(prevQotD => prevQotD ? ({ ...prevQotD, quote: { ...prevQotD.quote, isFavorite: isFav } }) : null);
      }
      fetchingQotDRef.current = false;
      return; 
    }

    const storedQotD = storage.getQuoteOfTheDayItem();
    if (storedQotD && 
        storedQotD.dateFetched === todayStr && 
        storedQotD.language === currentAppLanguage &&
        storedQotD.quote?.id) {
      const isFav = favoriteQuotes.some(fq => fq.id === storedQotD.quote.id);
      setQuoteOfTheDay({ ...storedQotD, quote: { ...storedQotD.quote, isFavorite: isFav } });
      fetchingQotDRef.current = false;
      return; 
    }
    try {
      const qotdResult = await fetchQotDService(currentAppLanguage);
      if (qotdResult) {
        const isFav = favoriteQuotes.some(fq => fq.id === qotdResult.id);
        const newQotDItem: QuoteOfTheDayItem = {
          quote: { ...qotdResult, isFavorite: isFav },
          dateFetched: todayStr,
          language: currentAppLanguage, 
        };
        setQuoteOfTheDay(newQotDItem);
        storage.setQuoteOfTheDayItem(newQotDItem);
      } else {
        setQuoteOfTheDay(null); 
        console.error("fetchQuoteOfTheDay service returned null (App.tsx)");
      }
    } catch (err: any) {
      console.error("Error in fetchAndSetQuoteOfTheDay (App.tsx):", err.message);
    } finally {
      fetchingQotDRef.current = false;
    }
  }, [language, favoriteQuotes, quoteOfTheDay]); 

  useEffect(() => {
    setApiKeyAvailable(checkApiKey());
    setSearchHistory(storage.getSearchHistory());
    setCachedQuotes(storage.getCachedQuotes());
    
    const loadedFavorites = storage.getFavoriteQuotes();
    setFavoriteQuotes(loadedFavorites);

    setReflections(storage.getReflections());
    // Initial fetch of QOTD on app load
    fetchAndSetQuoteOfTheDay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for initial load

  // Effect 1: Fetch QotD whenever its dependencies change (language, favoriteQuotes via fetchAndSetQuoteOfTheDay callback)
  useEffect(() => {
    let isActive = true;
    if (isActive) {
      fetchAndSetQuoteOfTheDay();
    }
    return () => {
      isActive = false;
    };
  }, [fetchAndSetQuoteOfTheDay]);

  // Effect 2: Handle UI changes specifically when language changes
  useEffect(() => {
    if (prevLanguageRef.current !== language) { // Language actually changed
      if (page === 'quote') {
        setPage('input');
      }
      // Regardless of which page we were on, if language changes,
      // the current guidance (quoteData) and any related error
      // are likely tied to the old language and should be cleared.
      setQuoteData(null);
      setError(null);
      prevLanguageRef.current = language;
    }
  }, [language, page, setPage, setQuoteData, setError]);


  const addSearchToHistoryAndCache = (theme: string, lang: Language, data: QuoteData[]) => {
    const cacheKey = `${theme.toLowerCase()}:${lang}`;
    
    const dataWithFavStatus = data.map(q => ({
      ...q,
      isFavorite: favoriteQuotes.some(fav => fav.id === q.id)
    }));

    const newCachedQuotes = { ...cachedQuotes, [cacheKey]: { data: dataWithFavStatus, timestamp: Date.now() } };
    setCachedQuotes(newCachedQuotes);
    storage.setCachedQuotes(newCachedQuotes);

    // Add language to the history item itself
    const newHistoryItem: SearchHistoryItem = { id: Date.now().toString(), theme, timestamp: Date.now(), language: lang };
    let updatedHistory = [newHistoryItem, ...searchHistory.filter(item => item.theme.toLowerCase() !== theme.toLowerCase() || item.language !== lang)];
    if (updatedHistory.length > MAX_HISTORY_ITEMS) {
      updatedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
    }
    setSearchHistory(updatedHistory);
    storage.setSearchHistory(updatedHistory);
  };

  const getCachedQuote = (theme: string, lang: Language): QuoteData[] | null => {
    const cacheKey = `${theme.toLowerCase()}:${lang}`;
    const cachedItem = cachedQuotes[cacheKey];
    if (cachedItem) {
      return cachedItem.data.map(q => ({
        ...q,
        isFavorite: favoriteQuotes.some(fav => fav.id === q.id)
      }));
    }
    return null;
  };

  const deleteSearchHistoryItem = (itemId: string) => {
    const itemToDelete = searchHistory.find(item => item.id === itemId);
    if (!itemToDelete) return;

    // Remove from history state
    const updatedHistory = searchHistory.filter(item => item.id !== itemId);
    setSearchHistory(updatedHistory);
    storage.setSearchHistory(updatedHistory);

    // Remove from cachedQuotes state
    const cacheKey = `${itemToDelete.theme.toLowerCase()}:${itemToDelete.language}`;
    const { [cacheKey]: _, ...remainingCachedQuotes } = cachedQuotes;
    setCachedQuotes(remainingCachedQuotes);
    storage.setCachedQuotes(remainingCachedQuotes);
    
    showToast(translations[language].historyItemDeleted, "success");
  };


  const toggleFavorite = (quoteToToggle: QuoteData) => {
    let isNowFavorite = false;
    let toastMessage = "";

    setFavoriteQuotes(prevFavorites => {
        const existingIndex = prevFavorites.findIndex(fq => fq.id === quoteToToggle.id);
        let newFavorites;
        if (existingIndex > -1) {
            newFavorites = prevFavorites.filter(fq => fq.id !== quoteToToggle.id);
            isNowFavorite = false;
            toastMessage = translations[language].toastRemovedFromFavorites;
        } else {
            newFavorites = [...prevFavorites, { ...quoteToToggle, isFavorite: true }];
            isNowFavorite = true;
            toastMessage = translations[language].toastAddedToFavorites;
        }
        storage.setFavoriteQuotes(newFavorites);
        return newFavorites;
    });

    // We need to show the toast AFTER the state updates are complete
    setTimeout(() => {
      showToast(toastMessage, "success");
    }, 0);

    // Update the isFavorite status in quoteData without changing the current quote
    setQuoteData(prevQuoteData => {
        if (!prevQuoteData) return null;
        return prevQuoteData.map(q =>
            q.id === quoteToToggle.id ? { ...q, isFavorite: isNowFavorite } : q
        );
    });

    // Update Quote of the Day if it's the same quote
    setQuoteOfTheDay(prevQotD => {
        if (prevQotD && prevQotD.quote.id === quoteToToggle.id) {
            if (prevQotD.language === language) { // Ensure we only update QotD if it's in the current app language
                 return { ...prevQotD, quote: { ...prevQotD.quote, isFavorite: isNowFavorite } };
            }
        }
        return prevQotD;
    });
    
    // Update modal quote if it's the same quote
    setModalQuote(prevModalQuote => {
        if (prevModalQuote && prevModalQuote.id === quoteToToggle.id) {
            return { ...prevModalQuote, isFavorite: isNowFavorite };
        }
        return prevModalQuote;
    });
  };

  const getReflection = (quoteId: string): ReflectionItem | undefined => {
    return reflections[quoteId];
  };

  const saveReflection = (quoteId: string, text: string) => {
    const newReflection: ReflectionItem = { quoteId, text, timestamp: Date.now() };
    const updatedReflections = { ...reflections, [quoteId]: newReflection };
    setReflections(updatedReflections);
    storage.setReflections(updatedReflections);
    showToast(translations[language].toastReflectionSaved, "success");
  };

  const deleteReflection = (quoteId: string) => {
    const { [quoteId]: _, ...remainingReflections } = reflections;
    setReflections(remainingReflections);
    storage.setReflections(remainingReflections);
    showToast(translations[language].toastReflectionDeleted, "success");
  };

  const renderPage = () => {
    switch (page) {
      case 'input': return <InputScreen />;
      case 'quote': return <QuoteViewScreen />;
      case 'favorites': return <FavoritesScreen />;
      case 'journal': return <JournalScreen />;
      case 'explore': return <ExploreThemesScreen />;
      case 'home':
      default: return <HomeScreen />;
    }
  };
  
  const t = translations[language];

  const contextValue: AppContextType = {
      page, setPage,
      language, setLanguage,
      transcription, setTranscription,
      quoteData, setQuoteData,
      error, setError,
      isLoading, setIsLoading,
      apiKeyAvailable,
      searchHistory,
      cachedQuotes,
      addSearchToHistoryAndCache,
      getCachedQuote,
      deleteSearchHistoryItem, // Updated context
      favoriteQuotes,
      toggleFavorite,
      reflections,
      getReflection,
      saveReflection,
      deleteReflection,
      quoteOfTheDay,
      fetchAndSetQuoteOfTheDay,
      showToast,
      isReflectionModalOpen, setIsReflectionModalOpen,
      isShareModalOpen, setIsShareModalOpen,
      modalQuote, setModalQuote,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="bg-neutral-950 w-full h-screen flex justify-center items-center overflow-hidden">
          <Screen>
              <LanguageSwitcher />
              <Header title={t.title} />
              <div className="flex-grow flex flex-col overflow-y-auto no-scrollbar">
                {renderPage()}
              </div>
              <Footer />
              {isReflectionModalOpen && modalQuote && <ReflectionModal />}
              {isShareModalOpen && modalQuote && <ShareModal />}
              <Toast toastInfo={toastInfo} onDismiss={() => setToastInfo(null)} />
          </Screen>
      </div>
    </AppContext.Provider>
  );
};

export default App;
