import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardWrapper from '../../components/KeyboardWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResumeScreen } from '../../utils/resumeOnboarding';

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState('');

  const handleLogin = () => {
    if (!mobile.trim()) return Alert.alert(t('common.error'), t('login.errorEnterMobile'));
    navigation.navigate('LoginOtp', { mobile: mobile.trim() });
  };

  const handleSignup = async () => {
    const onboardingToken = await AsyncStorage.getItem('onboardingToken');
    if (!onboardingToken) {
      // no in-progress onboarding → fresh signup
      return navigation.navigate('SignupProfileFor');
    }

    const resumeScreen = await getResumeScreen();
    if (!resumeScreen || resumeScreen === 'ReviewProfile') {
      // completed or nothing to resume → start fresh
      await AsyncStorage.removeItem('onboardingToken');
      return navigation.navigate('SignupProfileFor');
    }

    // mid-way → ask
    Alert.alert(
      t('login.continueSignupTitle'),
      t('login.continueSignupMessage'),
      [
        {
          text: t('login.startNew'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('onboardingToken');
            navigation.navigate('SignupProfileFor');
          },
        },
        { text: t('login.continueLabel'), onPress: () => navigation.navigate(resumeScreen as never) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper>
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/logo-red.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.label}>{t('login.mobileEmailLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('login.mobilePlaceholder')}
            placeholderTextColor="#999"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>{t('login.logIn')}</Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{t('login.noAccount')}</Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={styles.signupLink}>{t('login.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingVertical: 40, flexGrow: 1, justifyContent: 'center' },
  logo: { width: 180, height: 130, alignSelf: 'center', marginBottom: 40 },
  label: { fontSize: 16, color: '#333', marginBottom: 8, fontFamily: 'Outfit-Medium' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 18,
    fontSize: 15,
    marginBottom: 24,
    color: '#000',
  },
  loginBtn: {
    backgroundColor: '#D20236',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  loginText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { color: '#333', fontSize: 16,fontFamily: 'Outfit-Medium' },
  signupLink: { color: '#D20236', fontSize: 16, fontFamily: 'Outfit-Medium' },
});