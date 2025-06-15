import React, { useContext } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType } from '../types';
import QuoteOfTheDayDisplay from './QuoteOfTheDayDisplay'; // Import new component

const HomeScreen: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found");
  const { setPage, language } = context as AppContextType;
  const t = translations[language];

  return (
    <div className="flex flex-col flex-grow justify-center items-center text-center p-4 md:p-6 overflow-y-auto no-scrollbar">
      <div className="p-5 bg-amber-500/10 rounded-full mb-6 shadow-inner shadow-amber-900/30 animate-gentle-pulse">
          <BookOpen size={52} className="text-amber-400" strokeWidth={1.5}/>
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-neutral-100 animate-fade-in-up-delay-1">{t.homeTitle}</h2>
      <p className="text-neutral-400 mb-6 max-w-sm text-base leading-relaxed animate-fade-in-up-delay-2">
        {t.homeSubtitle}
      </p>
      <button
        onClick={() => setPage('input')}
        className="w-full max-w-xs bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold py-3 px-5 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-70"
      >
        <span>{t.startSearching}</span>
        <ChevronRight size={22} className="ml-2" strokeWidth={2.5}/>
      </button>

      {/* Quote of the Day Section */}
      <QuoteOfTheDayDisplay />
      
    </div>
  );
};

export default HomeScreen;
