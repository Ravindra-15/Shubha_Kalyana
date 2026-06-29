import React, { useState, useEffect } from 'react';
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
import { getCastes, Caste } from '../../../api/caste';

const MARITAL = [
  { label: 'Never Married', value: 'NEVER_MARRIED' },
  { label: 'Divorced', value: 'DIVORCED' },
  { label: 'Widowed', value: 'WIDOWED' },
  { label: 'Awaiting Divorce', value: 'AWAITING_DIVORCE' },
];
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Other'];
const EDUCATION = ['B.Tech', 'B.E', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'MBBS', 'M.Tech', 'M.Sc', 'MBA', 'MCA', 'PhD', 'Diploma', 'Other'];
const PROFESSION = ['Engineer', 'Doctor', 'Teacher', 'Business', 'Government Job', 'Lawyer', 'CA', 'Software', 'Banker', 'Other'];
const RESIDENT = [
  { label: 'Indian', value: 'Indian' },
  { label: 'NRI', value: 'NRI' },
];

// helper: multi-select toggle chips
function Chips({
  options,
  selected,
  onToggle,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(o.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function PartnerPreferenceScreen({ navigation }: any) {
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<string[]>([]);
  const [religion, setReligion] = useState<string[]>([]);
  const [casteIds, setCasteIds] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([]);
  const [profession, setProfession] = useState<string[]>([]);
  const [resident, setResident] = useState<string[]>([]);

  const [castes, setCastes] = useState<Caste[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ age?: boolean }>({});

  useEffect(() => {
    (async () => {
      try {
        const list = await getCastes();
        setCastes(list);
      } catch {}
    })();
  }, []);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('VerifyMobile');
      return;
    }

    // age validation (only if entered)
    if (ageMin.trim() || ageMax.trim()) {
      const mn = Number(ageMin), mx = Number(ageMax);
      if (!ageMin.trim() || !ageMax.trim() || mn < 18 || mx > 100 || mn > mx) {
        setErrors({ age: true });
        return Alert.alert('Invalid', 'Enter a valid age range (18-100, min ≤ max)');
      }
    }
    setErrors({});

    const payload: any = {};
    if (ageMin.trim() && ageMax.trim()) payload.ageRange = { min: Number(ageMin), max: Number(ageMax) };
    if (maritalStatus.length) payload.maritalStatus = maritalStatus;
    if (religion.length) payload.religion = religion;
    if (casteIds.length) payload.caste = casteIds;
    if (education.length) payload.education = education;
    if (profession.length) payload.profession = profession;
    if (resident.length) payload.ressident = resident;

    try {
      setLoading(true);
      await apiClient.put('/onboarding/partner-preference', payload);
      navigation.navigate('VerifyMobile');
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

          <ProgressBar step={5} total={8} />

          <Text style={styles.title}>
            Select your{'\n'}<Text style={styles.titleRed}>Partner Preferences</Text>
          </Text>

          <Text style={styles.label}>Age Range</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half, errors.age && styles.inputError]}
              placeholder="Min"
              placeholderTextColor="#999"
              value={ageMin}
              onChangeText={(t) => { setAgeMin(t); setErrors({}); }}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.half, errors.age && styles.inputError]}
              placeholder="Max"
              placeholderTextColor="#999"
              value={ageMax}
              onChangeText={(t) => { setAgeMax(t); setErrors({}); }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <Text style={styles.label}>Marital Status</Text>
          <Chips options={MARITAL} selected={maritalStatus} onToggle={(v) => toggle(maritalStatus, setMaritalStatus, v)} />

          <Text style={styles.label}>Religion</Text>
          <Chips
            options={RELIGIONS.map((r) => ({ label: r, value: r }))}
            selected={religion}
            onToggle={(v) => toggle(religion, setReligion, v)}
          />

          <Text style={styles.label}>Preferred Caste</Text>
          <Chips
            options={castes.map((c) => ({ label: c.casteName, value: c._id }))}
            selected={casteIds}
            onToggle={(v) => toggle(casteIds, setCasteIds, v)}
          />

          <Text style={styles.label}>Preferred Education</Text>
          <Chips
            options={EDUCATION.map((e) => ({ label: e, value: e }))}
            selected={education}
            onToggle={(v) => toggle(education, setEducation, v)}
          />

          <Text style={styles.label}>Preferred Profession</Text>
          <Chips
            options={PROFESSION.map((p) => ({ label: p, value: p }))}
            selected={profession}
            onToggle={(v) => toggle(profession, setProfession, v)}
          />

          <Text style={styles.label}>Resident</Text>
          <Chips options={RESIDENT} selected={resident} onToggle={(v) => toggle(resident, setResident, v)} />

          <View style={{ height: 20 }} />

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
  inner: { paddingHorizontal: 24, paddingBottom: 30 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 24 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    marginBottom: 12,
  },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 30,
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#D20236', fontWeight: '600' },
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