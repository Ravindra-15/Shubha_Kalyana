import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import { ONBOARDING_LANGUAGES } from '../constants/languages';

/**
 * Small language picker for the pre-login screens.
 *
 * The language is chosen on the Select Language screen during first use, but
 * there is no way back to it afterwards, so this lets a user change it from
 * Login. The choice is saved the same way that screen saves it (AsyncStorage
 * `appLanguage` + i18n), so the whole sign-up flow follows it.
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const active =
    ONBOARDING_LANGUAGES.find((language) => language.value === i18n.language) ||
    ONBOARDING_LANGUAGES[0];

  const select = async (value: string) => {
    setOpen(false);
    if (value === i18n.language) return;

    try {
      await AsyncStorage.setItem('appLanguage', value);
    } catch {
      // Saving is a convenience; the change below still applies right away.
    }
    await i18n.changeLanguage(value);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.triggerText}>{active.native}</Text>
        <Text style={styles.caret}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            {ONBOARDING_LANGUAGES.map((language) => {
              const isActive = language.value === active.value;

              return (
                <TouchableOpacity
                  key={language.value}
                  style={styles.option}
                  onPress={() => select(language.value)}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {language.native}
                  </Text>
                  {isActive ? <Text style={styles.tick}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
  },
  triggerText: { fontSize: 14, color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  caret: { fontSize: 11, color: '#999' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sheet: {
    position: 'absolute',
    top: 96,
    right: 24,
    minWidth: 170,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: { fontSize: 15, color: '#333' },
  optionTextActive: { color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  tick: { fontSize: 14, color: '#D20236', fontFamily: 'Outfit-Bold' },
});
