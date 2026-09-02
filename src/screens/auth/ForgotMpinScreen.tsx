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
import KeyboardWrapper from '../../components/KeyboardWrapper';
import { sendChangeMpinOtp } from '../../api/settings';

export default function ForgotMpinScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const value = identifier.trim();
    if (!value) return Alert.alert('Required', 'Enter your mobile number or email');

    try {
      setLoading(true);
      await sendChangeMpinOtp(value);
      navigation.navigate('ForgotMpinVerify', { identifier: value });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not send OTP');
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

          <Text style={styles.title}>
            Forgot your{'\n'}
            <Text style={styles.titleRed}>MPIN?</Text>
          </Text>
          <Text style={styles.subtitle}>
            Enter your registered mobile number or email and we'll send you an OTP to reset it.
          </Text>

          <Text style={styles.label}>Mobile Number or Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number or email"
            placeholderTextColor="#999"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.nextBtn} onPress={handleContinue} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextText}>Continue →</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 30 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: {
    fontSize: 26,
    fontFamily: 'Outfit-Regular',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#333', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
  },
  spacer: { flex: 1, minHeight: 30 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});
