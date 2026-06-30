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
import { getCastes, Caste } from '../api/caste';

export type Filters = {
  minAge: number;
  maxAge: number;
  caste: string;
  subCaste: string;
  education: string;
  profession: string;
  district: string;
};

const EDUCATION = ['B.Tech', 'B.E', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'MBBS', 'M.Tech', 'M.Sc', 'MBA', 'MCA', 'PhD', 'Diploma'];
const PROFESSION = ['Engineer', 'Doctor', 'Teacher', 'Business', 'Government Job', 'Lawyer', 'CA', 'Software', 'Banker'];

const DEFAULT: Filters = {
  minAge: 24, maxAge: 30, caste: '', subCaste: '', education: '', profession: '', district: '',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  initial?: Filters;
};

export default function FilterModal({ visible, onClose, onApply, initial }: Props) {
  const [minAge, setMinAge] = useState(initial?.minAge ?? 24);
  const [maxAge, setMaxAge] = useState(initial?.maxAge ?? 30);
  const [casteId, setCasteId] = useState(initial?.caste || '');
  const [subCaste, setSubCaste] = useState(initial?.subCaste || '');
  const [education, setEducation] = useState(initial?.education || '');
  const [profession, setProfession] = useState(initial?.profession || '');
  const [district, setDistrict] = useState(initial?.district || '');
  const [castes, setCastes] = useState<Caste[]>([]);

  useEffect(() => {
    (async () => {
      try { setCastes(await getCastes()); } catch {}
    })();
  }, []);

  const subCasteOptions = castes.find((c) => c._id === casteId)?.subCastes || [];

  const reset = () => {
    setMinAge(DEFAULT.minAge); setMaxAge(DEFAULT.maxAge);
    setCasteId(''); setSubCaste(''); setEducation(''); setProfession(''); setDistrict('');
    onApply(null as any); // clear all filters → reload full list
    onClose();
  };

  const apply = () => {
    onApply({ minAge, maxAge, caste: casteId, subCaste, education, profession, district });
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

            <Text style={styles.label}>Caste</Text>
            <SearchableDropdown
              placeholder="Select Caste"
              value={casteId}
              options={castes.map((c) => ({ label: c.casteName, value: c._id }))}
              onSelect={(val) => { setCasteId(val); setSubCaste(''); }}
            />

            <Text style={styles.label}>Sub Caste</Text>
            <SearchableDropdown
              placeholder="Select Sub Caste"
              value={subCaste}
              options={subCasteOptions.map((s) => ({ label: s, value: s }))}
              onSelect={setSubCaste}
              allowCustom
              disabled={subCasteOptions.length === 0}
            />

            <Text style={styles.label}>Education</Text>
            <SearchableDropdown
              placeholder="Select Education"
              value={education}
              options={EDUCATION.map((e) => ({ label: e, value: e }))}
              onSelect={setEducation}
              allowCustom
            />

            <Text style={styles.label}>Profession</Text>
            <SearchableDropdown
              placeholder="Select Profession"
              value={profession}
              options={PROFESSION.map((p) => ({ label: p, value: p }))}
              onSelect={setProfession}
              allowCustom
            />

            <Text style={styles.label}>Home Town District</Text>
            <SearchableDropdown
              placeholder="Select District"
              value={district}
              options={[]}
              onSelect={setDistrict}
              allowCustom
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
  title: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 10 },
  sliderHint: { fontSize: 12, color: '#666' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  resetBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  resetText: { fontSize: 15, fontWeight: '600', color: '#333' },
  applyBtn: { flex: 1, backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  applyText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});