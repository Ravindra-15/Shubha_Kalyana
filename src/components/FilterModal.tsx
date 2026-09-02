import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import SearchableDropdown from './SearchableDropdown';
import MultiSelectDropdown from './MultiSelectDropdown';
import { getCastes, Caste } from '../api/caste';
import { INDIAN_STATE_OPTIONS } from '../constants/indianStates';

export type Filters = {
  minAge: number;
  maxAge: number;
  religion: string;
  caste: string[];
  subCaste: string[];
  maritalStatus: string;
  education: string[];
  profession: string[];
  preferredLocation: string[];
  workingLocation: string[];
};

const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Other'];
const MARITAL_STATUS = [
  { label: 'Never Married', value: 'NEVER_MARRIED' },
  { label: 'Divorced', value: 'DIVORCED' },
  { label: 'Widowed', value: 'WIDOWED' },
  { label: 'Awaiting Divorce', value: 'AWAITING_DIVORCE' },
];
const EDUCATION = ['B.Tech', 'B.E', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'MBBS', 'M.Tech', 'M.Sc', 'MBA', 'MCA', 'PhD', 'Diploma'];
// Kept in sync with the profession options shown during onboarding
// (matrimony-user/src/onboarding/onboardingOptions.js -> professionOptions).
const PROFESSION = [
  'Software Engineer',
  'Senior Software Engineer',
  'Team Lead',
  'Project Manager',
  'Doctor',
  'Teacher',
  'Professor',
  'Lawyer',
  'Business Owner',
  'Government Officer',
];

const DEFAULT: Filters = {
  minAge: 24, maxAge: 30, religion: '', caste: [], subCaste: [], maritalStatus: '', education: [], profession: [], preferredLocation: [], workingLocation: [],
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters | null) => void;
  initial?: Filters;
};

export default function FilterModal({ visible, onClose, onApply, initial }: Props) {
  const [minAge, setMinAge] = useState(initial?.minAge ?? 24);
  const [maxAge, setMaxAge] = useState(initial?.maxAge ?? 30);
  const [religion, setReligion] = useState(initial?.religion || '');
  const [caste, setCaste] = useState<string[]>(initial?.caste || []);
  const [subCaste, setSubCaste] = useState<string[]>(initial?.subCaste || []);
  const [maritalStatus, setMaritalStatus] = useState(initial?.maritalStatus || '');
  const [education, setEducation] = useState<string[]>(initial?.education || []);
  const [profession, setProfession] = useState<string[]>(initial?.profession || []);
  const [preferredLocation, setPreferredLocation] = useState<string[]>(initial?.preferredLocation || []);
  const [workingLocation, setWorkingLocation] = useState<string[]>(initial?.workingLocation || []);
  const [castes, setCastes] = useState<Caste[]>([]);

  useEffect(() => {
    (async () => {
      try { setCastes(await getCastes()); } catch {}
    })();
  }, []);

  // re-sync local state whenever modal opens with fresh "initial" values (e.g. after a reset)
  useEffect(() => {
    if (visible) {
      setMinAge(initial?.minAge ?? 24);
      setMaxAge(initial?.maxAge ?? 30);
      setReligion(initial?.religion || '');
      setCaste(initial?.caste || []);
      setSubCaste(initial?.subCaste || []);
      setMaritalStatus(initial?.maritalStatus || '');
      setEducation(initial?.education || []);
      setProfession(initial?.profession || []);
      setPreferredLocation(initial?.preferredLocation || []);
      setWorkingLocation(initial?.workingLocation || []);
    }
  }, [visible, initial]);

  // union of subcastes across all currently-selected castes
  const subCasteOptions = castes
    .filter((c) => caste.includes(c._id))
    .flatMap((c) => c.subCastes || []);
  const uniqueSubCasteOptions = Array.from(new Set(subCasteOptions));

  const reset = () => {
    setMinAge(DEFAULT.minAge); setMaxAge(DEFAULT.maxAge);
    setReligion(''); setCaste([]); setSubCaste([]); setMaritalStatus(''); setEducation([]); setProfession([]); setPreferredLocation([]); setWorkingLocation([]);
    onApply(null); // clear all filters → reload full list
    onClose();
  };

  const apply = () => {
    onApply({ minAge, maxAge, religion, caste, subCaste, maritalStatus, education, profession, preferredLocation, workingLocation });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Filters</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            <Text style={styles.label}>Age Between : {minAge} - {maxAge}</Text>
            <Text style={styles.sliderHint}>Min Age: {minAge}</Text>
            <Slider
              minimumValue={18}
              maximumValue={70}
              step={1}
              value={minAge}
              onValueChange={(v) => setMinAge(Math.min(v, maxAge))}
              minimumTrackTintColor="#D20236"
              maximumTrackTintColor="#eee"
              thumbTintColor="#D20236"
            />
            <Text style={styles.sliderHint}>Max Age: {maxAge}</Text>
            <Slider
              minimumValue={18}
              maximumValue={70}
              step={1}
              value={maxAge}
              onValueChange={(v) => setMaxAge(Math.max(v, minAge))}
              minimumTrackTintColor="#D20236"
              maximumTrackTintColor="#eee"
              thumbTintColor="#D20236"
            />

            <Text style={styles.label}>Religion</Text>
            <SearchableDropdown
              placeholder="Select Religion"
              value={religion}
              options={RELIGIONS.map((r) => ({ label: r, value: r }))}
              onSelect={setReligion}
            />

            <Text style={styles.label}>Caste</Text>
            <MultiSelectDropdown
              placeholder="Select Caste"
              value={caste}
              options={castes.map((c) => ({ label: c.casteName, value: c._id }))}
              onChange={(vals) => { setCaste(vals); setSubCaste([]); }}
            />

            <Text style={styles.label}>Sub Caste</Text>
            <MultiSelectDropdown
              placeholder="Select Sub Caste"
              value={subCaste}
              options={uniqueSubCasteOptions.map((s) => ({ label: s, value: s }))}
              onChange={setSubCaste}
              allowCustom
              disabled={uniqueSubCasteOptions.length === 0}
            />

            <Text style={styles.label}>Marital Status</Text>
            <SearchableDropdown
              placeholder="Select Marital Status"
              value={maritalStatus}
              options={MARITAL_STATUS}
              onSelect={setMaritalStatus}
            />

            <Text style={styles.label}>Education</Text>
            <MultiSelectDropdown
              placeholder="Select Education"
              value={education}
              options={EDUCATION.map((e) => ({ label: e, value: e }))}
              onChange={setEducation}
              allowCustom
            />

            <Text style={styles.label}>Profession</Text>
            <MultiSelectDropdown
              placeholder="Select Profession"
              value={profession}
              options={PROFESSION.map((p) => ({ label: p, value: p }))}
              onChange={setProfession}
              allowCustom
            />

            <Text style={styles.label}>Preferred Location</Text>
            <MultiSelectDropdown
              placeholder="Select permanent state"
              value={preferredLocation}
              options={INDIAN_STATE_OPTIONS}
              onChange={setPreferredLocation}
            />

            <Text style={styles.label}>Working Location</Text>
            <MultiSelectDropdown
              placeholder="Select current state"
              value={workingLocation}
              options={INDIAN_STATE_OPTIONS}
              onChange={setWorkingLocation}
            />
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetText}>Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={apply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    height: '85%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#000', marginBottom: 16 },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 8, marginTop: 10 },
  sliderHint: { fontSize: 12, color: '#666' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  resetBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  resetText: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#333' },
  applyBtn: { flex: 1, backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  applyText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#fff' },
});
