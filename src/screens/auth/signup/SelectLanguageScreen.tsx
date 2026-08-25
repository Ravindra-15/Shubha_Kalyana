import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { label: 'Kannada', native: 'ಕ', value: 'kn' },
  { label: 'English', native: 'En', value: 'en' },
  { label: 'Hindi', native: 'हि', value: 'hi' },
];

export default function SelectLanguageScreen({ navigation }: any) {
  const [selected, setSelected] = useState('en');

  const handleNext = async () => {
    await AsyncStorage.setItem('appLanguage', selected);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Select <Text style={styles.titleRed}>Language</Text>
        </Text>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.value}
              style={styles.option}
              onPress={() => setSelected(lang.value)}
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
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 50 },
  titleRed: { color: '#D20236' },
  list: { gap: 12 },
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
  optionLabel: { fontSize: 15, color: '#333', fontWeight: '600' },
  optionNative: { fontSize: 14, color: '#D20236', fontWeight: '700' },
  spacer: { flex: 1 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});