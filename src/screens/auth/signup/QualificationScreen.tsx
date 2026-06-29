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

export default function QualificationScreen({ navigation }: any) {
  const [qualification, setQualification] = useState('');
  const [college, setCollege] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('Employment');
      return;
    }
    if (!qualification.trim()) {
      return Alert.alert('Required', 'Please enter your highest qualification');
    }

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', {
        education: {
          highestQualification: qualification.trim(),
          college: college.trim(),
        },
      });
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

        <Text style={styles.label}>Highest Qualification</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g - B.Tech in Computer Science"
          placeholderTextColor="#999"
          value={qualification}
          onChangeText={setQualification}
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