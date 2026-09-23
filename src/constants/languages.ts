// Kept in sync with matrimony-next's supported locales
// (src/i18n/routing.js) so a language chosen here matches the same
// value stored/read via the shared preferredLanguage field.
export const LANGUAGES = [
  { label: 'English', native: 'English', value: 'en' },
  { label: 'Kannada', native: 'ಕನ್ನಡ', value: 'kn' },
  { label: 'Hindi', native: 'हिन्दी', value: 'hi' },
  { label: 'Tamil', native: 'தமிழ்', value: 'ta' },
  { label: 'Telugu', native: 'తెలుగు', value: 'te' },
  { label: 'Malayalam', native: 'മലയാളം', value: 'ml' },
  { label: 'Tulu', native: 'ತುಳು', value: 'tcy' },
  { label: 'Konkani', native: 'कोंकणी', value: 'kok' },
  { label: 'Kodava', native: 'ಕೊಡವ', value: 'kod' },
] as const;

// The three languages the product is actually translated into. The onboarding
// "Select Language" screen shows only these, matching the website's language
// switcher.
export const ONBOARDING_LANGUAGE_VALUES = ['en', 'kn', 'hi'];

export const ONBOARDING_LANGUAGES = LANGUAGES.filter((language) =>
  ONBOARDING_LANGUAGE_VALUES.includes(language.value),
);
