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

export default function FamilyDetailsScreen({ navigation }: any) {
  const [fatherName, setFatherName] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [brothers, setBrothers] = useState('');
  const [sisters, setSisters] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('BasicLifestyle');
      return;
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
      await apiClient.patch('/onboarding/profile', { family });
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
              style={styles.input}
              placeholder="Brothers"
              placeholderTextColor="#999"
              value={brothers}
              onChangeText={setBrothers}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <TextInput
              style={styles.input}
              placeholder="Sisters"
              placeholderTextColor="#999"
              value={sisters}
              onChangeText={setSisters}
              keyboardType="number-pad"
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