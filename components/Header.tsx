
import React, { useContext } from 'react';
import { AppContext } from '../App'; // Assuming AppContext provides language
import { AppContextType } from '../types';


interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found in Header");
  const { language } = context as AppContextType;

  const titleFontClass = language === 'ja' ? "font-['Yuji_Syuku']" : "font-['Noto_Serif']";
  const titleSizeClass = language === 'ja' ? "text-3xl" : "text-4xl"; // Noto Serif can be larger like Caveat was

  return (
    <header className="py-3 text-center border-b border-neutral-700/70 flex-shrink-0">
      <h1 className={`${titleFontClass} ${titleSizeClass} font-bold text-amber-400 tracking-wide`}>{title}</h1>
    </header>
  );
};

export default Header;