import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

        <View style={styles.content}>
          <Text style={styles.title}>
            We are reviewing your{'\n'}profile <Text style={styles.titleRed}>, stay tuned !</Text>
          </Text>

          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📋</Text>
          </View>

          <Text style={styles.note}>
            Your profile has been submitted for verification. Our team will review it shortly.
            You'll be able to log in once it's approved.
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
  title: { fontSize: 22, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 40 },
  titleRed: { color: '#D20236' },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fdf2f5',
    alignItems: 'center',
    justifyContent: 'center',
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
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});