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

const EMPLOYED_TYPES = [
  { label: 'Government', value: 'GOVERNMENT' },
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Self Employed', value: 'SELF_EMPLOYED' },
  { label: 'Not Working', value: 'NOT_WORKING' },
];

export default function EmploymentScreen({ navigation }: any) {
  const [employedType, setEmployedType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('FamilyDetails');
      return;
    }
    if (!employedType) {
      return Alert.alert('Required', 'Please select employment type');
    }

    const employment: any = { employedType };
    if (companyName.trim()) employment.companyName = companyName.trim();
    if (designation.trim()) employment.designation = designation.trim();
    if (annualIncome.trim()) employment.annualIncome = Number(annualIncome);

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', { employment });
      navigation.navigate('FamilyDetails');
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

        <ProgressBar step={2} total={8} />

        <Text style={styles.title}>
          Add your{'\n'}<Text style={styles.titleRed}>Employment Details</Text>
        </Text>

        <Text style={styles.label}>Employment Type</Text>
        <SearchableDropdown
          placeholder="Select Employment Type"
          value={employedType}
          options={EMPLOYED_TYPES}
          onSelect={(val) => setEmployedType(val)}
        />

        <Text style={styles.label}>Company Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter company name"
          placeholderTextColor="#999"
          value={companyName}
          onChangeText={setCompanyName}
        />

        <Text style={styles.label}>Designation</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter designation"
          placeholderTextColor="#999"
          value={designation}
          onChangeText={setDesignation}
        />

        <Text style={styles.label}>Annual Income (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g 500000"
          placeholderTextColor="#999"
          value={annualIncome}
          onChangeText={setAnnualIncome}
          keyboardType="number-pad"
        />

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
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 36 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
    color: '#000',
  },
  spacer: { flex: 1, minHeight: 30 },
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