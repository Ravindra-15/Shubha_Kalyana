import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import resources from './resources';

export const SUPPORTED_LANGUAGES = ['en', 'kn', 'hi', 'ta', 'te', 'ml', 'tcy', 'kok', 'kod'];

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

// Restore whichever language the user previously picked (onboarding's
// appLanguage, or the post-login preferredLanguage saved on their
// profile) so this survives app restarts.
(async () => {
  try {
    const saved = await AsyncStorage.getItem('appLanguage');
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // ignore — defaults to English
  }
})();

export default i18n;
