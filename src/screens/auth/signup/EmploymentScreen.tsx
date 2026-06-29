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
import { useSignup } from '../../../context/SignupContext';

const EMPLOYED_TYPES = [
  { label: 'Government', value: 'GOVERNMENT' },
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Self Employed', value: 'SELF_EMPLOYED' },
  { label: 'Not Working', value: 'NOT_WORKING' },
];

const INCOME_SLABS = [
  { label: 'Below ₹2 Lakh', value: '200000' },
  { label: '₹2 - 5 Lakh', value: '500000' },
  { label: '₹5 - 10 Lakh', value: '1000000' },
  { label: '₹10 - 15 Lakh', value: '1500000' },
  { label: '₹15 - 25 Lakh', value: '2500000' },
  { label: '₹25 - 50 Lakh', value: '5000000' },
  { label: 'Above ₹50 Lakh', value: '7500000' },
];

export default function EmploymentScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const emp = data.employment || {};
  const [employedType, setEmployedType] = useState(emp.employedType || '');
  const [annualIncome, setAnnualIncome] = useState(emp.annualIncome ? String(emp.annualIncome) : '');
  const [designation, setDesignation] = useState(emp.designation || '');
  const [companyName, setCompanyName] = useState(emp.companyName || '');
  const [companyLocation, setCompanyLocation] = useState(emp.companyLocation || '');
  const [linkedIn, setLinkedIn] = useState(emp.linkedInProfile || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('FamilyDetails');
      return;
    }

    // mandatory: employment type
    const newErrors: { [k: string]: boolean } = {};
    if (!employedType) newErrors.employedType = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return Alert.alert('Required', 'Please select employment type');
    }

    // linkedin format check (only if entered)
    if (linkedIn.trim() && !/linkedin\.com/i.test(linkedIn.trim())) {
      setErrors({ linkedIn: true });
      return Alert.alert('Invalid', 'Please enter a valid LinkedIn URL');
    }

    const employment: any = { employedType };
    if (annualIncome) employment.annualIncome = Number(annualIncome);
    if (designation.trim()) employment.designation = designation.trim();
    if (companyName.trim()) employment.companyName = companyName.trim();
    if (companyLocation.trim()) employment.companyLocation = companyLocation.trim();
    if (linkedIn.trim()) employment.linkedInProfile = linkedIn.trim();

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', { employment });
      setField('employment', employment);
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

        <Text style={styles.label}>Employment Type <Text style={styles.star}>*</Text></Text>
        <SearchableDropdown
          placeholder="Select Employment Type"
          value={employedType}
          options={EMPLOYED_TYPES}
          onSelect={(val) => { setEmployedType(val); setErrors((e) => ({ ...e, employedType: false })); }}
          error={errors.employedType}
        />

        <Text style={styles.label}>Add your Annual Income Details</Text>
        <SearchableDropdown
          placeholder="Select Income Slab"
          value={annualIncome}
          options={INCOME_SLABS}
          onSelect={(val) => setAnnualIncome(val)}
        />

        <Text style={styles.label}>You work as</Text>
        <TextInput
          style={styles.input}
          placeholder="Designation"
          placeholderTextColor="#999"
          value={designation}
          onChangeText={setDesignation}
        />

        <Text style={styles.label}>You work with</Text>
        <TextInput
          style={styles.input}
          placeholder="Company name"
          placeholderTextColor="#999"
          value={companyName}
          onChangeText={setCompanyName}
        />

        <Text style={styles.label}>Company Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Select your Company Location"
          placeholderTextColor="#999"
          value={companyLocation}
          onChangeText={setCompanyLocation}
        />

        <Text style={styles.label}>LinkedIn Link</Text>
        <TextInput
          style={[styles.input, errors.linkedIn && styles.inputError]}
          placeholder="Add your LinkedIn Link"
          placeholderTextColor="#999"
          value={linkedIn}
          onChangeText={(t) => { setLinkedIn(t); setErrors((e) => ({ ...e, linkedIn: false })); }}
          autoCapitalize="none"
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
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 30 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
  star: { color: '#D20236' },
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
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
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