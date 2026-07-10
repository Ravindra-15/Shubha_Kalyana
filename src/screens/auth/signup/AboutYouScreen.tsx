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

export default function AboutYouScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [aboutMe, setAboutMe] = useState(data.about || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const MAX = 2000;
  const MIN = 20;

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('PartnerPreference');
      return;
    }

    if (aboutMe.trim() && aboutMe.trim().length < MIN) {
      setError(true);
      return Alert.alert('Too short', `Please write at least ${MIN} characters about yourself`);
    }
    setError(false);

    // nothing entered → just move on
    if (!aboutMe.trim()) {
      setField('about', aboutMe.trim());
      return navigation.navigate('PartnerPreference');
    }

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

          <ProgressBar step={8} total={9} />

          <Text style={styles.title}>
            About <Text style={styles.titleRed}>Yourself</Text>
          </Text>

          <Text style={styles.label}>Tell us about yourself</Text>
          <TextInput
            style={[styles.textArea, error && styles.inputError]}
            placeholder="Write a few lines about yourself, your values, interests, what you're looking for..."
            placeholderTextColor="#999"
            value={aboutMe}
            onChangeText={(t) => { setAboutMe(t.slice(0, MAX)); setError(false); }}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{aboutMe.length}/{MAX}</Text>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.nextBtn} onPress={() => submit(false)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Next  →</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => submit(true)}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 30 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
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
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: { color: '#000', fontSize: 16, fontWeight: '600' },
});