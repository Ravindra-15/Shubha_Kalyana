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
import SearchableDropdown from '../../../components/SearchableDropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';
const QUALIFICATIONS = [
  'B.Tech', 'B.E', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'B.Pharm', 'LLB', 'MBBS',
  'M.Tech', 'M.E', 'M.Sc', 'M.Com', 'M.A', 'MBA', 'MCA', 'M.Pharm', 'LLM',
  'PhD', 'Diploma', 'ITI', '12th', '10th', 'Other',
];

export default function QualificationScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [qualification, setQualification] = useState(data.education?.highestQualification || '');
  const [college, setCollege] = useState(data.education?.college || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ qualification?: boolean }>({});

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('Employment');
      return;
    }
    if (!qualification.trim()) {
      setErrors({ qualification: true });
      return Alert.alert('Required', 'Please enter your highest qualification');
    }
    setErrors({});

    try {
      setLoading(true);
      const education = {
        highestQualification: qualification.trim(),
        college: college.trim(),
      };
      // skip API if unchanged (prevents backend step rewind on back-navigation)
      const prev = data.education || {};
      if (prev.highestQualification === education.highestQualification && prev.college === education.college) {
        return navigation.navigate('Employment');
      }
      await apiClient.patch('/onboarding/profile', { education });
      setField('education', education);
      navigation.navigate('Employment');
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

        <ProgressBar step={1} total={8} />

        <Text style={styles.title}>
          Select your{'\n'}<Text style={styles.titleRed}>Qualification</Text>
        </Text>

        <Text style={styles.label}>Highest Qualification <Text style={styles.star}>*</Text></Text>
        <SearchableDropdown
          placeholder="Select or type qualification"
          value={qualification}
          options={QUALIFICATIONS.map((q) => ({ label: q, value: q }))}
          onSelect={(val) => { setQualification(val); setErrors({}); }}
          allowCustom
          error={errors.qualification}
        />

        <Text style={styles.label}>College / University</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your University name"
          placeholderTextColor="#999"
          value={college}
          onChangeText={setCollege}
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
  star: { color: '#D20236' },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 24,
    color: '#000',
  },
  spacer: { flex: 1, minHeight: 40 },
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