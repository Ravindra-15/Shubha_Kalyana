import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';

const GROUPS = [
  {
    title: 'Entertainment',
    items: ['Music', 'Movies', 'Web Series', 'Reading', 'Podcasts'],
  },
  {
    title: 'Lifestyle & Activities',
    items: ['Traveling', 'Cooking', 'Gardening', 'Shopping', 'Drinking', 'Driving', 'Smoking'],
  },
  {
    title: 'Fitness & Health',
    items: ['Gym', 'Yoga', 'Running', 'Meditation', 'Sports', 'Cycling', 'Cricket'],
  },
];

export default function HobbiesScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [selected, setSelected] = useState<string[]>(data.hobbies || []);
  const [loading, setLoading] = useState(false);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('UploadAadhaar');
      return;
    }
    if (selected.length === 0) {
      return navigation.navigate('UploadAadhaar');
    }

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', { hobbiesAndInterests: selected });
      setField('hobbies', selected);
      navigation.navigate('UploadAadhaar');
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

          <ProgressBar step={9} total={9} />

          <Text style={styles.title}>
            Add your Hobbies and{'\n'}<Text style={styles.titleRed}>Interests</Text>
          </Text>

          {GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.chipRow}>
                {group.items.map((item) => {
                  const active = selected.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggle(item)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

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
  inner: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 24, marginTop: 6 },
  titleRed: { color: '#D20236' },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 30,
    paddingVertical: 9,
    paddingHorizontal: 18,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#D20236', fontWeight: '600' },
  spacer: { minHeight: 20 },
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