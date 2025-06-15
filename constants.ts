import { Translations }  from './types';

export const API_KEY_ERROR = "API_KEY_ERROR";
export const GEMINI_FETCH_ERROR = "GEMINI_FETCH_ERROR";
export const MAX_HISTORY_ITEMS = 10;
export const CACHE_VERSION = "1.1"; // Increment to invalidate old caches if prompts/logic change
export const CACHE_VERSION_KEY = 'wisdomBridgeCacheVersion';


// New Storage Keys
export const FAVORITE_QUOTES_KEY = 'wisdomBridgeFavoriteQuotes';
export const REFLECTIONS_KEY = 'wisdomBridgeReflections';
export const QUOTE_OF_THE_DAY_KEY = 'wisdomBridgeQuoteOfTheDay';

// Predefined Themes for Exploration
export const PREDEFINED_THEMES = [
  { key: 'courage', en: 'Courage', ja: '勇気' },
  { key: 'hope', en: 'Hope', ja: '希望' },
  { key: 'perseverance', en: 'Perseverance', ja: '忍耐' },
  { key: 'compassion', en: 'Compassion', ja: '慈悲' },
  { key: 'wisdom', en: 'Wisdom', ja: '智慧' },
  { key: 'friendship', en: 'Friendship', ja: '友情' },
  { key: 'community', en: 'Community', ja: '地域社会' }, // Or 異体同心
  { key: 'humanrevolution', en: 'Human Revolution', ja: '人間革命' },
  { key: 'peace', en: 'Peace', ja: '平和' },
  { key: 'mission', en: 'Mission', ja: '使命' },
  { key: 'dialogue', en: 'Dialogue', ja: '対話' },
  { key: 'youth', en: 'Youth', ja: '青年' },
];


export const translations: Translations = {
    en: {
        title: "Wisdom Bridge",
        homeTitle: "Guidance from The New Human Revolution",
        homeSubtitle: "Find inspiration from the writings of Daisaku Ikeda. Powered by Gemini and the spirit of Soka.",
        startSearching: "Start Seeking",
        footerHome: "Home",
        footerInput: "Input",
        footerQuote: "Quote",
        footerFavorites: "Favorites", // New
        footerJournal: "Journal", // New
        footerExplore: "Explore", // New
        statusTap: "Enter a theme or feeling, or use the mic.",
        statusListening: "Listening...",
        statusProcessing: "Searching for guidance...",
        statusError: "Could not find guidance. Please try again or check API Key.",
        quoteViewTitle: "Guidance Found",
        analysis: "Analysis",
        findAnother: "Seek Another Passage",
        errorTitle: "An Error Occurred",
        retry: "Retry",
        findingQuoteTitle: "Seeking Guidance...",
        findingQuoteSubtitle: "Please wait a moment.",
        langSwitch: "日本語",
        errorApiKey: "Gemini API Key is missing or invalid. Please ensure it is correctly configured in your environment.",
        errorFetchingGuidance: "Failed to fetch guidance from Gemini. The model might be unavailable or the request failed. Please try again.",
        inputPlaceholder: "e.g., courage, hope...",
        submitTheme: "Find Guidance",
        voiceInputTitle: "Use Voice Input",
        statusVoiceError: "Voice input failed. Please try again or type your theme.",
        statusVoiceSuccess: "Theme captured. Press 'Find Guidance'.",
        quoteIndicator: "Quote {current} of {total}",
        searchHistoryTitle: "Search History",
        clearHistory: "Clear History", // Retained for translations if any other part uses it, but not for button
        historyItemAriaLabel: "Search for: {theme}", // For clicking a history item to search
        deleteHistoryItemAriaLabel: "Delete search: {theme}", // For the delete button of a history item
        historyItemDeleted: "History item deleted.", // Toast message
        confirmClearHistory: "Are you sure you want to clear all search history and cached results?", // For potential future mass clear confirm dialog
        favoritesTitle: "My Favorites",
        addToFavorites: "Add to Favorites",
        removeFromFavorites: "Remove from Favorites",
        shareQuote: "Share Quote",
        shareViaEmail: "Share via Email",
        shareViaTwitter: "Share via X (Twitter)",
        copyToClipboard: "Copy to Clipboard",
        copiedSuccess: "Copied to clipboard!",
        exploreThemesTitle: "Explore Themes",
        quoteOfTheDayTitle: "Quote of the Day",
        viewQuoteOfTheDay: "View Today's Quote",
        journalTitle: "My Journal",
        journalTab: "Journal", 
        addReflection: "Add Reflection",
        editReflection: "Edit Reflection",
        saveReflection: "Save Reflection",
        deleteReflection: "Delete Reflection",
        confirmDeleteReflection: "Are you sure you want to delete this reflection?",
        noFavoritesMessage: "You haven't added any quotes to your favorites yet. Start exploring and mark your cherished passages!",
        noReflectionsMessage: "No reflections written yet. Find a quote that resonates and jot down your thoughts.",
        reflectionPlaceholder: "Write your thoughts and reflections here...",
        toastAddedToFavorites: "Added to favorites!",
        toastRemovedFromFavorites: "Removed from favorites.",
        toastReflectionSaved: "Reflection saved.",
        toastReflectionDeleted: "Reflection deleted.",
        errorSavingReflection: "Could not save reflection. Please try again.",
        errorDeletingReflection: "Could not delete reflection. Please try again.",
        errorFetchingQuoteOfTheDay: "Could not fetch the Quote of the Day. Please try again later.",
        loadingQuoteOfTheDay: "Fetching Quote of the Day...",
        noQuoteOfTheDay: "Quote of the Day is currently unavailable. Please check back later.",
        backToInput: "Back to Input",
        myReflections: "My Reflections",
        loadMoreThemes: "Load More Themes", 
        theme: "Theme", 
        searchByTheme: "Search by Theme",
        reflectionForQuote: "Reflection for: \"{quoteSnippet}...\"",
        noReflectionsFound: "No reflections found.",
        shareOriginalText: "Share original text (Quote + Citation + Analysis)",
        closeModal: "Close",
        confirm: "Confirm", // Generic confirm
        cancel: "Cancel", // Generic cancel
    },
    ja: {
        title: "知恵の架け橋",
        homeTitle: "新・人間革命からの指導",
        homeSubtitle: "池田先生の著作からインスピレーションを得ましょう。ジェミニと創価の精神で。",
        startSearching: "検索開始",
        footerHome: "ホーム",
        footerInput: "入力",
        footerQuote: "引用",
        footerFavorites: "お気に入り",
        footerJournal: "ジャーナル",
        footerExplore: "探す",
        statusTap: "テーマや気持ちを入力するか、マイクを使用してください。",
        statusListening: "聞いています...",
        statusProcessing: "指導を検索中...",
        statusError: "指導が見つかりませんでした。再度試すか、APIキーを確認してください。",
        quoteViewTitle: "指導が見つかりました",
        analysis: "解説",
        findAnother: "別の指導を検索",
        errorTitle: "エラーが発生しました",
        retry: "再試行",
        findingQuoteTitle: "指導を検索しています...",
        findingQuoteSubtitle: "少々お待ちください。",
        langSwitch: "English",
        errorApiKey: "Gemini APIキーが見つからないか無効です。環境内で正しく設定されていることを確認してください。",
        errorFetchingGuidance: "Geminiからの指導の取得に失敗しました。モデルが利用できないか、リクエストが失敗した可能性があります。もう一度お試しください。",
        inputPlaceholder: "例：勇気、希望...",
        submitTheme: "指導を検索",
        voiceInputTitle: "音声入力を使用",
        statusVoiceError: "音声入力に失敗しました。もう一度試すか、テーマを入力してください。",
        statusVoiceSuccess: "テーマを認識しました。「指導を検索」を押してください。",
        quoteIndicator: "{total}件中{current}件目の引用",
        searchHistoryTitle: "検索履歴",
        clearHistory: "履歴を消去", // General translation
        historyItemAriaLabel: "検索テーマ：{theme}", // For clicking a history item
        deleteHistoryItemAriaLabel: "検索履歴を削除：{theme}", // For delete button
        historyItemDeleted: "検索履歴の項目を削除しました。", // Toast message
        confirmClearHistory: "本当に検索履歴とキャッシュされた結果をすべて消去しますか？", // For potential future mass clear
        favoritesTitle: "お気に入り",
        addToFavorites: "お気に入りに追加",
        removeFromFavorites: "お気に入りから削除",
        shareQuote: "引用を共有",
        shareViaEmail: "メールで共有",
        shareViaTwitter: "X (Twitter) で共有",
        copyToClipboard: "クリップボードにコピー",
        copiedSuccess: "クリップボードにコピーしました！",
        exploreThemesTitle: "テーマを探す",
        quoteOfTheDayTitle: "今日の一節",
        viewQuoteOfTheDay: "今日の一節を見る",
        journalTitle: "マイジャーナル",
        journalTab: "ジャーナル",
        addReflection: "感想を追加",
        editReflection: "感想を編集",
        saveReflection: "感想を保存",
        deleteReflection: "感想を削除",
        confirmDeleteReflection: "この感想を削除してもよろしいですか？",
        noFavoritesMessage: "まだお気に入りに引用を追加していません。大切な一節を見つけて登録しましょう！",
        noReflectionsMessage: "まだ感想が書かれていません。心に残った引用について、あなたの考えを記録しましょう。",
        reflectionPlaceholder: "ここにあなたの考えや感想を書いてください...",
        toastAddedToFavorites: "お気に入りに追加しました！",
        toastRemovedFromFavorites: "お気に入りから削除しました。",
        toastReflectionSaved: "感想を保存しました。",
        toastReflectionDeleted: "感想を削除しました。",
        errorSavingReflection: "感想を保存できませんでした。もう一度お試しください。",
        errorDeletingReflection: "感想を削除できませんでした。もう一度お試しください。",
        errorFetchingQuoteOfTheDay: "今日の一節を取得できませんでした。後でもう一度お試しください。",
        loadingQuoteOfTheDay: "今日の一節を取得中...",
        noQuoteOfTheDay: "今日の一節は現在利用できません。後でご確認ください。",
        backToInput: "入力に戻る",
        myReflections: "私の感想",
        loadMoreThemes: "さらにテーマを読み込む",
        theme: "テーマ",
        searchByTheme: "テーマで検索",
        reflectionForQuote: "「{quoteSnippet}...」の感想",
        noReflectionsFound: "感想は見つかりませんでした。",
        shareOriginalText: "原文を共有 (引用 + 出典 + 解説)",
        closeModal: "閉じる",
        confirm: "確認",
        cancel: "キャンセル",
    }
};