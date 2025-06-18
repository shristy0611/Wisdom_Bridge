import React, { useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType, QuoteData } from '../types';
import { Loader2, Heart, Share2, AlertTriangle, Eye } from 'lucide-react';

const QuoteOfTheDayDisplay: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found in QuoteOfTheDayDisplay");

  const {
    quoteOfTheDay,
    fetchAndSetQuoteOfTheDay,
    language,
    toggleFavorite,
    setModalQuote,
    setIsShareModalOpen,
    setPage,
    setQuoteData,
    showToast
  } = context as AppContextType;
  const t = translations[language];

  useEffect(() => {
    // Fetch QOTD if:
    // 1. Not already loaded
    // 2. Quote object is missing
    // 3. Language of the quote doesn't match current UI language
    if (!quoteOfTheDay || 
        !quoteOfTheDay.quote?.id || 
        quoteOfTheDay.language !== language) { 
      fetchAndSetQuoteOfTheDay().catch(err => {
        // Error already logged in App.tsx, can show toast here if desired
        // showToast(t.errorFetchingQuoteOfTheDay, 'error');
      });
    }
  // Include language in the dependency array to refetch when language changes
  }, [fetchAndSetQuoteOfTheDay, language, quoteOfTheDay]);

  const handleViewFullQuote = (qotd: QuoteData) => {
    setQuoteData([qotd]);
    setPage('quote');
  };
  
  const handleShareQotD = (qotd: QuoteData) => {
    setModalQuote(qotd);
    setIsShareModalOpen(true);
  };


  if (!quoteOfTheDay && !context.error?.includes(t.errorFetchingQuoteOfTheDay)) { // Initial loading state (no error yet)
    return (
      <div className="mt-8 p-5 bg-neutral-800/60 rounded-lg shadow-md w-full max-w-md text-center animate-pulse">
        <Loader2 size={28} className="mx-auto animate-spin text-amber-500 mb-3" />
        <p className="text-base text-neutral-400">{t.loadingQuoteOfTheDay}</p>
      </div>
    );
  }
  
  if (!quoteOfTheDay?.quote?.id) { // Error or no QOTD available
     return (
      <div className="mt-8 p-5 bg-neutral-800/60 rounded-lg shadow-md w-full max-w-md text-center">
        <AlertTriangle size={28} className="mx-auto text-rose-400 mb-3" />
        <p className="text-base text-neutral-400">{t.noQuoteOfTheDay}</p>
      </div>
    );
  }

  // If the quote language doesn't match the UI language, show loading state while fetching
  if (quoteOfTheDay.language !== language) {
    return (
      <div className="mt-8 p-5 bg-neutral-800/60 rounded-lg shadow-md w-full max-w-md text-center animate-pulse">
        <Loader2 size={28} className="mx-auto animate-spin text-amber-500 mb-3" />
        <p className="text-base text-neutral-400">{t.loadingQuoteOfTheDay}</p>
      </div>
    );
  }

  const qotd = quoteOfTheDay.quote;
  const quoteSnippet = qotd.quote.length > 140 ? qotd.quote.substring(0, 140) + "..." : qotd.quote;

  return (
    <div className="mt-8 p-5 bg-neutral-800/80 rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
      <h3 className="text-xl font-semibold text-amber-400 mb-4 text-center">{t.quoteOfTheDayTitle}</h3>
      <blockquote className="mb-4">
        <p className="italic text-neutral-200 text-base md:text-lg leading-relaxed">"{quoteSnippet}"</p>
        <cite className="block text-sm text-amber-500/90 mt-3 text-right not-italic">- {qotd.citation}</cite>
      </blockquote>
      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-700/50">
        <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(qotd);
            }}
            className={`p-3 rounded-full hover:bg-neutral-700/70 transition-colors 
                        ${qotd.isFavorite ? 'text-rose-400' : 'text-neutral-400 hover:text-rose-300'}`}
            aria-label={qotd.isFavorite ? t.removeFromFavorites : t.addToFavorites}
            title={qotd.isFavorite ? t.removeFromFavorites : t.addToFavorites}
        >
            <Heart size={20} fill={qotd.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShareQotD(qotd);
            }}
            className="p-3 rounded-full text-neutral-400 hover:text-green-300 hover:bg-neutral-700/70 transition-colors"
            aria-label={t.shareQuote}
            title={t.shareQuote}
        >
            <Share2 size={20} />
        </button>
        <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewFullQuote(qotd);
            }}
            className="p-3 rounded-full text-neutral-400 hover:text-amber-300 hover:bg-neutral-700/70 transition-colors"
            aria-label={language === 'en' ? "View Full Quote" : "全文を見る"}
            title={language === 'en' ? "View Full Quote" : "全文を見る"}
        >
            <Eye size={20} />
        </button>
      </div>
    </div>
  );
};

export default QuoteOfTheDayDisplay;
