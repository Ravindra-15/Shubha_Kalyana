import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignup } from '../../../context/SignupContext';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function SignupContactScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [mobile, setMobile] = useState(data.mobile || '');
  const [email, setEmail] = useState(data.email || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ mobile?: boolean; email?: boolean }>({});

 const handleContinue = async () => {
    const newErrors: { mobile?: boolean; email?: boolean } = {};

    if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) newErrors.mobile = true;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return Alert.alert('Invalid', 'Please enter a valid mobile number and email');
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      mobile: mobile.trim(),
      email: email.trim(),
      profileFor: data.profileFor,
      gender: data.gender,
      dob: data.dob,
      religion: data.religion,
      caste: data.caste,
      subCaste: data.subCaste,
      motherTongue: data.motherTongue || 'Kannada',
      lookingFor: data.gender === 'MALE' ? 'FEMALE' : 'MALE',
    };

    try {
      setLoading(true);
      const res = await apiClient.post('/onboarding/register', payload);
      const onboardingToken = res.data?.data?.onboardingToken;

      if (onboardingToken) {
        await AsyncStorage.setItem('onboardingToken', onboardingToken);
        setField('mobile', mobile.trim());
        setField('email', email.trim());
        navigation.navigate('Qualification');
      } else {
        Alert.alert('Error', 'No onboarding token received');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed';
      Alert.alert('Error', msg);
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

        <View style={styles.iconCircle}>
          <Image
            source={require('../../../assets/images/logo-red.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          <Text style={styles.titleRed}>Contact</Text> Details
        </Text>

        <Text style={styles.label}>Mobile number <Text style={styles.star}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.mobile && styles.inputError]}
          placeholder="Enter your mobile number"
          placeholderTextColor="#999"
          value={mobile}
          onChangeText={(t) => { setMobile(t); setErrors((e) => ({ ...e, mobile: false })); }}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Email ID</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Enter your email address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: false })); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueText}>Continue  →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 24, paddingBottom: 30 },
  back: { fontSize: 24, color: '#000', marginTop: 8, marginBottom: 10 },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: '#f0d0d8',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { width: 44, height: 44 },
  title: { fontSize: 24, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 30 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
  star: { color: '#D20236' },
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
  continueBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
});