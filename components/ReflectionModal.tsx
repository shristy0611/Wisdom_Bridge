import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType, ReflectionItem } from '../types';
import { X, Save, Trash2 } from 'lucide-react';

const ReflectionModal: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found in ReflectionModal");

  const {
    language,
    modalQuote,
    isReflectionModalOpen,
    setIsReflectionModalOpen,
    getReflection,
    saveReflection,
    deleteReflection,
    showToast
  } = context as AppContextType;
  const t = translations[language];

  const [reflectionText, setReflectionText] = useState('');
  const [existingReflection, setExistingReflection] = useState<ReflectionItem | undefined>(undefined);

  useEffect(() => {
    if (isReflectionModalOpen && modalQuote) {
      const currentReflection = getReflection(modalQuote.id);
      setExistingReflection(currentReflection);
      setReflectionText(currentReflection?.text || '');
    } else {
      setReflectionText('');
      setExistingReflection(undefined);
    }
  }, [isReflectionModalOpen, modalQuote, getReflection]);

  if (!isReflectionModalOpen || !modalQuote) return null;

  const handleSave = () => {
    if (reflectionText.trim() === '' && existingReflection) {
        // If text is cleared for an existing reflection, consider it a delete
        if (window.confirm(t.confirmDeleteReflection)) {
            deleteReflection(modalQuote.id);
            setIsReflectionModalOpen(false);
        }
    } else if (reflectionText.trim() !== '') {
        saveReflection(modalQuote.id, reflectionText.trim());
        setIsReflectionModalOpen(false);
    } else {
        // Text is empty and no existing reflection, just close or show a message
        setIsReflectionModalOpen(false); // Or showToast("Cannot save empty reflection", "error");
    }
  };

  const handleDelete = () => {
    if (existingReflection) {
      if (window.confirm(t.confirmDeleteReflection)) {
        deleteReflection(modalQuote.id);
        setIsReflectionModalOpen(false);
      }
    } else {
        showToast(language === 'en' ? 'Nothing to delete.' : '削除するものがありません。', 'error')
    }
  };
  
  const quoteSnippet = modalQuote.quote.substring(0, 50);
  const modalTitle = t.reflectionForQuote.replace('{quoteSnippet}', quoteSnippet);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflection-modal-title"
    >
      <div className="bg-neutral-800 p-5 rounded-lg shadow-2xl w-full max-w-lg relative text-neutral-100 border border-neutral-700">
        <button
          onClick={() => setIsReflectionModalOpen(false)}
          className="absolute top-3 right-3 text-neutral-400 hover:text-amber-400 transition-colors"
          aria-label={t.closeModal}
        >
          <X size={24} />
        </button>

        <h2 id="reflection-modal-title" className="text-xl font-semibold text-amber-400 mb-1">{existingReflection ? t.editReflection : t.addReflection}</h2>
        <p className="text-xs text-neutral-400 mb-4 italic">{modalTitle}</p>
        
        <textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder={t.reflectionPlaceholder}
          className="w-full p-3 bg-neutral-900 border border-neutral-600 rounded-md text-neutral-100 placeholder-neutral-500 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200 min-h-[150px] resize-y text-sm"
          rows={6}
          aria-label={t.reflectionPlaceholder}
        />

        <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          {existingReflection && (
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-medium transition-colors text-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
            >
              <Trash2 size={16} className="mr-2" />
              {t.deleteReflection}
            </button>
          )}
          <button
            onClick={() => setIsReflectionModalOpen(false)}
            className="px-5 py-2.5 rounded-lg bg-neutral-600 hover:bg-neutral-500 text-neutral-100 font-medium transition-colors text-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-neutral-800"
            >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={reflectionText.trim() === '' && !existingReflection} // Disable if new and empty
            className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-neutral-900 font-semibold transition-colors text-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={16} className="mr-2" />
            {t.saveReflection}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReflectionModal;
