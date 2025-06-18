import React, { useContext } from 'react';
import { Mic, BookOpen, Home as HomeIcon, Heart, BookText, Compass } from 'lucide-react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType, Page } from '../types';

const Footer: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { setPage, page, language, quoteData } = context as AppContextType;
    
    const t = translations[language];
    
    const navItems = [
        { name: 'home', icon: HomeIcon, label: t.footerHome, pageName: 'home' as Page },
        { name: 'input', icon: Mic, label: t.footerInput, pageName: 'input' as Page },
        { 
            name: 'quote', 
            icon: BookOpen, 
            label: t.footerQuote, 
            pageName: 'quote' as Page, 
            disabled: (!quoteData || quoteData.length === 0) && page !== 'quote' 
        },
        { 
            name: 'favorites', 
            icon: Heart, 
            label: t.footerFavorites, 
            pageName: 'favorites' as Page,
        },
        { 
            name: 'journal', 
            icon: BookText, 
            label: t.footerJournal, 
            pageName: 'journal' as Page,
        },
        { name: 'explore', icon: Compass, label: t.footerExplore, pageName: 'explore' as Page },
    ];

    return (
        <footer className="mt-auto w-full border-t border-neutral-700/70 p-1 flex-shrink-0 bg-neutral-900">
            <nav className="flex justify-around">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = page === item.pageName;
                    return (
                         <button 
                            key={item.name}
                            onClick={() => setPage(item.pageName)} 
                            disabled={item.disabled}
                            className={`flex flex-col items-center flex-1 py-2 rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-amber-500 relative
                                ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-700/50'}
                                ${item.disabled ? 'opacity-40 cursor-not-allowed hover:text-neutral-400 hover:bg-transparent' : ''}`}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon size={22} strokeWidth={isActive? 2.5 : 2} />
                            <span className={`text-xs mt-1 ${isActive ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </footer>
    );
};

export default Footer;
