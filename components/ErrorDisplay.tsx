import React, { useContext } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType } from '../types';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  linkText?: string;
  linkUrl?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry, linkText, linkUrl }) => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { language } = context as AppContextType;
    const t = translations[language];

    return (
        <div className="bg-rose-900/40 border border-rose-600/60 text-neutral-100 p-4 rounded-lg flex flex-col items-center text-center m-4 shadow-md">
            <AlertTriangle className="text-rose-400 mb-3" size={32} />
            <h3 className="font-semibold text-rose-300 mb-2">{t.errorTitle}</h3>
            <p className="mb-4 text-rose-200/90 text-base md:text-lg">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-70"
                >
                    {t.retry}
                </button>
            )}
            {linkText && linkUrl && (
                <a 
                    href={linkUrl}
                    className="text-rose-300 hover:text-rose-200 underline mt-3 text-base md:text-lg"
                >
                    {linkText}
                </a>
            )}
        </div>
    );
};

export default ErrorDisplay;
