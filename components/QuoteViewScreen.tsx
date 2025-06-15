import React, { useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    if (quotes && quotes.length > 0) {
      setCurrentQuoteIndex(0);
    }
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
            <p className="text-neutral-400 mb-8">{t.findingQuoteSubtitle}</p>
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
            <p className="text-neutral-400 mb-8">
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
    <div className="flex flex-col flex-grow p-4 md:p-6 space-y-4 overflow-y-auto no-scrollbar pt-6 pb-4">
        {currentQuote && (
          <>
            <div className="bg-neutral-800/70 p-4 md:p-5 rounded-lg shadow-lg relative">
                <p className="text-lg md:text-xl italic text-neutral-100 leading-relaxed text-center">"{currentQuote.quote}"</p>
                <p className="mt-3 text-amber-400 font-semibold text-center text-xs md:text-sm">{currentQuote.citation}</p>
            </div>
            
            <div className="bg-neutral-800/70 p-4 md:p-5 rounded-lg shadow-lg">
                <h3 className="text-md font-semibold text-amber-500 mb-2">{t.analysis}</h3>
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{currentQuote.analysis}</p>
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

        {quotes.length > 1 && (
            <div className="flex items-center justify-center space-x-4 pt-2">
                <button 
                    onClick={() => navigateQuote('prev')}
                    disabled={currentQuoteIndex === 0}
                    className="p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                    aria-label={language === 'en' ? "Previous Quote" : "前の引用"}
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="text-sm text-neutral-400 font-medium">
                    {t.quoteIndicator
                        .replace('{current}', (currentQuoteIndex + 1).toString())
                        .replace('{total}', quotes.length.toString())}
                </span>
                <button 
                    onClick={() => navigateQuote('next')}
                    disabled={currentQuoteIndex === quotes.length - 1}
                    className="p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                    aria-label={language === 'en' ? "Next Quote" : "次の引用"}
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        )}

        <button
            onClick={() => setPage('input')}
            className="mt-4 mb-2 mx-auto bg-neutral-700 hover:bg-neutral-600 text-neutral-100 hover:text-amber-300 font-medium py-3 px-8 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-neutral-900 flex-shrink-0"
        >
            <Mic size={18} className="mr-2.5" />
            <span>{t.findAnother}</span>
        </button>
    </div>
  );
};

export default QuoteViewScreen;
