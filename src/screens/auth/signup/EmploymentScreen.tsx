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
import SearchableDropdown from '../../../components/SearchableDropdown';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';

const EMPLOYED_TYPES = [
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Government', value: 'GOVERNMENT' },
  { label: 'Semi Government', value: 'SEMI_GOVERNMENT' },
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Agriculture', value: 'AGRICULTURE' },
];

const INCOME_SLABS = [
  { label: 'Below ₹3 Lakh', value: 'BELOW_3L' },
  { label: '₹3 - 5 Lakh', value: '3L_5L' },
  { label: '₹5 - 10 Lakh', value: '5L_10L' },
  { label: '₹10 - 20 Lakh', value: '10L_20L' },
  { label: '₹20 - 50 Lakh', value: '20L_50L' },
  { label: 'Above ₹50 Lakh', value: 'ABOVE_50L' },
  { label: 'Write your own', value: '__other__' },
];

const BUSINESS_TYPES = [
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Trading', value: 'Trading' },
  { label: 'Services', value: 'Services' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Other', value: 'Other' },
];

const EXPERIENCE_PRESETS = [
  { label: 'Less than 1 year', value: '0-1', years: 0, months: 6 },
  { label: '1 - 2 years', value: '1-2', years: 1, months: 6 },
  { label: '2 - 5 years', value: '2-5', years: 3, months: 6 },
  { label: '5 - 10 years', value: '5-10', years: 7, months: 6 },
  { label: '10 - 15 years', value: '10-15', years: 12, months: 6 },
  { label: '15 - 20 years', value: '15-20', years: 17, months: 6 },
  { label: 'More than 20 years', value: '20+', years: 22, months: 0 },
  { label: 'Other (enter exact)', value: '__other__' },
];

export default function EmploymentScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const emp = data.employment || {};

  const [employedType, setEmployedType] = useState(emp.employedType || '');
  const [designation, setDesignation] = useState(emp.designation || '');
  const [companyName, setCompanyName] = useState(emp.companyName || '');
  const [typeOfBusiness, setTypeOfBusiness] = useState(emp.typeOfBusiness || '');
  const [companyLocation, setCompanyLocation] = useState(emp.companyLocation || '');
  const [linkedIn, setLinkedIn] = useState(emp.linkedInProfile || '');

  const [annualIncome, setAnnualIncome] = useState(emp.annualIncome || '');
  const [isCustomIncome, setIsCustomIncome] = useState(
    emp.annualIncome ? !INCOME_SLABS.some((s) => s.value === emp.annualIncome) : false,
  );

  const [expPreset, setExpPreset] = useState('');
  const [expYears, setExpYears] = useState(
    emp.totalExperienceYears ? String(emp.totalExperienceYears) : '',
  );
  const [expMonths, setExpMonths] = useState(
    emp.totalExperienceMonths ? String(emp.totalExperienceMonths) : '',
  );
  const [isCustomExperience, setIsCustomExperience] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});

  const isJobType = employedType === 'PRIVATE' || employedType === 'GOVERNMENT' || employedType === 'SEMI_GOVERNMENT';
  const isBusiness = employedType === 'BUSINESS';
  const isAgriculture = employedType === 'AGRICULTURE';
  const showDesignation = isJobType || isBusiness;
  const showExperience = isJobType || isBusiness;
  const showLinkedIn = !isAgriculture;

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('FamilyDetails');
      return;
    }

    const newErrors: { [k: string]: boolean } = {};
    if (!employedType) newErrors.employedType = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return Alert.alert('Required', 'Please select employment type');
    }

    if (linkedIn.trim() && !/linkedin\.com/i.test(linkedIn.trim())) {
      setErrors({ linkedIn: true });
      return Alert.alert('Invalid', 'Please enter a valid LinkedIn URL');
    }

    const employment: any = { employedType };
    if (annualIncome) employment.annualIncome = annualIncome;
    if (showDesignation && designation.trim()) employment.designation = designation.trim();
    if (companyName.trim()) employment.companyName = companyName.trim();
    if (isBusiness && typeOfBusiness) employment.typeOfBusiness = typeOfBusiness;
    if (companyLocation.trim()) employment.companyLocation = companyLocation.trim();
    if (showLinkedIn && linkedIn.trim()) employment.linkedInProfile = linkedIn.trim();
    if (showExperience && expYears) employment.totalExperienceYears = Number(expYears);
    if (showExperience && expMonths) employment.totalExperienceMonths = Number(expMonths);

    try {
      setLoading(true);
      if (JSON.stringify(data.employment || {}) === JSON.stringify(employment)) {
        return navigation.navigate('FamilyDetails');
      }
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
      <KeyboardWrapper>
        <View style={styles.scroll}>
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
            onSelect={(val) => {
              setEmployedType(val);
              setErrors((e) => ({ ...e, employedType: false }));
            }}
            error={errors.employedType}
          />

          {showDesignation && (
            <>
              <Text style={styles.label}>You work as</Text>
              <TextInput
                style={styles.input}
                placeholder="Designation"
                placeholderTextColor="#999"
                value={designation}
                onChangeText={setDesignation}
              />
            </>
          )}

          {isBusiness ? (
            <>
              <Text style={styles.label}>Firm Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Firm name"
                placeholderTextColor="#999"
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.label}>Type of Business</Text>
              <SearchableDropdown
                placeholder="Select type of business"
                value={typeOfBusiness}
                options={BUSINESS_TYPES}
                onSelect={setTypeOfBusiness}
              />

              <Text style={styles.label}>Firm Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Firm location"
                placeholderTextColor="#999"
                value={companyLocation}
                onChangeText={setCompanyLocation}
              />
            </>
          ) : isJobType ? (
            <>
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
                placeholder="Enter your company location"
                placeholderTextColor="#999"
                value={companyLocation}
                onChangeText={setCompanyLocation}
              />
            </>
          ) : null}

          <Text style={styles.label}>Add your Annual Income Details</Text>
          {isCustomIncome ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter annual income"
                placeholderTextColor="#999"
                value={annualIncome}
                onChangeText={setAnnualIncome}
                keyboardType="number-pad"
              />
              <TouchableOpacity onPress={() => { setIsCustomIncome(false); setAnnualIncome(''); }}>
                <Text style={styles.linkText}>Choose from list instead</Text>
              </TouchableOpacity>
            </>
          ) : (
            <SearchableDropdown
              placeholder="Select Income Slab"
              value={annualIncome}
              options={INCOME_SLABS}
              onSelect={(val) => {
                if (val === '__other__') {
                  setIsCustomIncome(true);
                  setAnnualIncome('');
                  return;
                }
                setAnnualIncome(val);
              }}
            />
          )}

          {showExperience && (
            <>
              <Text style={styles.label}>Total Experience</Text>
              {isCustomExperience ? (
                <>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.flexInput]}
                      placeholder="Years"
                      placeholderTextColor="#999"
                      value={expYears}
                      onChangeText={(t) => {
                        const raw = t.replace(/\D/g, '');
                        setExpYears(raw && Number(raw) > 50 ? '50' : raw);
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <TextInput
                      style={[styles.input, styles.flexInput]}
                      placeholder="Months"
                      placeholderTextColor="#999"
                      value={expMonths}
                      onChangeText={(t) => {
                        const raw = t.replace(/\D/g, '');
                        setExpMonths(raw && Number(raw) > 11 ? '11' : raw);
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setIsCustomExperience(false);
                      setExpPreset('');
                      setExpYears('');
                      setExpMonths('');
                    }}
                  >
                    <Text style={styles.linkText}>Choose from list instead</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <SearchableDropdown
                  placeholder="Select experience"
                  value={expPreset}
                  options={EXPERIENCE_PRESETS}
                  onSelect={(val) => {
                    if (val === '__other__') {
                      setIsCustomExperience(true);
                      setExpPreset('');
                      setExpYears('');
                      setExpMonths('');
                      return;
                    }
                    const preset = EXPERIENCE_PRESETS.find((p) => p.value === val);
                    if (preset) {
                      setExpPreset(val);
                      setExpYears(String(preset.years));
                      setExpMonths(String(preset.months));
                    }
                  }}
                />
              )}
            </>
          )}

          {showLinkedIn && (
            <>
              <Text style={styles.label}>LinkedIn Link</Text>
              <TextInput
                style={[styles.input, errors.linkedIn && styles.inputError]}
                placeholder="https://linkedin.com/in/your-name"
                placeholderTextColor="#999"
                value={linkedIn}
                onChangeText={(t) => {
                  setLinkedIn(t);
                  setErrors((e) => ({ ...e, linkedIn: false }));
                }}
                autoCapitalize="none"
              />
            </>
          )}

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
  row: { flexDirection: 'row', gap: 10 },
  flexInput: { flex: 1 },
  linkText: { color: '#D20236', fontSize: 13, fontWeight: '600', marginTop: -12, marginBottom: 16 },
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