import React, { useContext } from 'react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType, QuoteData } from '../types';
import Header from './Header';
import QuoteCard from './QuoteCard'; // Reusable card
import { Frown } from 'lucide-react';

const FavoritesScreen: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found in FavoritesScreen");
  
  const { favoriteQuotes, language, setPage, setQuoteData } = context as AppContextType;
  const t = translations[language];

  const handleViewQuoteDetails = (quote: QuoteData) => {
    setQuoteData([quote]); // Set this as the quote to view
    setPage('quote');     // Navigate to the quote view screen
  };

  return (
    <div className="flex flex-col h-full">
      <Header title={t.favoritesTitle} />
      {favoriteQuotes.length === 0 ? (
        <div className="flex-grow flex flex-col justify-center items-center text-center p-4 text-neutral-400">
          <Frown size={48} className="mb-4 text-neutral-500" />
          <p className="mb-2 text-lg">{t.noFavoritesMessage}</p>
          <button
            onClick={() => setPage('input')}
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {t.startSearching}
          </button>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar">
          {favoriteQuotes.map(quote => (
            <QuoteCard 
              key={quote.id} 
              quoteItem={quote}
              onViewDetails={handleViewQuoteDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesScreen;
