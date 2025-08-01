import React, { useContext, useState, useEffect, useRef } from 'react';
import { Mic, ChevronLeft, ChevronRight, Heart, Share2, MessageSquarePlus } from 'lucide-react';
import { AppContext } from '../App';
import { translations, API_KEY_ERROR, GEMINI_FETCH_ERROR } from '../constants';
import ErrorDisplay from './ErrorDisplay';
import { AppContextType, QuoteData } from '../types';

const QuoteViewScreen: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found");
  const { 
    quoteData: quotes, 
    error: globalError, 
    setPage, 
    language, 
    isLoading, 
    setError, 
    setIsLoading,
    toggleFavorite,
    setIsReflectionModalOpen,
    setIsShareModalOpen,
    setModalQuote,
    getReflection,
  } = context as AppContextType;
  
  const t = translations[language];
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  
  // Store previous quotes to compare in the effect
  const previousQuotesRef = useRef<QuoteData[] | null>(null);

  // Only reset the index when quotes have actually changed (not just properties like isFavorite)
  useEffect(() => {
    // When quotes is null or empty, allow resetting index
    if (!quotes || quotes.length === 0) {
      setCurrentQuoteIndex(0);
      previousQuotesRef.current = quotes;
      return;
    }
    
    // Handle first load of quotes
    if (!previousQuotesRef.current) {
      setCurrentQuoteIndex(0);
      previousQuotesRef.current = quotes;
      return;
    }
    
    // Check if the quotes array has actually changed in content, not just properties
    const prevQuotes = previousQuotesRef.current;
    const quotesChanged = 
      prevQuotes.length !== quotes.length ||
      quotes.some((quote, i) => quote.id !== prevQuotes[i]?.id);
    
    if (quotesChanged) {
      setCurrentQuoteIndex(0);
    }
    
    previousQuotesRef.current = quotes;
  }, [quotes]);
  
  const handleRetry = () => {
    setError(null);
    setIsLoading(false);
    setPage('input');
  };

  const currentQuote: QuoteData | undefined = quotes?.[currentQuoteIndex];
  const currentReflection = currentQuote ? getReflection(currentQuote.id) : undefined;

  const openReflectionModal = () => {
    if (currentQuote) {
      setModalQuote(currentQuote);
      setIsReflectionModalOpen(true);
    }
  };

  const openShareModal = () => {
    if (currentQuote) {
      setModalQuote(currentQuote);
      setIsShareModalOpen(true);
    }
  };


  if (isLoading && !quotes) {
    return (
        <div className="flex flex-col flex-grow justify-center items-center text-center p-4">
            <h2 className="text-2xl font-semibold mb-4 text-neutral-200">{t.findingQuoteTitle}</h2>
            <p className="text-lg md:text-xl text-neutral-400 mb-8">{t.findingQuoteSubtitle}</p>
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-amber-500"></div>
        </div>
    );
  }
  
  if (globalError) {
    let errorMessage = t.statusError; // Generic fallback
    if (globalError === API_KEY_ERROR) {
      errorMessage = t.errorApiKey;
    } else if (globalError.includes(GEMINI_FETCH_ERROR)) { // Catches GEMINI_FETCH_ERROR and its variants
      errorMessage = t.errorFetchingGuidance;
      if (globalError.includes("(Invalid JSON response)") || globalError.includes("(Invalid JSON array or content)") || globalError.includes("(Invalid data format received)")) {
        errorMessage += (language === 'en' ? " (Invalid data format received from server)" : " (サーバーから無効なデータ形式を受信しました)");
      }
    }
    
    return (
        <div className="flex flex-col flex-grow justify-center">
             <ErrorDisplay message={errorMessage} onRetry={handleRetry} />
        </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
        <div className="flex flex-col flex-grow justify-center items-center text-center p-4">
            <h2 className="text-xl font-semibold mb-4 text-neutral-200">
              {language === 'en' ? 'No guidance found for this theme.' : 'このテーマに関する指導は見つかりませんでした。'}
            </h2>
            <p className="text-lg md:text-xl text-neutral-400 mb-8">
              {language === 'en' ? 'Please try a different theme or refine your search.' : '別のテーマを試すか、検索を調整してください。'}
            </p>
             <button
                onClick={() => setPage('input')}
                className="my-8 mx-auto bg-amber-600 hover:bg-amber-700 text-neutral-900 font-semibold py-3 px-6 rounded-full flex items-center justify-center transition-colors"
            >
                <Mic size={20} className="mr-2" />
                <span>{t.findAnother}</span>
            </button>
        </div>
    );
  }

  const navigateQuote = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuoteIndex < quotes.length - 1) {
      setCurrentQuoteIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentQuoteIndex > 0) {
      setCurrentQuoteIndex(prev => prev - 1);
    }
  };
  
  return (
    <div className="flex flex-col flex-grow p-4 space-y-4 overflow-y-auto no-scrollbar">
        {currentQuote && (
          <>
            <div className="bg-neutral-800/70 p-4 rounded-lg shadow-lg relative">
                <p className="text-xl md:text-2xl italic text-neutral-100 leading-relaxed text-center">"{currentQuote.quote}"</p>
                <p className="mt-3 text-amber-400 font-semibold text-center text-sm md:text-base">{currentQuote.citation}</p>
            </div>
            
            <div className="bg-neutral-800/70 p-4 rounded-lg shadow-lg">
                <h3 className="text-md font-semibold text-amber-500 mb-2">{t.analysis}</h3>
                <p className="text-neutral-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap">{currentQuote.analysis}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-3 pt-2">
                <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (currentQuote) toggleFavorite(currentQuote);
                    }}
                    className={`p-3 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900
                                ${currentQuote.isFavorite ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 focus:ring-rose-500' 
                                                        : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300 hover:text-amber-300 focus:ring-amber-500'}`}
                    aria-label={currentQuote.isFavorite ? t.removeFromFavorites : t.addToFavorites}
                    title={currentQuote.isFavorite ? t.removeFromFavorites : t.addToFavorites}
                >
                    <Heart size={20} fill={currentQuote.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openShareModal();
                    }}
                    className="p-3 rounded-full bg-neutral-700 hover:bg-neutral-600 text-neutral-300 hover:text-amber-300 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                    aria-label={t.shareQuote}
                    title={t.shareQuote}
                >
                    <Share2 size={20} />
                </button>
                <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openReflectionModal();
                    }}
                    className={`p-3 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900
                                ${currentReflection ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 focus:ring-sky-500' 
                                                     : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300 hover:text-amber-300 focus:ring-amber-500'}`}
                    aria-label={currentReflection ? t.editReflection : t.addReflection}
                    title={currentReflection ? t.editReflection : t.addReflection}
                >
                    <MessageSquarePlus size={20} />
                </button>
            </div>
          </>
        )}

        {/* Navigation */}
        {quotes.length > 1 && (
            <div className="flex justify-between items-center pt-2">
                <button
                    onClick={() => navigateQuote('prev')}
                    disabled={currentQuoteIndex === 0}
                    className={`flex items-center space-x-1 py-2 px-4 rounded-full text-base
                            ${currentQuoteIndex === 0 
                                ? 'text-neutral-500 cursor-not-allowed' 
                                : 'text-neutral-300 hover:text-amber-400 hover:bg-neutral-800/50'
                            }`}
                >
                    <ChevronLeft size={18} />
                    <span className="text-sm md:text-base">{t.previousQuote}</span>
                </button>
                <div className="text-neutral-500 text-sm md:text-base">
                    {currentQuoteIndex + 1} / {quotes.length}
                </div>
                <button
                    onClick={() => navigateQuote('next')}
                    disabled={currentQuoteIndex === quotes.length - 1}
                    className={`flex items-center space-x-1 py-2 px-4 rounded-full text-base
                            ${currentQuoteIndex === quotes.length - 1 
                                ? 'text-neutral-500 cursor-not-allowed' 
                                : 'text-neutral-300 hover:text-amber-400 hover:bg-neutral-800/50'
                            }`}
                >
                    <span className="text-sm md:text-base">{t.nextQuote}</span>
                    <ChevronRight size={18} />
                </button>
            </div>
        )}

        <div className="pt-2 text-center">
            <button
                onClick={() => setPage('input')}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 font-medium py-2 px-6 rounded-full inline-flex items-center transition-colors text-sm md:text-base"
            >
                <ChevronLeft size={18} className="mr-1" />
                <span>{t.backToSearch}</span>
            </button>
        </div>
    </div>
  );
};

export default QuoteViewScreen;
