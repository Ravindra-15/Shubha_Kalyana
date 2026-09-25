import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';
import { useTranslation } from 'react-i18next';
import SplitTitle from '../../../components/SplitTitle';

export default function AboutYouScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { data, setField } = useSignup();
  const [aboutMe, setAboutMe] = useState(data.about || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const MAX = 2000;
  const MIN = 20;

  const submit = async (_skip = false) => {
    // Mandatory, so Skip has to pass the same checks.
    if (!aboutMe.trim()) {
      setError(true);
      return Alert.alert('Required', 'Please tell us about yourself');
    }

    if (aboutMe.trim().length < MIN) {
      setError(true);
      return Alert.alert('Too short', `Please write at least ${MIN} characters about yourself`);
    }
    setError(false);

    try {
      setLoading(true);
      // skip API if unchanged (prevents backend step rewind)
      if ((data.about || '') === aboutMe.trim()) {
        return navigation.navigate('PartnerPreference');
      }
      await apiClient.patch('/onboarding/profile', {
        about: { aboutMe: aboutMe.trim() },
      });
      setField('about', aboutMe.trim());
      navigation.navigate('PartnerPreference');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
  <KeyboardWrapper>
        <View style={styles.inner}>
          
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={11} total={16} />

          <SplitTitle
            style={styles.title}
            highlightStyle={styles.titleRed}
            pre={t('signup.aboutYou.titlePre')}
            highlight={t('signup.aboutYou.titleHighlight')}
            post={t('signup.aboutYou.titlePost')}
          />

          <Text style={styles.label}>{t('signup.aboutYou.label')} <Text style={styles.star}>*</Text></Text>
          <TextInput
            style={[styles.textArea, error && styles.inputError]}
            placeholder={t('signup.aboutYou.placeholder')}
            placeholderTextColor="#999"
            value={aboutMe}
            onChangeText={(t) => { setAboutMe(t.slice(0, MAX)); setError(false); }}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{aboutMe.length}/{MAX}</Text>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.nextBtn} onPress={() => submit(false)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{t('signup.common.next')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => submit(true)}>
            <Text style={styles.skipText}>{t('signup.common.skip')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 20 },
  title: { fontSize: 26, fontFamily: 'Outfit-Regular', color: '#000', textAlign: 'center', marginBottom: 30 },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 10 },
  star: { color: '#D20236' },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    minHeight: 160,
  },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  counter: { alignSelf: 'flex-end', color: '#999', fontSize: 12, marginTop: 6 },
  spacer: { minHeight: 30 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: { color: '#000', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
});