import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import SearchableDropdown from '../../../components/SearchableDropdown';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';

const RASHIS = [
  { label: 'Mesha (Aries)', value: 'MESHA' },
  { label: 'Vrishabha (Taurus)', value: 'VRISHABHA' },
  { label: 'Mithuna (Gemini)', value: 'MITHUNA' },
  { label: 'Karka (Cancer)', value: 'KARKA' },
  { label: 'Simha (Leo)', value: 'SIMHA' },
  { label: 'Kanya (Virgo)', value: 'KANYA' },
  { label: 'Tula (Libra)', value: 'TULA' },
  { label: 'Vrischika (Scorpio)', value: 'VRISCHIKA' },
  { label: 'Dhanu (Sagittarius)', value: 'DHANU' },
  { label: 'Makara (Capricorn)', value: 'MAKARA' },
  { label: 'Kumbha (Aquarius)', value: 'KUMBHA' },
  { label: 'Meena (Pisces)', value: 'MEENA' },
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

export default function HoroscopeScreen({ navigation }: any) {
  const [rashi, setRashi] = useState('');
  const [nakshatra, setNakshatra] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('AddressDetails');
      return;
    }

    const horoscopeDetail: any = {};
    if (rashi) horoscopeDetail.rashi = rashi;
    if (nakshatra) horoscopeDetail.nakshatra = nakshatra;

    // nothing entered → just move on
    if (!rashi && !nakshatra) {
      return navigation.navigate('AddressDetails');
    }

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', { horoscopeDetail });
      navigation.navigate('AddressDetails');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper>
        <View style={styles.inner}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={6} total={9} />

          <Text style={styles.title}>
            Your <Text style={styles.titleRed}>Horoscope</Text>
          </Text>

          <Text style={styles.label}>Rashi (Moon Sign)</Text>
          {/* <SearchableDropdown
            placeholder="Select your Rashi"
            value={rashi}
            options={RASHIS}
            onSelect={(val) => setRashi(val)}
            allowCustom
          /> */}
          <SearchableDropdown
            placeholder="Select your Rashi"
            value={rashi}
            options={RASHIS}
            onSelect={(val) => setRashi(val)}
          />

          <Text style={styles.label}>Nakshatra (Birth Star)</Text>
          {/* <SearchableDropdown
            placeholder="Select your Nakshatra"
            value={nakshatra}
            options={NAKSHATRAS.map((n) => ({ label: n, value: n }))}
            onSelect={(val) => setNakshatra(val)}
            allowCustom
          /> */}

          <SearchableDropdown
            placeholder="Select your Nakshatra"
            value={nakshatra}
            options={NAKSHATRAS.map((n) => ({ label: n, value: n }))}
            onSelect={(val) => setNakshatra(val)}
          />

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.nextBtn} onPress={() => submit(false)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Next  →</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => submit(true)}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 36 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10, marginTop: 6 },
  spacer: { minHeight: 60 },
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