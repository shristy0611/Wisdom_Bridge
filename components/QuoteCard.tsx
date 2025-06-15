import React, { useContext } from 'react';
import { QuoteData, AppContextType } from '../types';
import { AppContext } from '../App';
import { translations } from '../constants';
import { Heart, MessageSquareText, Share2, Eye } from 'lucide-react';

interface QuoteCardProps {
  quoteItem: QuoteData;
  showAnalysis?: boolean;
  onViewDetails?: (quote: QuoteData) => void; // e.g. navigate to full view or open modal
  reflectionText?: string | null;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quoteItem, showAnalysis = false, onViewDetails, reflectionText }) => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found in QuoteCard");
  
  const { 
    language, 
    toggleFavorite, 
    setModalQuote, 
    setIsReflectionModalOpen, 
    setIsShareModalOpen,
    setPage,
    setQuoteData
  } = context as AppContextType;
  const t = translations[language];

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if button is on card
    toggleFavorite(quoteItem);
  };

  const handleOpenReflectionModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalQuote(quoteItem);
    setIsReflectionModalOpen(true);
  };

  const handleOpenShareModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalQuote(quoteItem);
    setIsShareModalOpen(true);
  };

  const handleViewFullQuote = () => {
    if (onViewDetails) {
        onViewDetails(quoteItem);
    } else {
        // Default action: set this quote as the main one and go to quote view
        setQuoteData([quoteItem]);
        setPage('quote');
    }
  };

  const quoteSnippet = quoteItem.quote.length > 100 ? quoteItem.quote.substring(0, 100) + "..." : quoteItem.quote;

  return (
    <div 
        className="bg-neutral-800/80 p-4 rounded-lg shadow-md hover:bg-neutral-700/70 transition-colors cursor-pointer"
        onClick={handleViewFullQuote}
        role="article"
        aria-labelledby={`quote-card-title-${quoteItem.id}`}
    >
      <p id={`quote-card-title-${quoteItem.id}`} className="italic text-neutral-200 mb-2 leading-relaxed">"{quoteSnippet}"</p>
      <p className="text-xs text-amber-500 font-medium mb-3">{quoteItem.citation}</p>
      
      {showAnalysis && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-amber-400 mb-1">{t.analysis}</h4>
          <p className="text-xs text-neutral-300 whitespace-pre-wrap">{quoteItem.analysis.substring(0,150)}...</p>
        </div>
      )}

      {reflectionText && (
         <div className="mb-3 mt-2 border-t border-neutral-700 pt-2">
            <h4 className="text-sm font-semibold text-sky-400 mb-1">{language === 'en' ? 'Your Reflection:' : 'あなたの感想:'}</h4>
            <p className="text-xs text-neutral-300 italic">"{reflectionText.substring(0,120)}{reflectionText.length > 120 ? '...' : ''}"</p>
        </div>
      )}

      <div className="flex items-center justify-end space-x-2 mt-2 pt-2 border-t border-neutral-700/50">
        <button
          onClick={handleToggleFavorite}
          className={`p-2 rounded-full hover:bg-neutral-600/50 transition-colors 
                      ${quoteItem.isFavorite ? 'text-rose-400' : 'text-neutral-400 hover:text-rose-300'}`}
          aria-label={quoteItem.isFavorite ? t.removeFromFavorites : t.addToFavorites}
          title={quoteItem.isFavorite ? t.removeFromFavorites : t.addToFavorites}
        >
          <Heart size={18} fill={quoteItem.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleOpenReflectionModal}
          className={`p-2 rounded-full hover:bg-neutral-600/50 transition-colors
                      ${reflectionText ? 'text-sky-400' : 'text-neutral-400 hover:text-sky-300'}`}
          aria-label={reflectionText ? t.editReflection : t.addReflection}
          title={reflectionText ? t.editReflection : t.addReflection}
        >
          <MessageSquareText size={18} />
        </button>
        <button
          onClick={handleOpenShareModal}
          className="p-2 rounded-full text-neutral-400 hover:text-green-300 hover:bg-neutral-600/50 transition-colors"
          aria-label={t.shareQuote}
          title={t.shareQuote}
        >
          <Share2 size={18} />
        </button>
         <button
          onClick={handleViewFullQuote}
          className="p-2 rounded-full text-neutral-400 hover:text-amber-300 hover:bg-neutral-600/50 transition-colors"
          aria-label={language === 'en' ? "View Details" : "詳細を見る"}
          title={language === 'en' ? "View Details" : "詳細を見る"}
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  );
};

export default QuoteCard;
