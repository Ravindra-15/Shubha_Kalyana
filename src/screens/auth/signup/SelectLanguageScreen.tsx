import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../../constants/languages';

export default function SelectLanguageScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState('en');

  const selectLanguage = (value: string) => {
    setSelected(value);
    i18n.changeLanguage(value);
  };

  const handleNext = async () => {
    await AsyncStorage.setItem('appLanguage', selected);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {t('selectLanguage.titleLine1')} <Text style={styles.titleRed}>{t('selectLanguage.titleLine2')}</Text>
        </Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.value}
              style={styles.option}
              onPress={() => selectLanguage(lang.value)}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.radio,
                    selected === lang.value && styles.radioActive,
                  ]}
                />
                <Text style={styles.optionLabel}>{lang.label}</Text>
              </View>
              <Text style={styles.optionNative}>{lang.native}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>{t('selectLanguage.next')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 30 },
  title: { fontSize: 24, fontFamily: 'Outfit-Regular', color: '#000', textAlign: 'center', marginBottom: 50 },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  list: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  radioActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  optionLabel: { fontSize: 15, color: '#333', fontFamily: 'Outfit-SemiBold' },
  optionNative: { fontSize: 14, color: '#D20236', fontFamily: 'Outfit-Bold' },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});