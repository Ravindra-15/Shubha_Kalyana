import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { getAccountSettings, saveLanguagePreference } from '../../api/settings';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'ಕನ್ನಡ (Kannada)', value: 'kn' },
];

export default function ChooseLanguageScreen({ navigation }: any) {
  const [selected, setSelected] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const account = await getAccountSettings();
        if (account?.preferredLanguage) {
          setSelected(account.preferredLanguage);
        }
      } catch {
        // default to English if fetch fails
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyLanguage = async () => {
    try {
      setSaving(true);
      await saveLanguagePreference(selected);
      Alert.alert('Success', 'Language preference saved', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save language preference');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Language</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.content}>
          {LANGUAGES.map((lang) => {
            const active = selected === lang.value;
            return (
              <TouchableOpacity
                key={lang.value}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => setSelected(lang.value)}
              >
                <View style={[styles.checkbox, active && styles.checkboxActive]}>
                  {active && <Check color="#fff" size={14} />}
                </View>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{lang.label}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.applyBtn, saving && styles.applyBtnDisabled]}
            onPress={applyLanguage}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.applyText}>Apply Language</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  content: { padding: 20 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16, marginBottom: 14,
  },
  optionActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  checkbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  optionText: { fontSize: 15, color: '#333', fontWeight: '500' },
  optionTextActive: { color: '#D20236', fontWeight: '700' },
  applyBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 20,
  },
  applyBtnDisabled: { backgroundColor: '#e9a9b6' },
  applyText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});