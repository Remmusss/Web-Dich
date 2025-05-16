export interface Language {
    code: string;
    name: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'vi', name: 'Vietnamese' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ru', name: 'Russian' },
    { code: 'auto', name: 'Detect Language' }
];

export const getLanguageName = (code: string): string => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
};

export const isValidLanguage = (code: string): boolean => {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}; 