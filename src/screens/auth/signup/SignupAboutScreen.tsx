import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignup } from '../../../context/SignupContext';

export default function SignupAboutScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});

  const monthRef = useRef<any>(null);
  const yearRef = useRef<any>(null);

  // dynamic label: male profile = Groom, female = Bride
  const personLabel = data.gender === 'MALE' ? 'Groom' : 'Bride';
  console.log('GENDER VALUE:', data.gender);

  const handleContinue = () => {
    const newErrors: { [k: string]: boolean } = {};
    if (!firstName.trim()) newErrors.firstName = true;
    if (!lastName.trim()) newErrors.lastName = true;
    if (!day || !month || !year) {
      if (!day) newErrors.day = true;
      if (!month) newErrors.month = true;
      if (!year) newErrors.year = true;
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return Alert.alert('Required', 'Please fill all mandatory fields');
    }

const dd = parseInt(day, 10);
    const mm = parseInt(month, 10);
    const yy = parseInt(year, 10);

    // month range
    if (mm < 1 || mm > 12) {
      setErrors({ month: true });
      return Alert.alert('Invalid', 'Month must be between 1 and 12');
    }

    // year range
    const currentYear = new Date().getFullYear();
    if (yy < 1900 || yy > currentYear) {
      setErrors({ year: true });
      return Alert.alert('Invalid', 'Please enter a valid year');
    }

    // days in that month (handles leap years)
    const daysInMonth = new Date(yy, mm, 0).getDate();
    if (dd < 1 || dd > daysInMonth) {
      setErrors({ day: true });
      return Alert.alert('Invalid', `Day must be between 1 and ${daysInMonth} for the selected month`);
    }

    const dob = `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const parsed = new Date(dob);
    const today = new Date();

    if (parsed > today) {
      setErrors({ day: true, month: true, year: true });
      return Alert.alert('Invalid', 'Date of birth cannot be in the future');
    }

    // age >= 18
    let age = today.getFullYear() - parsed.getFullYear();
    const mDiff = today.getMonth() - parsed.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < parsed.getDate())) age--;
    if (age < 18) {
      setErrors({ day: true, month: true, year: true });
      return Alert.alert('Invalid', 'You must be at least 18 years old');
    }

    setField('firstName', firstName.trim());
    setField('lastName', lastName.trim());
    setField('dob', dob);
    navigation.navigate('SignupCaste');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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
          About <Text style={styles.titleRed}>Yourself</Text>
        </Text>

        <Text style={styles.label}>
          Name of {personLabel} <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          placeholder="First Name"
          placeholderTextColor="#999"
          value={firstName}
          onChangeText={t => {
            setFirstName(t);
            setErrors(e => ({ ...e, firstName: false }));
          }}
        />
        <TextInput
          style={[styles.input, errors.lastName && styles.inputError]}
          placeholder="Last Name"
          placeholderTextColor="#999"
          value={lastName}
          onChangeText={t => {
            setLastName(t);
            setErrors(e => ({ ...e, lastName: false }));
          }}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <View style={styles.dobRow}>
          <TextInput
            style={[
              styles.input,
              styles.dobInput,
              errors.day && styles.inputError,
            ]}
            placeholder="Day"
            placeholderTextColor="#999"
            value={day}
            onChangeText={t => {
              setDay(t);
              setErrors(e => ({ ...e, day: false }));
              if (t.length === 2) monthRef.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TextInput
            ref={monthRef}
            style={[
              styles.input,
              styles.dobInput,
              errors.month && styles.inputError,
            ]}
            placeholder="Month"
            placeholderTextColor="#999"
            value={month}
            onChangeText={t => {
              setMonth(t);
              setErrors(e => ({ ...e, month: false }));
              if (t.length === 2) yearRef.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TextInput
            ref={yearRef}
            style={[
              styles.input,
              styles.dobInput,
              errors.year && styles.inputError,
            ]}
            placeholder="Year"
            placeholderTextColor="#999"
            value={year}
            onChangeText={t => {
              setYear(t);
              setErrors(e => ({ ...e, year: false }));
            }}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue →</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
  },
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
  dobRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dobInput: { width: '31%' },
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
