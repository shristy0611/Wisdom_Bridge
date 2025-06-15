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
    // Fetch QOTD if not already loaded for today or if quote object is missing
    if (!quoteOfTheDay || !quoteOfTheDay.quote?.id ) { 
      fetchAndSetQuoteOfTheDay().catch(err => {
        // Error already logged in App.tsx, can show toast here if desired
        // showToast(t.errorFetchingQuoteOfTheDay, 'error');
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndSetQuoteOfTheDay]); // Run once on mount and when function reference changes (should be stable)

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
      <div className="mt-6 p-4 bg-neutral-800/60 rounded-lg shadow-md w-full max-w-sm text-center animate-pulse">
        <Loader2 size={24} className="mx-auto animate-spin text-amber-500 mb-2" />
        <p className="text-sm text-neutral-400">{t.loadingQuoteOfTheDay}</p>
      </div>
    );
  }
  
  if (!quoteOfTheDay?.quote?.id) { // Error or no QOTD available
     return (
      <div className="mt-6 p-4 bg-neutral-800/60 rounded-lg shadow-md w-full max-w-sm text-center">
        <AlertTriangle size={24} className="mx-auto text-rose-400 mb-2" />
        <p className="text-sm text-neutral-400">{t.noQuoteOfTheDay}</p>
      </div>
    );
  }

  const qotd = quoteOfTheDay.quote;
  const quoteSnippet = qotd.quote.length > 120 ? qotd.quote.substring(0, 120) + "..." : qotd.quote;

  return (
    <div className="mt-6 p-4 bg-neutral-800/80 rounded-lg shadow-xl w-full max-w-sm animate-fade-in-up">
      <h3 className="text-lg font-semibold text-amber-400 mb-3 text-center">{t.quoteOfTheDayTitle}</h3>
      <blockquote className="mb-3">
        <p className="italic text-neutral-200 text-sm leading-relaxed">"{quoteSnippet}"</p>
        <cite className="block text-xs text-amber-500/90 mt-2 text-right not-italic">- {qotd.citation}</cite>
      </blockquote>
      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-700/50">
        <button
            onClick={() => toggleFavorite(qotd)}
            className={`p-2 rounded-full hover:bg-neutral-700/70 transition-colors 
                        ${qotd.isFavorite ? 'text-rose-400' : 'text-neutral-400 hover:text-rose-300'}`}
            aria-label={qotd.isFavorite ? t.removeFromFavorites : t.addToFavorites}
            title={qotd.isFavorite ? t.removeFromFavorites : t.addToFavorites}
        >
            <Heart size={18} fill={qotd.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
            onClick={() => handleShareQotD(qotd)}
            className="p-2 rounded-full text-neutral-400 hover:text-green-300 hover:bg-neutral-700/70 transition-colors"
            aria-label={t.shareQuote}
            title={t.shareQuote}
        >
            <Share2 size={18} />
        </button>
        <button
            onClick={() => handleViewFullQuote(qotd)}
            className="p-2 rounded-full text-neutral-400 hover:text-amber-300 hover:bg-neutral-700/70 transition-colors"
            aria-label={language === 'en' ? "View Full Quote" : "全文を見る"}
            title={language === 'en' ? "View Full Quote" : "全文を見る"}
        >
            <Eye size={18} />
        </button>
      </div>
    </div>
  );
};

export default QuoteOfTheDayDisplay;
