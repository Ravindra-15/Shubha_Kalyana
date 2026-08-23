import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import { useSignup } from '../../../context/SignupContext';

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTH_OPTIONS = [
  { label: 'Jan', value: '01' },
  { label: 'Feb', value: '02' },
  { label: 'Mar', value: '03' },
  { label: 'Apr', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'Aug', value: '08' },
  { label: 'Sept', value: '09' },
  { label: 'Oct', value: '10' },
  { label: 'Nov', value: '11' },
  { label: 'Dec', value: '12' },
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => String(CURRENT_YEAR - i));

const getCurrentAge = (dobString: string) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  if (Number.isNaN(dob.getTime()) || dob > today) return null;

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
};

type DobPickerType = 'day' | 'month' | 'year' | null;

export default function SignupAboutScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});
  const [activePicker, setActivePicker] = useState<DobPickerType>(null);

  // dynamic label: male profile = Groom, female = Bride
  const personLabel = data.gender === 'MALE' ? 'Groom' : 'Bride';

  const liveDob = day && month && year ? `${year}-${month}-${day}` : '';
  const currentAge = getCurrentAge(liveDob);

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
      <KeyboardWrapper>
        <View style={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Image
            source={require('../../../assets/images/user-icon.png')}
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
          <TouchableOpacity
            style={[styles.dobPicker, errors.day && styles.inputError]}
            onPress={() => setActivePicker('day')}
          >
            <Text style={day ? styles.dobPickerText : styles.dobPickerPlaceholder}>
              {day || 'Day'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dobPicker, errors.month && styles.inputError]}
            onPress={() => setActivePicker('month')}
          >
            <Text style={month ? styles.dobPickerText : styles.dobPickerPlaceholder}>
              {month ? MONTH_OPTIONS.find(m => m.value === month)?.label : 'Month'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dobPicker, errors.year && styles.inputError]}
            onPress={() => setActivePicker('year')}
          >
            <Text style={year ? styles.dobPickerText : styles.dobPickerPlaceholder}>
              {year || 'Year'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Current Age</Text>
        <View style={styles.ageBox}>
          <Text style={styles.ageText}>
            {currentAge
              ? `${currentAge.years} years, ${currentAge.months} months, ${currentAge.days} days`
              : '-'}
          </Text>
        </View>

        <Modal
          visible={activePicker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActivePicker(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          >
            <View style={styles.modalContent}>
              <FlatList
                data={
                  activePicker === 'day'
                    ? DAY_OPTIONS
                    : activePicker === 'month'
                    ? MONTH_OPTIONS.map(m => m.value)
                    : YEAR_OPTIONS
                }
                keyExtractor={item => item}
                renderItem={({ item }) => {
                  const label =
                    activePicker === 'month'
                      ? MONTH_OPTIONS.find(m => m.value === item)?.label
                      : item;
                  return (
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => {
                        if (activePicker === 'day') {
                          setDay(item);
                          setErrors(e => ({ ...e, day: false }));
                        } else if (activePicker === 'month') {
                          setMonth(item);
                          setErrors(e => ({ ...e, month: false }));
                        } else if (activePicker === 'year') {
                          setYear(item);
                          setErrors(e => ({ ...e, year: false }));
                        }
                        setActivePicker(null);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{label}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue →</Text>
        </TouchableOpacity>
        </View>
      </KeyboardWrapper>
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
    backgroundColor: '#fbfbfb',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { width: 34, height: 34 },
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
  dobRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dobPicker: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  dobPickerText: { fontSize: 15, color: '#000' },
  dobPickerPlaceholder: { fontSize: 15, color: '#999' },
  ageBox: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  ageText: { fontSize: 15, color: '#333', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 350,
    paddingVertical: 8,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: { fontSize: 16, color: '#333', textAlign: 'center' },
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
