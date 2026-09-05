import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import { useSignup } from '../../../context/SignupContext';

export default function ReviewProfileScreen({ navigation }: any) {
  const { reset } = useSignup();

  const goToLogin = () => {
    reset(); // clear signup data
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={goToLogin}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <ProgressBar step={16} total={16} />

        <View style={styles.content}>
          <Text style={styles.title}>
            Your profile has been created,{' '}
            <Text style={styles.titleRed}>Congratulations!</Text>
          </Text>

          <Text style={styles.subtitle}>
            We are reviewing your profile, stay tuned.
          </Text>

          <Image
            source={require('../../../assets/images/review-profile.png')}
            style={styles.reviewImage}
            resizeMode="contain"
          />

          <Text style={styles.note}>
            Your profile has been submitted for verification. Our team will
            review it shortly. You'll be able to log in once it's approved.
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={goToLogin}>
          <Text style={styles.btnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 30 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit-Regular',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  reviewImage: {
    width: 260,
    height: 260,
    marginBottom: 30,
  },
  icon: { fontSize: 60 },
  note: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  btn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});
