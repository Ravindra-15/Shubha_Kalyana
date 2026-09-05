import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';
import { useScrollToError } from '../../../hooks/useScrollToError';

const FAMILY_TYPES = [
  { label: 'Joint Family', value: 'JOINT' },
  { label: 'Nuclear Family', value: 'NUCLEAR' },
];

const SIBLING_PRESETS = ['0', '1', '2', '3', '4'];
const SIBLING_LABELS: { [k: string]: string } = {
  '0': 'None',
  '1': 'One',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
};

type SiblingPickerType = 'brothers' | 'sisters' | null;

export default function FamilyDetailsScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const fam = data.family || {};

  const [familyType, setFamilyType] = useState(fam.familyType || '');
  const [fatherName, setFatherName] = useState(fam.fatherName || '');
  const [fatherOccupation, setFatherOccupation] = useState(fam.fatherOccupation || '');
  const [motherName, setMotherName] = useState(fam.motherName || '');
  const [motherOccupation, setMotherOccupation] = useState(fam.motherOccupation || '');

  const [brothers, setBrothers] = useState(fam.brothers !== undefined ? String(fam.brothers) : '');
  const [sisters, setSisters] = useState(fam.sisters !== undefined ? String(fam.sisters) : '');
  const [isCustomBrothers, setIsCustomBrothers] = useState(
    fam.brothers !== undefined && !SIBLING_PRESETS.includes(String(fam.brothers)),
  );
  const [isCustomSisters, setIsCustomSisters] = useState(
    fam.sisters !== undefined && !SIBLING_PRESETS.includes(String(fam.sisters)),
  );

  const [activePicker, setActivePicker] = useState<SiblingPickerType>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});
  const { scrollRef, registerField, scrollToError } = useScrollToError();
  const FIELD_ORDER = ['fatherName', 'motherName', 'familyType'];

  const maxAllowed = familyType === 'JOINT' ? 20 : 10;

  const submit = async (_skip = false) => {
    const newErrors: { [k: string]: boolean } = {};
    if (!familyType) newErrors.familyType = true;
    if (!fatherName.trim()) newErrors.fatherName = true;
    if (!motherName.trim()) newErrors.motherName = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      scrollToError(Object.keys(newErrors), FIELD_ORDER);
      return Alert.alert('Required', 'Please fill all mandatory fields');
    }

    const family: any = { familyType };
    if (fatherName.trim()) family.fatherName = fatherName.trim();
    if (fatherOccupation.trim()) family.fatherOccupation = fatherOccupation.trim();
    if (motherName.trim()) family.motherName = motherName.trim();
    if (motherOccupation.trim()) family.motherOccupation = motherOccupation.trim();
    if (brothers.trim()) family.brothers = Number(brothers);
    if (sisters.trim()) family.sisters = Number(sisters);

    try {
      setLoading(true);
      if (JSON.stringify(data.family || {}) === JSON.stringify(family)) {
        return navigation.navigate('Horoscope');
      }
      await apiClient.patch('/onboarding/profile', { family });
      setField('family', family);
      navigation.navigate('Horoscope');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  const renderSiblingField = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    isCustom: boolean,
    setIsCustom: (v: boolean) => void,
    pickerType: SiblingPickerType,
  ) => (
    <View style={styles.half}>
      <Text style={styles.smallLabel}>{label}</Text>
      {isCustom ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter number"
            placeholderTextColor="#999"
            value={value}
            onChangeText={(t) => {
              const raw = t.replace(/\D/g, '');
              setValue(raw && Number(raw) > maxAllowed ? String(maxAllowed) : raw);
            }}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TouchableOpacity onPress={() => { setIsCustom(false); setValue(''); }}>
            <Text style={styles.linkText}>Choose from list</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.input} onPress={() => setActivePicker(pickerType)}>
          <Text style={value ? styles.pickerText : styles.pickerPlaceholder}>
            {value ? (SIBLING_LABELS[value] || value) : 'Select'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper ref={scrollRef}>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={7} total={16} />

          <Text style={styles.title}>
            Enter your{'\n'}<Text style={styles.titleRed}>Family Details</Text>
          </Text>

           <Text style={styles.label}>Father's Name <Text style={styles.star}>*</Text></Text>
          <TextInput
            ref={registerField('fatherName') as any}
            style={[styles.input, errors.fatherName && styles.inputError]}
            placeholder="Enter Father's name"
            placeholderTextColor="#999"
            value={fatherName}
            onChangeText={(t) => { setFatherName(t); setErrors((e) => ({ ...e, fatherName: false })); }}
          />

          <Text style={styles.label}>Father's Occupation</Text>
          <TextInput
            style={styles.input}
            placeholder="Occupation"
            placeholderTextColor="#999"
            value={fatherOccupation}
            onChangeText={setFatherOccupation}
          />

          <Text style={styles.label}>Mother's Name <Text style={styles.star}>*</Text></Text>
          <TextInput
            ref={registerField('motherName') as any}
            style={[styles.input, errors.motherName && styles.inputError]}
            placeholder="Enter Mother's name"
            placeholderTextColor="#999"
            value={motherName}
            onChangeText={(t) => { setMotherName(t); setErrors((e) => ({ ...e, motherName: false })); }}
          />

          <Text style={styles.label}>Mother's Occupation</Text>
          <TextInput
            style={styles.input}
            placeholder="Occupation"
            placeholderTextColor="#999"
            value={motherOccupation}
            onChangeText={setMotherOccupation}
          />

          <Text style={styles.label}>Family Type <Text style={styles.star}>*</Text></Text>
          <View style={styles.row} ref={registerField('familyType')}>
            {FAMILY_TYPES.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.typePill,
                  familyType === opt.value && styles.typePillActive,
                  errors.familyType && !familyType && styles.inputError,
                ]}
                onPress={() => {
                  setFamilyType(opt.value);
                  setErrors((e) => ({ ...e, familyType: false }));
                }}
              >
                <Text
                  style={[
                    styles.typePillText,
                    familyType === opt.value && styles.typePillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Siblings</Text>
          <View style={styles.row}>
            {renderSiblingField('Brother', brothers, setBrothers, isCustomBrothers, setIsCustomBrothers, 'brothers')}
            {renderSiblingField('Sister', sisters, setSisters, isCustomSisters, setIsCustomSisters, 'sisters')}
          </View>

          <Modal
            visible={activePicker !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setActivePicker(null)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setActivePicker(null)}
            >
              <View style={styles.modalContent}>
                <FlatList
                  data={[...SIBLING_PRESETS, '__other__']}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => {
                        const setValue = activePicker === 'brothers' ? setBrothers : setSisters;
                        const setCustom = activePicker === 'brothers' ? setIsCustomBrothers : setIsCustomSisters;
                        if (item === '__other__') {
                          setCustom(true);
                          setValue('');
                        } else {
                          setCustom(false);
                          setValue(item);
                        }
                        setActivePicker(null);
                      }}
                    >
                      <Text style={styles.modalOptionText}>
                        {item === '__other__' ? 'Other' : SIBLING_LABELS[item]}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

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
  title: { fontSize: 26, fontFamily: 'Outfit-Regular', color: '#000', textAlign: 'center', marginBottom: 36 },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 10, marginTop: 4 },
  smallLabel: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#555', marginBottom: 8 },
  star: { color: '#D20236' },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    color: '#000',
    justifyContent: 'center',
  },
  pickerText: { fontSize: 15, color: '#000' },
  pickerPlaceholder: { fontSize: 15, color: '#999' },
  linkText: { color: '#D20236', fontSize: 12, fontFamily: 'Outfit-SemiBold', marginTop: -12, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  half: { flex: 1 },
  typePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  typePillActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  typePillText: { fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#333' },
  typePillTextActive: { color: '#D20236' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, maxHeight: 350, paddingVertical: 8 },
  modalOption: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalOptionText: { fontSize: 16, color: '#333', textAlign: 'center' },
  spacer: { flex: 1, minHeight: 30 },
  nextBtn: { backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  skipBtn: { borderWidth: 1, borderColor: '#D20236', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  skipText: { color: '#000', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
});