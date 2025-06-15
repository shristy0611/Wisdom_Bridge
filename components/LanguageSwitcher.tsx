import React, { useContext } from 'react';
import { Languages } from 'lucide-react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType, Language } from '../types';

const LanguageSwitcher: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { language, setLanguage } = context as AppContextType;
    
    const t = translations[language];

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ja' : 'en';
        setLanguage(newLang as Language);
    };

    return (
        <div className="absolute top-3 right-3 z-10">
            <button 
                onClick={toggleLanguage} 
                className="bg-neutral-700/70 hover:bg-neutral-600/70 text-neutral-200 hover:text-amber-300 p-2 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 group relative"
                aria-label={language === 'en' ? "Switch to Japanese" : "Switch to English"}
                title={t.langSwitch}
            >
                <Languages size={14} />
                <span className="sr-only">{t.langSwitch}</span>
                
                {/* Tooltip */}
                <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-neutral-800 text-neutral-200 text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap">
                    {t.langSwitch}
                </span>
            </button>
        </div>
    );
};

export default LanguageSwitcher;
