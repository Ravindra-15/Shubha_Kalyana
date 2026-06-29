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
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';
export default function FamilyDetailsScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const fam = data.family || {};
  const [fatherName, setFatherName] = useState(fam.fatherName || '');
  const [fatherOccupation, setFatherOccupation] = useState(fam.fatherOccupation || '');
  const [motherName, setMotherName] = useState(fam.motherName || '');
  const [motherOccupation, setMotherOccupation] = useState(fam.motherOccupation || '');
  const [brothers, setBrothers] = useState(fam.brothers !== undefined ? String(fam.brothers) : '');
  const [sisters, setSisters] = useState(fam.sisters !== undefined ? String(fam.sisters) : '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ brothers?: boolean; sisters?: boolean }>({});

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('BasicLifestyle');
      return;
    }

    const newErrors: { brothers?: boolean; sisters?: boolean } = {};
    if (brothers.trim() && (Number(brothers) < 0 || Number(brothers) > 14)) newErrors.brothers = true;
    if (sisters.trim() && (Number(sisters) < 0 || Number(sisters) > 14)) newErrors.sisters = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return Alert.alert('Invalid', 'Brothers / Sisters count must be between 0 and 14');
    }

    const family: any = {};
    if (fatherName.trim()) family.fatherName = fatherName.trim();
    if (fatherOccupation.trim()) family.fatherOccupation = fatherOccupation.trim();
    if (motherName.trim()) family.motherName = motherName.trim();
    if (motherOccupation.trim()) family.motherOccupation = motherOccupation.trim();
    if (brothers.trim()) family.brothers = Number(brothers);
    if (sisters.trim()) family.sisters = Number(sisters);

    try {
      setLoading(true);
      // skip API if unchanged (prevents backend step rewind)
      if (JSON.stringify(data.family || {}) === JSON.stringify(family)) {
        return navigation.navigate('BasicLifestyle');
      }
      await apiClient.patch('/onboarding/profile', { family });
      setField('family', family);
      navigation.navigate('BasicLifestyle');
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

        <ProgressBar step={3} total={8} />

        <Text style={styles.title}>
          Enter your{'\n'}<Text style={styles.titleRed}>Family Details</Text>
        </Text>

        <Text style={styles.label}>Parents Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Father's name"
          placeholderTextColor="#999"
          value={fatherName}
          onChangeText={setFatherName}
        />
        <TextInput
          style={styles.input}
          placeholder="Occupation"
          placeholderTextColor="#999"
          value={fatherOccupation}
          onChangeText={setFatherOccupation}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Mother's name"
          placeholderTextColor="#999"
          value={motherName}
          onChangeText={setMotherName}
        />
        <TextInput
          style={styles.input}
          placeholder="Occupation"
          placeholderTextColor="#999"
          value={motherOccupation}
          onChangeText={setMotherOccupation}
        />

        <Text style={styles.label}>Siblings</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextInput
              style={[styles.input, errors.brothers && styles.inputError]}
              placeholder="Brothers"
              placeholderTextColor="#999"
              value={brothers}
              onChangeText={(t) => { setBrothers(t); setErrors((e) => ({ ...e, brothers: false })); }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={styles.half}>
            <TextInput
              style={[styles.input, errors.sisters && styles.inputError]}
              placeholder="Sisters"
              placeholderTextColor="#999"
              value={sisters}
              onChangeText={(t) => { setSisters(t); setErrors((e) => ({ ...e, sisters: false })); }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
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
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 36 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
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
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
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