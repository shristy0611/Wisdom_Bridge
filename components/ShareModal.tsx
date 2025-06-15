import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { translations } from '../constants';
import { AppContextType } from '../types';
import { X, Copy, Mail, ExternalLink, Share2, Loader2 } from 'lucide-react'; // Added Loader2

const ShareModal: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found in ShareModal");

  const {
    language,
    modalQuote,
    isShareModalOpen,
    setIsShareModalOpen,
    showToast,
  } = context as AppContextType;

  const t = translations[language]; // Initialize translations
  const [isSharingViaSystem, setIsSharingViaSystem] = useState(false);

  if (!isShareModalOpen || !modalQuote) return null;

  const fullQuoteText = `"${modalQuote.quote}"\n- ${modalQuote.citation}\n\n${t.analysis}:\n${modalQuote.analysis}`;
  const shareTitle = language === 'en' ? "Wisdom from The New Human Revolution" : "新・人間革命からの知恵";

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullQuoteText);
      showToast(t.copiedSuccess, 'success');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast(language === 'en' ? 'Failed to copy.' : 'コピーに失敗しました。', 'error');
    }
    setIsShareModalOpen(false);
  };
  
  const handleNativeShare = async () => {
    if (navigator.share && !isSharingViaSystem) {
      setIsSharingViaSystem(true);
      try {
        await navigator.share({
          title: shareTitle,
          text: fullQuoteText,
          // url: window.location.href, // Or a specific link to the quote if available
        });
        // If share is successful, the modal can be closed here or it might close automatically depending on OS behavior.
        // For consistency, we'll close it.
        setIsShareModalOpen(false);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // User cancelled the share operation
          console.info('Share canceled by user.');
          // No error toast needed for user cancellation
        } else {
          // Other error
          console.error('Error sharing:', error);
          // Optionally, show a generic error toast for actual failures
          // showToast(language === 'en' ? 'Sharing failed.' : '共有に失敗しました。', 'error');
        }
      } finally {
        setIsSharingViaSystem(false);
        // Ensure modal is closed if share attempt is finished, even if it failed and wasn't an AbortError.
        // It might already be closed if successful, but this is a safeguard.
        // However, if we want to keep it open on error (non-AbortError), this should be conditional.
        // For now, let's keep it simple: close if share attempt ends.
        // If it was AbortError, modal can stay open or close based on desired UX.
        // Current behavior: if it's not success, it will remain open unless closed by other means.
        // Let's refine: modal closes on success, stays open on user cancel (AbortError), stays open on other errors
        // So, setIsShareModalOpen(false) should only be on success.
      }
    } else if (!navigator.share) {
        // Fallback for browsers that don't support navigator.share
        handleShareViaEmail();
    }
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(fullQuoteText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsShareModalOpen(false);
  };

  const handleShareViaTwitter = () => {
    const text = encodeURIComponent(`"${modalQuote.quote}" - ${modalQuote.citation} #WisdomBridge #DaisakuIkeda`);
    // const url = encodeURIComponent(window.location.href); // Optional URL
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    setIsShareModalOpen(false);
  };
  
  const quoteSnippet = modalQuote.quote.substring(0, 50);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="bg-neutral-800 p-5 rounded-lg shadow-2xl w-full max-w-md relative text-neutral-100 border border-neutral-700">
        <button
          onClick={() => setIsShareModalOpen(false)}
          className="absolute top-3 right-3 text-neutral-400 hover:text-amber-400 transition-colors"
          aria-label={t.closeModal}
        >
          <X size={24} />
        </button>

        <h2 id="share-modal-title" className="text-xl font-semibold text-amber-400 mb-1">{t.shareQuote}</h2>
        <p className="text-xs text-neutral-400 mb-5 italic">"{quoteSnippet}..."</p>
        
        <div className="space-y-3">
            {navigator.share && (
                 <button
                    onClick={handleNativeShare}
                    disabled={isSharingViaSystem}
                    className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isSharingViaSystem ? (
                        <Loader2 size={18} className="mr-2.5 animate-spin" />
                    ) : (
                        <Share2 size={18} className="mr-2.5" />
                    )}
                    {language === 'en' ? 'Share via System Dialog' : 'システムダイアログで共有'}
                  </button>
            )}

            <button
                onClick={handleCopyToClipboard}
                disabled={isSharingViaSystem}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-70"
            >
                <Copy size={18} className="mr-2.5" />
                {t.copyToClipboard}
            </button>

            {/* Show email and Twitter as alternatives or if native share isn't available */}
            <button
                onClick={handleShareViaEmail}
                disabled={isSharingViaSystem}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-70"
                >
                <Mail size={18} className="mr-2.5" />
                {t.shareViaEmail}
            </button>
           
            <button
                onClick={handleShareViaTwitter}
                disabled={isSharingViaSystem}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-70"
            >
                <ExternalLink size={18} className="mr-2.5" /> {/* Using generic link icon as X logo might change */}
                {t.shareViaTwitter}
            </button>
        </div>

        <button
          onClick={() => setIsShareModalOpen(false)}
          disabled={isSharingViaSystem}
          className="mt-6 w-full px-4 py-2.5 rounded-lg bg-neutral-600 hover:bg-neutral-500 text-neutral-100 font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-70"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
};

export default ShareModal;