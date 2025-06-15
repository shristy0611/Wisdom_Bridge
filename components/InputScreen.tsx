import React, { useState, useEffect, useContext, useRef } from 'react';
import { Loader2, Search, Mic, MicOff, Trash2, History } from 'lucide-react';
import { AppContext } from '../App';
import { translations, API_KEY_ERROR, GEMINI_FETCH_ERROR } from '../constants';
import { fetchGuidanceFromGemini } from '../services/geminiService';
import { AppContextType, SearchHistoryItem, Language as AppLanguage, QuoteData } from '../types'; // Renamed Language to AppLanguage to avoid conflict
import ErrorDisplay from './ErrorDisplay';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface StatusInfo {
    text: string;
    colorClass: string;
}

const getStatusInfo = (
    currentLanguage: AppLanguage,
    t: typeof translations[AppLanguage],
    speechInitializing: boolean,
    speechSupportError: string | null,
    isListening: boolean,
    themeInputVal: string,
    isLoadingVal: boolean,
    localErrorVal: string | null
): StatusInfo => {
    if (isLoadingVal && !isListening && !speechSupportError && !localErrorVal) {
        return { text: t.statusProcessing, colorClass: 'text-neutral-300' };
    }
    if (localErrorVal && !isLoadingVal) { // Show localError if not loading
        return { text: localErrorVal, colorClass: 'text-rose-400' };
    }
    if (speechInitializing) {
        return { text: currentLanguage === 'en' ? "Initializing voice input..." : "音声入力を初期化中...", colorClass: 'text-neutral-400' };
    }
    if (speechSupportError) {
        return { text: speechSupportError, colorClass: 'text-rose-400' };
    }
    if (isListening) {
        return { text: t.statusListening, colorClass: 'text-neutral-300' };
    }
    // Check if themeInputVal was successfully set by voice and not currently loading or error
    if (themeInputVal.trim() && !isLoadingVal && !localErrorVal && !isListening) {
        // A bit tricky: need to know if the last operation was voice success
        // For simplicity, if themeInput is present and no other overriding status, assume t.statusTap or t.statusVoiceSuccess if applicable.
        // This part might need a more explicit state if we want to preserve "Theme captured" after user types.
        // The original logic checked `statusText === t.statusVoiceSuccess` which is circular.
        // We'll default to t.statusTap if themeInput is present without other conditions.
        // To precisely replicate original `statusText === t.statusVoiceSuccess` check, we'd need another state variable.
        // For now, if input has text and no other status, it's just tap prompt.
    }
    return { text: t.statusTap, colorClass: 'text-neutral-500' };
};


const InputScreen: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { 
        setPage, 
        setQuoteData, 
        setError, 
        language, 
        isLoading, 
        setIsLoading, 
        apiKeyAvailable, 
        error: globalError,
        transcription, 
        setTranscription,
        searchHistory,
        getCachedQuote,
        addSearchToHistoryAndCache,
        deleteSearchHistoryItem
    } = context as AppContextType;

    const t = translations[language];
    const [themeInput, setThemeInput] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [speechSupportError, setSpeechSupportError] = useState<string | null>(null); 
    const [speechInitializing, setSpeechInitializing] = useState<boolean>(true); 
    const [voiceCapturedTheme, setVoiceCapturedTheme] = useState<boolean>(false);
    
    const recognitionRef = useRef<any>(null);
    const accumulatedFinalTranscriptRef = useRef<string>('');

    useEffect(() => {
        // This effect synchronizes localError with globalError or API key issues
        if (globalError === API_KEY_ERROR) {
            setLocalError(t.errorApiKey);
        } else if (globalError === GEMINI_FETCH_ERROR) {
            setLocalError(t.errorFetchingGuidance);
        } else if (globalError) {
            setLocalError(globalError);
        } else {
            // Clear localError if globalError is cleared, UNLESS it's a persistent voice error
            const persistentVoiceErrors = [
                speechSupportError,
                t.statusVoiceError,
                language === 'en' ? "No speech detected. Tap mic to try again." : "音声が検出されませんでした。マイクをタップして再試行してください。",
                language === 'en' ? "Microphone issue. Ensure it's working and permitted." : "マイクに問題があります。動作と権限を確認してください。",
                language === 'en' ? "Microphone access denied. Please enable it in browser settings." : "マイクへのアクセスが拒否されました。ブラウザの設定で有効にしてください。"
            ].filter(Boolean);
            if (localError && !persistentVoiceErrors.includes(localError) && !localError.includes(t.errorApiKey) && !localError.includes(t.errorFetchingGuidance)) {
                 // If localError was something else (e.g. "enter theme") and global error clears, clear local error
                 // setLocalError(null); // This might clear "Please enter theme" too soon. Let user actions clear it.
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalError, t.errorApiKey, t.errorFetchingGuidance, speechSupportError, language]);


    useEffect(() => {
        setSpeechInitializing(true);
        setVoiceCapturedTheme(false);
        let currentRecognitionInstance: any = null;

        try {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognitionAPI) {
                currentRecognitionInstance = new SpeechRecognitionAPI();
                currentRecognitionInstance.continuous = true; 
                currentRecognitionInstance.interimResults = true; 
                currentRecognitionInstance.lang = language === 'ja' ? 'ja-JP' : 'en-US';

                currentRecognitionInstance.onstart = () => {
                    setIsListening(true);
                    setLocalError(null); 
                    accumulatedFinalTranscriptRef.current = ''; 
                    setVoiceCapturedTheme(false);
                };

                currentRecognitionInstance.onresult = (event: any) => {
                    let latestInterimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcriptPart = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            accumulatedFinalTranscriptRef.current += transcriptPart + ' ';
                        } else {
                            latestInterimTranscript = transcriptPart;
                        }
                    }
                    const displayTranscript = (accumulatedFinalTranscriptRef.current + latestInterimTranscript).trim();
                    setThemeInput(displayTranscript);
                    setTranscription(displayTranscript); 
                };

                currentRecognitionInstance.onerror = (event: any) => {
                    let voiceErrorMsg = t.statusVoiceError;
                    if (event.error === 'no-speech') voiceErrorMsg = language === 'en' ? "No speech detected. Tap mic to try again." : "音声が検出されませんでした。マイクをタップして再試行してください。";
                    else if (event.error === 'audio-capture') voiceErrorMsg = language === 'en' ? "Microphone issue. Ensure it's working and permitted." : "マイクに問題があります。動作と権限を確認してください。";
                    else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                        voiceErrorMsg = language === 'en' ? "Microphone access denied. Enable it in browser settings." : "マイクアクセスが拒否されました。ブラウザ設定で有効にしてください。";
                        setSpeechSupportError(voiceErrorMsg); 
                    }
                    setLocalError(voiceErrorMsg);
                    setIsListening(false); 
                    setVoiceCapturedTheme(false);
                };

                currentRecognitionInstance.onend = () => {
                    setIsListening(false);
                    if (themeInput.trim() && !localError && !speechSupportError) {
                        setVoiceCapturedTheme(true);
                    } else {
                        setVoiceCapturedTheme(false);
                    }
                };
                
                recognitionRef.current = currentRecognitionInstance;
                setSpeechSupportError(null); 
            } else {
                const message = language === 'en' ? "Voice input not supported by your browser." : "お使いのブラウザは音声入力に対応していません。";
                setSpeechSupportError(message);
                recognitionRef.current = null;
            }
        } catch (e) {
            const criticalErrorMessage = language === 'en' ? "Voice input system failed to initialize." : "音声入力システムの初期化に失敗しました。";
            setSpeechSupportError(criticalErrorMessage);
            recognitionRef.current = null;
        } finally {
            setSpeechInitializing(false);
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            if (currentRecognitionInstance) currentRecognitionInstance.abort();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, setTranscription, t.statusVoiceError]);


    const handleToggleListening = () => {
        if (!recognitionRef.current) {
            const message = speechSupportError || (language === 'en' ? "Voice input not available." : "音声入力は利用できません。");
            setLocalError(message);
            if (!speechSupportError) setSpeechSupportError(message); 
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setThemeInput(''); 
            setTranscription('');
            accumulatedFinalTranscriptRef.current = ''; 
            setLocalError(null); 
            setVoiceCapturedTheme(false);

            if (recognitionRef.current.lang !== (language === 'ja' ? 'ja-JP' : 'en-US')) {
                recognitionRef.current.lang = language === 'ja' ? 'ja-JP' : 'en-US';
            }
            try {
              recognitionRef.current.start();
            } catch (e: any) {
              let message = language === 'en' ? "Could not start voice input. Check mic permissions." : "音声入力を開始できません。マイク権限を確認してください。";
              if (e.name === 'NotAllowedError' || e.message?.includes('not-allowed')) { 
                message = language === 'en' ? "Microphone access denied. Enable it in browser settings." : "マイクアクセスが拒否されました。ブラウザ設定で有効にしてください。";
                setSpeechSupportError(message); 
              } else if (e.name === 'InvalidStateError') {
                 message = language === 'en' ? "Voice input is already active or invalid. Wait or refresh." : "音声入力が既にアクティブか無効です。待つか更新してください。";
              }
              setLocalError(message);
              setIsListening(false); 
              setVoiceCapturedTheme(false);
            }
        }
    };
    
    const performFetch = async (currentTheme: string) => {
        setIsLoading(true);
        setError(null); 
        setLocalError(null);
        setVoiceCapturedTheme(false); // Reset voice capture status before new search
        setTranscription(currentTheme); 

        try {
            const data = await fetchGuidanceFromGemini(currentTheme, language);
            setQuoteData(data);
            if (data.length > 0) { 
              addSearchToHistoryAndCache(currentTheme, language, data);
            }
            setPage('quote');
        } catch (err: any) {
            const errorMessage = err.message === API_KEY_ERROR ? t.errorApiKey : 
                                 err.message === GEMINI_FETCH_ERROR ? t.errorFetchingGuidance :
                                 (language === 'en' ? 'An unexpected error occurred.' : '予期せぬエラーが発生しました。');
            setError(err.message); 
            setLocalError(errorMessage); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchGuidance = async () => {
      const currentTheme = themeInput.trim();
        if (!currentTheme) {
            setLocalError(language === 'en' ? "Please enter or speak a theme." : "テーマを入力または音声で入力してください。");
            return;
        }
        if (!apiKeyAvailable) {
            setLocalError(t.errorApiKey);
            setError(API_KEY_ERROR); 
            return;
        }

        // --- Cache Check ---
        const cachedData = getCachedQuote(currentTheme, language);
        if (cachedData) {
            setQuoteData(cachedData);
            // Even if from cache, update its history timestamp and position
            addSearchToHistoryAndCache(currentTheme, language, cachedData); 
            setPage('quote');
            setIsLoading(false); // Ensure loading is off if we used cache
            setLocalError(null);
            setError(null);
            setVoiceCapturedTheme(false);
            setTranscription(currentTheme);
            return; // Skip API call
        }
        // --- End Cache Check ---

        await performFetch(currentTheme);
    };

    const handleHistoryItemClick = async (item: SearchHistoryItem) => {
        setThemeInput(item.theme);
        setTranscription(item.theme);
        setLocalError(null);
        setError(null);
        setIsLoading(true); 
        setVoiceCapturedTheme(false);

        const cachedData = getCachedQuote(item.theme, item.language);
        if (cachedData) {
            setQuoteData(cachedData);
            addSearchToHistoryAndCache(item.theme, item.language, cachedData); 
            setIsLoading(false);
            setPage('quote');
        } else {
            // If language of history item is different from current app language,
            // we should technically fetch in item.language, but that complicates UI.
            // For now, fetch in current app language, which matches performFetch.
            await performFetch(item.theme); 
        }
    };
  
  const renderMicButtonContent = () => {
    const baseMicClass = "p-3 w-[52px] h-[52px] flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800";
    if (speechInitializing) {
        return (
            <div className={`${baseMicClass} text-neutral-400 bg-neutral-700/60`} title={language === 'en' ? "Initializing..." : "初期化中..."}>
                <Loader2 size={24} className="animate-spin" />
            </div>
        );
    }
    if (speechSupportError) {
        return (
            <div className={`${baseMicClass} text-neutral-500 bg-neutral-700/60 cursor-not-allowed`} title={speechSupportError}>
                <MicOff size={24} />
            </div>
        );
    }
    if (recognitionRef.current) {
        return (
            <button
                type="button"
                onClick={handleToggleListening}
                disabled={isLoading} 
                title={isListening ? (language === 'en' ? "Stop Listening" : "録音停止") : t.voiceInputTitle}
                className={`${baseMicClass}
                    ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse focus:ring-red-400/70' : 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/70'}
                    ${isLoading ? 'bg-neutral-600 cursor-not-allowed opacity-70' : 'shadow-md hover:shadow-lg'}`}
                aria-pressed={isListening}
            >
                <Mic size={24} className="text-white" />
            </button>
        );
    }
     return ( 
        <div className={`${baseMicClass} text-neutral-500 bg-neutral-700/60 cursor-not-allowed`} title={language === 'en' ? "Voice input unavailable" : "音声入力は利用できません"}>
          <MicOff size={24} />
        </div>
     );
  };
  
  // Determine current status text and color
  let currentStatusText = t.statusTap;
  let currentStatusColorClass = 'text-neutral-500';

  if (isLoading && !isListening && !speechSupportError && !localError) {
      currentStatusText = t.statusProcessing;
      currentStatusColorClass = 'text-neutral-300';
  } else if (localError && !isLoading) {
      currentStatusText = localError;
      currentStatusColorClass = 'text-rose-400';
  } else if (speechInitializing) {
      currentStatusText = language === 'en' ? "Initializing voice input..." : "音声入力を初期化中...";
      currentStatusColorClass = 'text-neutral-400';
  } else if (speechSupportError) {
      currentStatusText = speechSupportError;
      currentStatusColorClass = 'text-rose-400';
  } else if (isListening) {
      currentStatusText = t.statusListening;
      currentStatusColorClass = 'text-neutral-300';
  } else if (voiceCapturedTheme && themeInput.trim()) {
      currentStatusText = t.statusVoiceSuccess;
      currentStatusColorClass = 'text-amber-400';
  }


  return (
    <div className="flex flex-col flex-grow p-4 md:p-6 justify-between">
      <div className="flex-grow">
        <p id="status-paragraph" className={`text-center min-h-[2.25rem] mb-3 text-sm ${currentStatusColorClass}`}>
            {currentStatusText}
        </p>
        
        {localError && !isLoading && ( // Only show ErrorDisplay if not loading, to prevent clash with "Processing" status
          <div className="mb-4">
            <ErrorDisplay 
                message={localError} // ErrorDisplay takes the message directly
                onRetry={ (globalError || localError === t.errorApiKey || localError === t.errorFetchingGuidance || localError.includes("theme")) ? () => { setError(null); setLocalError(null); setVoiceCapturedTheme(false); } : undefined} 
            />
          </div>
        )}

        <div className="flex items-start space-x-3 mb-6">
            <textarea
                value={themeInput}
                onChange={(e) => {
                    const newTheme = e.target.value;
                    setThemeInput(newTheme);
                    setTranscription(newTheme); 
                    setVoiceCapturedTheme(false); // Typing clears voice captured status
                    if (!isListening && !speechSupportError) {
                        // Clear non-critical local errors when user types
                        if(localError && !speechSupportError && !localError.includes(t.errorApiKey) && !localError.includes(t.errorFetchingGuidance) && !localError.includes("Microphone access denied") && !localError.includes("No speech detected") && !localError.includes("Microphone issue")) {
                            setLocalError(null);
                        }
                    }
                }}
                placeholder={t.inputPlaceholder}
                className="flex-grow p-3.5 bg-neutral-800 border border-neutral-700/60 rounded-lg text-neutral-100 placeholder-neutral-500 focus:ring-1 focus:ring-amber-500/70 focus:border-amber-500/70 transition-colors duration-200 shadow-sm min-h-[100px] resize-none"
                rows={3}
                disabled={isLoading || isListening}
                aria-label="Theme input"
            />
            <div className="flex-shrink-0 h-[52px] pt-[calc(0.875rem-1px)]"> 
                 {renderMicButtonContent()}
            </div>
        </div>

        {searchHistory.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-neutral-400 flex items-center">
                <History size={16} className="mr-1.5 text-neutral-500" />
                {t.searchHistoryTitle}
              </h3>
            </div>
            <ul className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar pr-1">
              {searchHistory.map((item) => (
                <li key={item.id} className="flex items-center justify-between bg-neutral-800/60 rounded-md group">
                  <button
                    onClick={() => handleHistoryItemClick(item)}
                    className="flex-grow text-left text-sm text-neutral-300 group-hover:text-amber-400  group-hover:bg-neutral-700/50 p-2 rounded-l-md transition-colors truncate"
                    title={t.historyItemAriaLabel.replace('{theme}', item.theme)}
                    aria-label={t.historyItemAriaLabel.replace('{theme}', item.theme)}
                  >
                    {item.theme}
                  </button>
                  <button
                    onClick={() => deleteSearchHistoryItem(item.id)}
                    className="p-2 text-neutral-500 hover:text-rose-400 group-hover:bg-neutral-700/50 rounded-r-md transition-colors focus:outline-none"
                    title={t.deleteHistoryItemAriaLabel.replace('{theme}', item.theme)}
                    aria-label={t.deleteHistoryItemAriaLabel.replace('{theme}', item.theme)}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div> 
      
      <div className="mt-auto pt-4"> 
        <button
            onClick={handleFetchGuidance}
            disabled={isLoading || isListening || !apiKeyAvailable || !themeInput.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700 text-neutral-900 font-semibold py-3.5 px-6 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:ring-offset-2 focus:ring-offset-neutral-900
                       disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-[0.98]"
        >
            {isLoading && !isListening ? ( 
                <Loader2 size={22} className="animate-spin mr-2" />
            ) : (
                <Search size={20} className="mr-2" strokeWidth={2.5}/>
            )}
            <span>{t.submitTheme}</span>
        </button>
         {!apiKeyAvailable && !(localError && localError.includes(t.errorApiKey)) && ( // Show API key error if not already displayed by localError
             <p className="text-xs text-rose-400 text-center mt-3">{t.errorApiKey}</p>
         )}
      </div>
    </div>
  );
};

export default InputScreen;