import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import SearchableDropdown from '../../../components/SearchableDropdown';
import apiClient from '../../../api/client';

const MARITAL_STATUS = [
  { label: 'Never Married', value: 'NEVER_MARRIED' },
  { label: 'Divorced', value: 'DIVORCED' },
  { label: 'Widowed', value: 'WIDOWED' },
  { label: 'Awaiting Divorce', value: 'AWAITING_DIVORCE' },
];

const DIET = [
  { label: 'Veg', value: 'VEG' },
  { label: 'Non Veg', value: 'NON_VEG' },
  { label: 'Vegan', value: 'VEGAN' },
];

export default function BasicLifestyleScreen({ navigation }: any) {
  const [maritalStatus, setMaritalStatus] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [weight, setWeight] = useState('');
  const [diet, setDiet] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('Horoscope');
      return;
    }

    const payload: any = {};
    if (maritalStatus) payload.maritalStatus = maritalStatus;
    if (feet.trim() || inches.trim()) {
      payload.height = { feet: Number(feet) || 0, inches: Number(inches) || 0 };
    }
    if (weight.trim()) {
      payload.weight = { value: Number(weight), units: 'KG' };
    }
    if (diet) {
      payload.lifestyle = { diet };
    }

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', payload);
      navigation.navigate('Horoscope');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <ProgressBar step={4} total={8} />

        <Text style={styles.title}>
          Martial <Text style={styles.titleRed}>Status</Text>
        </Text>

        <Text style={styles.label}>Maritial Status</Text>
        <SearchableDropdown
          placeholder="Select Your Martial Status"
          value={maritalStatus}
          options={MARITAL_STATUS}
          onSelect={(val) => setMaritalStatus(val)}
        />

        <Text style={styles.label}>Height</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextInput
              style={styles.input}
              placeholder="Ft"
              placeholderTextColor="#999"
              value={feet}
              onChangeText={setFeet}
              keyboardType="number-pad"
              maxLength={1}
            />
          </View>
          <View style={styles.half}>
            <TextInput
              style={styles.input}
              placeholder="Inches"
              placeholderTextColor="#999"
              value={inches}
              onChangeText={setInches}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        <Text style={styles.label}>Weight</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={[styles.input, styles.weightInput]}
            placeholder="Enter Weight"
            placeholderTextColor="#999"
            value={weight}
            onChangeText={setWeight}
            keyboardType="number-pad"
          />
          <Text style={styles.kg}>kg</Text>
        </View>

        <Text style={styles.label}>Diet</Text>
        <View style={styles.dietRow}>
          {DIET.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.dietPill, diet === d.value && styles.dietPillActive]}
              onPress={() => setDiet(d.value)}
            >
              <Text style={[styles.dietText, diet === d.value && styles.dietTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextBtn} onPress={() => submit(false)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Next  →</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => submit(true)}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 30 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    color: '#000',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  weightRow: { flexDirection: 'row', alignItems: 'center' },
  weightInput: { flex: 1 },
  kg: { marginLeft: -36, marginBottom: 16, color: '#666', fontSize: 15 },
  dietRow: { flexDirection: 'row', flexWrap: 'wrap' },
  dietPill: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginRight: 12,
    marginBottom: 12,
  },
  dietPillActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  dietText: { fontSize: 15, color: '#333' },
  dietTextActive: { color: '#D20236', fontWeight: '600' },
  spacer: { flex: 1, minHeight: 20 },
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