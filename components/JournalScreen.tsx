import React, { useContext } from 'react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType, QuoteData, ReflectionItem } from '../types';
import Header from './Header';
import QuoteCard from './QuoteCard';
import { BookMarked } from 'lucide-react';

const JournalScreen: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found in JournalScreen");
  
  const { reflections, favoriteQuotes, getCachedQuote, searchHistory, language, setPage, setQuoteData, quoteData: currentGlobalQuoteData } = context as AppContextType;
  const t = translations[language];

  const reflectionQuoteIds = Object.keys(reflections);
  
  let quotesWithReflections: { quote: QuoteData, reflection: ReflectionItem }[] = [];

  reflectionQuoteIds.forEach(quoteId => {
    const reflection = reflections[quoteId];
    if (!reflection) return;

    let foundQuote: QuoteData | undefined;

    // 1. Check currentGlobalQuoteData (quotes being viewed on QuoteViewScreen)
    foundQuote = currentGlobalQuoteData?.find(q => q.id === quoteId);

    // 2. Check favoriteQuotes
    if (!foundQuote) {
      foundQuote = favoriteQuotes.find(q => q.id === quoteId);
    }
    
    // 3. Check Quote of the Day (if it matches)
    if (!foundQuote && context.quoteOfTheDay?.quote.id === quoteId) {
        foundQuote = context.quoteOfTheDay.quote;
    }

    // 4. Check cachedQuotes using the language of the original search
    if (!foundQuote) {
      for (const historyItem of searchHistory) {
        // Use historyItem.language for accurate cache lookup
        const cached = getCachedQuote(historyItem.theme, historyItem.language); 
        if (cached) {
          const cq = cached.find(q => q.id === quoteId);
          if (cq) {
            foundQuote = cq;
            break; 
          }
        }
      }
    }
    
    if (foundQuote) {
      // Ensure the favorite status is up-to-date from the central favoriteQuotes list
      const isFav = favoriteQuotes.some(fav => fav.id === foundQuote!.id);
      quotesWithReflections.push({ 
        quote: { ...foundQuote, isFavorite: isFav }, 
        reflection 
      });
    }
  });

  // Sort by reflection timestamp, newest first
  quotesWithReflections.sort((a,b) => b.reflection.timestamp - a.reflection.timestamp);


  const handleViewQuoteDetails = (quote: QuoteData) => {
    setQuoteData([quote]);
    setPage('quote');
  };

  return (
    <div className="flex flex-col h-full">
      <Header title={t.journalTitle} />
      {quotesWithReflections.length === 0 ? (
        <div className="flex-grow flex flex-col justify-center items-center text-center p-6 text-neutral-400">
          <BookMarked size={48} className="mb-4 text-neutral-500" />
          <p className="mb-2 text-lg">{t.noReflectionsMessage}</p>
           <button
            onClick={() => setPage('input')}
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {t.startSearching}
          </button>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar">
          {quotesWithReflections.map(item => (
            <QuoteCard 
              key={item.quote.id} 
              quoteItem={item.quote}
              reflectionText={item.reflection.text}
              onViewDetails={handleViewQuoteDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalScreen;
