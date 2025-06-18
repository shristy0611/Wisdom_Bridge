import React, { useContext } from 'react';
import { AppContext } from '../App';
import { translations, PREDEFINED_THEMES, API_KEY_ERROR, GEMINI_FETCH_ERROR } from '../constants';
import { AppContextType } from '../types';
import { fetchGuidanceFromGemini } from '../services/geminiService';
import Header from './Header';
import { Loader2 } from 'lucide-react';

const ExploreThemesScreen: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found in ExploreThemesScreen");
  
  const { 
    language, 
    setPage, 
    setQuoteData, 
    setError, 
    setIsLoading, 
    isLoading,
    apiKeyAvailable,
    addSearchToHistoryAndCache,
    getCachedQuote, // Added for cache checking
    setTranscription 
  } = context as AppContextType;
  const t = translations[language];

  const handleThemeSelect = async (themeKey: string, themeDisplay: string) => {
    if (!apiKeyAvailable) {
        setError(API_KEY_ERROR);
        // Error will be displayed by QuoteViewScreen or a global handler if any
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setTranscription(themeDisplay);

    // --- Cache Check ---
    const cachedData = getCachedQuote(themeDisplay, language);
    if (cachedData) {
        setQuoteData(cachedData);
        addSearchToHistoryAndCache(themeDisplay, language, cachedData); 
        setPage('quote');
        setIsLoading(false);
        return; // Skip API call
    }
    // --- End Cache Check ---

    try {
      const data = await fetchGuidanceFromGemini(themeDisplay, language);
      setQuoteData(data);
      if (data.length > 0) {
        addSearchToHistoryAndCache(themeDisplay, language, data);
      }
      setPage('quote');
    } catch (err: any) {
      const errorMessage = err.message === API_KEY_ERROR ? t.errorApiKey : 
                           err.message === GEMINI_FETCH_ERROR ? t.errorFetchingGuidance :
                           (language === 'en' ? 'An unexpected error occurred.' : '予期せぬエラーが発生しました。');
      setError(err.message); // Set the raw error for specific handling in QuoteViewScreen
      // Error will be displayed by QuoteViewScreen
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title={t.exploreThemesTitle} />
      <div className="flex-grow overflow-y-auto p-4 no-scrollbar">
        <h2 className="text-xl font-semibold text-amber-400 mb-4 text-center">{t.searchByTheme}</h2>
        {isLoading && (
          <div className="flex justify-center items-center my-8">
            <Loader2 size={32} className="animate-spin text-amber-500" />
            <p className="ml-3 text-neutral-300">{t.statusProcessing}</p>
          </div>
        )}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PREDEFINED_THEMES.map(theme => {
              const themeName = language === 'ja' ? theme.ja : theme.en;
              return (
                <button
                  key={theme.key}
                  onClick={() => handleThemeSelect(theme.key, themeName)}
                  className="bg-neutral-800 hover:bg-amber-600/20 hover:border-amber-500 border-2 border-neutral-700 text-neutral-200 hover:text-amber-400 font-medium py-4 px-3 rounded-lg transition-all duration-200 ease-in-out text-center shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-70"
                  disabled={isLoading}
                >
                  {themeName}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreThemesScreen;