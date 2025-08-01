import React, { useState, useEffect, useContext, useRef } from 'react';
import { Loader2, Search, Mic, MicOff, Trash2, History } from 'lucide-react';
import { AppContext } from '../App';
import { translations, API_KEY_ERROR, GEMINI_FETCH_ERROR } from '../constants';
import { fetchGuidance } from '../services/geminiService';
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
            const data = await fetchGuidance(currentTheme, language);
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
    <div className="flex flex-col flex-grow p-4">
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center text-neutral-100">{t.searchTitle}</h2>
      <p className="text-lg md:text-xl text-neutral-400 mb-6 text-center max-w-md mx-auto">
          {t.searchSubtitle}
      </p>

      <div className="w-full max-w-md mx-auto mb-8">
          <div className="w-full">
              <textarea
                  value={themeInput}
                  onChange={(e) => {
                      setThemeInput(e.target.value);
                      setLocalError(null);
                      // If user types after voice input, don't show "Theme captured successfully"
                      setVoiceCapturedTheme(false);
                  }}
                  className="w-full bg-neutral-800/80 rounded-lg p-4 text-xl md:text-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-neutral-800 min-h-[100px] resize-y"
                  placeholder={t.searchInputPlaceholder}
                  disabled={isLoading}
                  rows={3}
              />
              
              <div className="flex justify-between mt-3 gap-2">
                  {themeInput && !isListening && !isLoading && (
                      <button
                          onClick={() => {
                              setThemeInput('');
                              setLocalError(null);
                              setVoiceCapturedTheme(false);
                          }}
                          className="flex items-center justify-center h-12 px-4 bg-neutral-700 text-neutral-400 hover:text-rose-400 transition-colors rounded-lg"
                          aria-label={t.clearInput}
                          title={t.clearInput}
                          disabled={isLoading}
                      >
                          <Trash2 size={20} className="mr-2" />
                          <span className="text-sm md:text-base">{t.clearInput}</span>
                      </button>
                  )}
                  
                  <div className="flex flex-grow justify-end gap-2">
                      <button
                          onClick={!isLoading ? handleToggleListening : undefined}
                          className={`flex items-center justify-center h-12 px-4 rounded-lg transition-colors flex-1
                                   ${isListening 
                                     ? 'bg-rose-600 text-white animate-pulse' 
                                     : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600 hover:text-amber-300'
                                   }
                                   ${speechSupportError || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          aria-label={isListening ? t.stopVoiceInput : t.startVoiceInput}
                          title={isListening ? t.stopVoiceInput : t.startVoiceInput}
                          disabled={!!speechSupportError || isLoading}
                      >
                          {isListening ? <MicOff size={20} className="mr-2" /> : <Mic size={20} className="mr-2" />}
                          <span className="text-sm md:text-base">{isListening ? t.stopVoiceInput : t.startVoiceInput}</span>
                      </button>
                      
                      <button
                          onClick={handleFetchGuidance}
                          className={`flex items-center justify-center h-12 px-4 rounded-lg flex-1
                                   ${!themeInput.trim() || isLoading 
                                     ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' 
                                     : 'bg-amber-600 text-neutral-900 hover:bg-amber-500'}`}
                          disabled={!themeInput.trim() || isLoading}
                          aria-label={t.search}
                          title={t.search}
                      >
                          {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Search size={20} className="mr-2" />}
                          <span className="text-sm md:text-base">{t.search}</span>
                      </button>
                  </div>
              </div>
          </div>

          <div className={`text-center mt-2 min-h-[1.5rem] text-base md:text-lg ${currentStatusColorClass}`}>
              {currentStatusText}
          </div>
      </div>

      <div className="w-full max-w-lg mx-auto">
          <div className={`mb-4 p-4 bg-neutral-800/70 rounded-lg ${searchHistory.length > 0 ? '' : 'hidden'}`}>
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg md:text-xl text-amber-400 font-medium flex items-center gap-2">
                      <History size={18} />
                      {t.recentSearches}
                  </h3>
              </div>

              <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {searchHistory.map((item) => (
                      <li key={item.id} className="flex justify-between items-center">
                          <button
                              onClick={() => handleHistoryItemClick(item)}
                              className="text-neutral-300 hover:text-amber-300 transition-colors text-left truncate max-w-[80%] text-base md:text-lg"
                              disabled={isLoading}
                          >
                              {item.theme}
                              <span className="text-xs md:text-sm text-neutral-500 ml-2">
                                  {item.language === 'en' ? 'EN' : 'JP'}
                              </span>
                          </button>
                          <button
                              onClick={() => deleteSearchHistoryItem(item.id)}
                              className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                              title={t.delete}
                              aria-label={`${t.delete} ${item.theme}`}
                              disabled={isLoading}
                          >
                              <Trash2 size={16} />
                          </button>
                      </li>
                  ))}
              </ul>
          </div>

          {apiKeyAvailable === false && (
              <ErrorDisplay message={t.errorApiKey} linkText={t.setupApiKey} linkUrl="#setup-api-key" />
          )}

      </div>
    </div>
  );
};

export default InputScreen;