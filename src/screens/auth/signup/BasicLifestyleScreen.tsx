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

const HEALTH_CONDITION = [
  { label: 'No', value: 'NO' },
  { label: 'Yes', value: 'YES' },
];

const HEALTH_DETAILS_MAX = 500;

export default function BasicLifestyleScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const bl = data.basicLifestyle || {};
  const initialHealthCondition =
    bl.healthCondition ||
    (bl.healthDisclosure?.hasCondition === true
      ? 'YES'
      : bl.healthDisclosure?.hasCondition === false
        ? 'NO'
        : '');
  const [maritalStatus, setMaritalStatus] = useState(bl.maritalStatus || '');
  const [feet, setFeet] = useState(bl.feet || '');
  const [inches, setInches] = useState(bl.inches || '');
  const [weight, setWeight] = useState(bl.weight || '');
  const [diet, setDiet] = useState(bl.diet || '');
  const [healthCondition, setHealthCondition] = useState(initialHealthCondition);
  const [healthConditionDetails, setHealthConditionDetails] = useState(
    bl.healthConditionDetails || bl.healthDisclosure?.details || ''
  );
  const [healthConditionDetailsError, setHealthConditionDetailsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('Horoscope');
      return;
    }

    const cleanedHealthDetails =
      healthCondition === 'YES' ? healthConditionDetails.trim() : '';

    if (healthCondition === 'YES' && !cleanedHealthDetails) {
      setHealthConditionDetailsError(true);
      Alert.alert('Brief note required', 'Please add a brief note about the health condition.');
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
    if (healthCondition) {
      payload.healthDisclosure = {
        hasCondition: healthCondition === 'YES',
        details: healthCondition === 'YES' ? cleanedHealthDetails : undefined,
      };
    }

    try {
      setLoading(true);
      // skip API if unchanged (prevents backend step rewind)
      const blNow = {
        maritalStatus,
        feet,
        inches,
        weight,
        diet,
        healthCondition,
        healthConditionDetails: cleanedHealthDetails,
      };
      if (JSON.stringify(data.basicLifestyle || {}) === JSON.stringify(blNow)) {
        return navigation.navigate('Horoscope');
      }
      await apiClient.patch('/onboarding/profile', payload);
      setField('basicLifestyle', blNow);
      navigation.navigate('Horoscope');
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

        <Text style={styles.label}>
          Is there any ongoing health condition you'd like us to be aware of?
        </Text>
        <View style={styles.healthRow}>
          {HEALTH_CONDITION.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.healthPill,
                index === 0 && styles.healthPillFirst,
                healthCondition === option.value && styles.healthPillActive,
              ]}
              onPress={() => {
                setHealthCondition(option.value);
                if (option.value === 'NO') {
                  setHealthConditionDetails('');
                  setHealthConditionDetailsError(false);
                }
              }}
            >
              <Text
                style={[
                  styles.healthText,
                  healthCondition === option.value && styles.healthTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {healthCondition === 'YES' ? (
          <>
            <Text style={styles.label}>Please share a brief note</Text>
            <TextInput
              style={[styles.textArea, healthConditionDetailsError && styles.inputError]}
              placeholder="Briefly describe the condition or any relevant support needs"
              placeholderTextColor="#999"
              value={healthConditionDetails}
              onChangeText={(text) => {
                setHealthConditionDetails(text.slice(0, HEALTH_DETAILS_MAX));
                setHealthConditionDetailsError(false);
              }}
              multiline
              textAlignVertical="top"
              maxLength={HEALTH_DETAILS_MAX}
            />
            {!!healthConditionDetailsError && (
              <Text style={styles.fieldErrorText}>Please add a brief note</Text>
            )}
            <Text style={styles.counter}>
              {healthConditionDetails.length}/{HEALTH_DETAILS_MAX}
            </Text>
          </>
        ) : null}

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
  healthRow: { flexDirection: 'row', marginBottom: 16 },
  healthPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  healthPillFirst: { marginRight: 12 },
  healthPillActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  healthText: { fontSize: 15, color: '#333', fontWeight: '600' },
  healthTextActive: { color: '#D20236', fontWeight: '700' },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    minHeight: 110,
    marginBottom: 6,
  },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  fieldErrorText: { color: '#D20236', fontSize: 12, fontWeight: '500', marginBottom: 6 },
  counter: { alignSelf: 'flex-end', color: '#999', fontSize: 12, marginBottom: 12 },
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
