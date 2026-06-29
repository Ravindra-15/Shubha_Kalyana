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
import { pick, types } from '@react-native-documents/picker';
import ProgressBar from '../../../components/ProgressBar';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';

// Verhoeff checksum (same as backend) — validates Aadhaar structure
const d = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
];
const p = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8],
];
const isValidAadhaar = (value: string) => {
  const a = value.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(a)) return false;
  let c = 0;
  a.split('').reverse().forEach((digit, i) => {
    c = d[c][p[i % 8][Number(digit)]];
  });
  return c === 0;
};

export default function UploadAadhaarScreen({ navigation }: any) {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errNum, setErrNum] = useState(false);

  const pickFile = async () => {
    try {
      const [res] = await pick({
        type: [types.images, types.pdf],
      });
      if (res.size && res.size > 5 * 1024 * 1024) {
        return Alert.alert('Too large', 'File must be under 5MB');
      }
      setFile(res);
    } catch (err: any) {
      if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Error', 'Could not pick file');
      }
    }
  };

  const upload = async () => {
    const num = aadhaarNumber.replace(/\s/g, '');
    if (!isValidAadhaar(num)) {
      setErrNum(true);
      return Alert.alert('Invalid', 'Please enter a valid 12-digit Aadhaar number');
    }
    if (!file) {
      return Alert.alert('Required', 'Please upload your Aadhaar document');
    }

    const formData = new FormData();
    formData.append('aadhaar', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `aadhaar_${Date.now()}`,
    } as any);
    formData.append('aadhaarNumber', num);

    try {
      setLoading(true);
      await apiClient.post('/onboarding/aadhaar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigation.navigate('ReviewProfile');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Upload failed');
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

          <Text style={styles.congrats}>One Last Thing !</Text>
          <Text style={styles.title}>
            Upload your Aadhar Card <Text style={styles.star}>*</Text>
          </Text>
          <Text style={styles.subtitle}>Upload document for verification</Text>

          <Text style={styles.label}>Aadhaar Number <Text style={styles.star}>*</Text></Text>
          <TextInput
            style={[styles.input, errNum && styles.inputError]}
            placeholder="12-digit Aadhaar number"
            placeholderTextColor="#999"
            value={aadhaarNumber}
            onChangeText={(t) => { setAadhaarNumber(t); setErrNum(false); }}
            keyboardType="number-pad"
            maxLength={12}
          />

          <TouchableOpacity style={styles.dropZone} onPress={pickFile} activeOpacity={0.7}>
            <Text style={styles.uploadIcon}>⬆</Text>
            {file ? (
              <Text style={styles.fileName}>{file.name}</Text>
            ) : (
              <>
                <Text style={styles.dropTitle}>Choose a file or drag{'\n'}& drop it here</Text>
                <Text style={styles.dropHint}>JPG, PNG, PDF formats, up to 5MB</Text>
              </>
            )}
            <View style={styles.browseBtn}>
              <Text style={styles.browseText}>Browse File</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.nextBtn} onPress={upload} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Next  →</Text>}
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
  congrats: { fontSize: 22, fontWeight: '700', color: '#D20236', textAlign: 'center', marginTop: 10 },
  title: { fontSize: 19, fontWeight: '700', color: '#000', textAlign: 'center', marginTop: 4 },
  star: { color: '#D20236' },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
    color: '#000',
  },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  dropZone: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 30,
    alignItems: 'center',
  },
  uploadIcon: { fontSize: 28, color: '#666', marginBottom: 10 },
  dropTitle: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'center' },
  dropHint: { fontSize: 12, color: '#999', marginTop: 8, marginBottom: 16 },
  fileName: { fontSize: 14, color: '#D20236', fontWeight: '600', marginBottom: 16, marginTop: 4 },
  browseBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  browseText: { color: '#D20236', fontSize: 14, fontWeight: '600' },
  spacer: { minHeight: 30 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});