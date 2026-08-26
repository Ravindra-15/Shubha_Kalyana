import React, { useState } from 'react';
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
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import ProgressBar from '../../../components/ProgressBar';
import { useSignup } from '../../../context/SignupContext';
import { useScrollToError } from '../../../hooks/useScrollToError';

const PROFILE_OPTIONS = [
  { label: 'Myself', value: 'Myself' },
  { label: 'My Son', value: 'My Son' },
  { label: 'Daughter', value: 'My Daughter' },
  { label: 'Sister', value: 'My Sister' },
  { label: 'Friend', value: 'My Friend' },
  { label: 'Brother', value: 'My Brother' },
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

const getLookingForFromGender = (selectedGender: string) => {
  if (selectedGender === 'MALE') return 'Groom';
  if (selectedGender === 'FEMALE') return 'Bride';
  return '';
};

const getDefaultGenderForRelation = (relation: string) => {
  const maleRelations = ['My Son', 'My Brother', 'My Nephew', 'My Grandfather', 'My Uncle'];
  const femaleRelations = ['My Daughter', 'My Sister', 'My Niece', 'My Grandmother', 'My Aunt'];

  if (maleRelations.includes(relation)) return 'MALE';
  if (femaleRelations.includes(relation)) return 'FEMALE';
  return '';
};

const OTHER_RELATIONS = [
  'My Relative',
  'My Uncle',
  'My Aunt',
  'My Niece',
  'My Nephew',
  'My Cousin',
  'My Grandfather',
  'My Grandmother',
  'My Guardian',
];

export default function SignupProfileForScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [profileFor, setProfileFor] = useState(data.profileFor || '');
  const [gender, setGender] = useState(data.gender || '');
  const [showOther, setShowOther] = useState(false);
  const [otherRelation, setOtherRelation] = useState('');
  const [errors, setErrors] = useState<{ profileFor?: boolean; gender?: boolean }>({});
  const { scrollRef, registerField, scrollToError } = useScrollToError();

  const handleContinue = () => {
    const finalProfileFor = showOther ? otherRelation.trim() : profileFor;
    const newErrors: typeof errors = {};
    if (!finalProfileFor) newErrors.profileFor = true;
    if (!gender) newErrors.gender = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      scrollToError(Object.keys(newErrors), ['profileFor', 'gender']);
      return Alert.alert('Required', newErrors.profileFor ? 'Please select who this profile is for' : 'Please select gender');
    }
    setField('profileFor', showOther ? 'My Relative' : finalProfileFor);
    setField('gender', gender);
    setField('lookingFor', getLookingForFromGender(gender));
    navigation.navigate('SignupAbout');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper ref={scrollRef}>
        <View style={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <ProgressBar step={1} total={17} />

        <View style={styles.iconCircle}>
          <Image
            source={require('../../../assets/images/user-icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          This <Text style={styles.titleRed}>Profile</Text> is for
        </Text>

        <View ref={registerField('profileFor')} style={[styles.grid, errors.profileFor && styles.errorBorder]}>
          {PROFILE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.pill,
                profileFor === opt.value && styles.pillActive,
              ]}
              onPress={() => {
                if (profileFor === opt.value) {
                  setProfileFor('');
                  return;
                }
                setProfileFor(opt.value);
                setOtherRelation('');
                setShowOther(false);
                const defaultGender = getDefaultGenderForRelation(opt.value);
                if (defaultGender) setGender(defaultGender);
              }}
            >
              <View
                style={[
                  styles.radio,
                  profileFor === opt.value && styles.radioActive,
                ]}
              />
              <Text
                style={[
                  styles.pillText,
                  profileFor === opt.value && styles.pillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[
            styles.pill,
            styles.otherPill,
            (showOther || Boolean(otherRelation)) && styles.pillActive,
          ]}
          onPress={() => setShowOther(!showOther)}
        >
          <View style={[styles.radio, Boolean(otherRelation) && styles.radioActive]} />
          <Text style={[styles.pillText, Boolean(otherRelation) && styles.pillTextActive]}>
            {otherRelation || 'Add other Relation'}
          </Text>
        </TouchableOpacity>

        {showOther && (
          <>
            <View style={styles.pickerWrap}>
              {OTHER_RELATIONS.map(rel => (
                <TouchableOpacity
                  key={rel}
                  style={styles.relOption}
                  onPress={() => {
                    setOtherRelation(rel);
                    setProfileFor('');
                    setShowOther(false);
                    const defaultGender = getDefaultGenderForRelation(rel);
                    if (defaultGender) setGender(defaultGender);
                  }}
                >
                  <Text
                    style={[
                      styles.relText,
                      otherRelation === rel && styles.relTextActive,
                    ]}
                  >
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Or type relation"
              placeholderTextColor="#999"
              value={otherRelation}
              onChangeText={setOtherRelation}
            />
          </>
        )}

        <Text style={styles.genderTitle}>Gender</Text>
        <View ref={registerField('gender')} style={[styles.genderRow, errors.gender && styles.errorBorder]}>
          {GENDER_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.pill,
                styles.genderPill,
                gender === opt.value && styles.pillActive,
              ]}
              onPress={() => setGender(opt.value)}
            >
              <View
                style={[
                  styles.radio,
                  gender === opt.value && styles.radioActive,
                ]}
              />
              <Text
                style={[
                  styles.pillText,
                  gender === opt.value && styles.pillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue →</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Shubhakalyana is built for genuine match makers. Any falsification or
          commercial use or marriage bureaus are strictly prohibited & may
          reported to law enforcement
        </Text>
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
    fontFamily: 'Outfit-Regular',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
  },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  pillActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  errorBorder: { borderWidth: 1.5, borderColor: '#D20236', borderRadius: 12, padding: 6 },
  genderPill: { width: '48%', justifyContent: 'flex-start' },
  pillText: { fontSize: 15, color: '#333', marginLeft: 10 },
  pillTextActive: { color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#eee',
  },
  radioActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  genderTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#D20236',
    textAlign: 'center',
    marginVertical: 16,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lookingForBox: {
    borderWidth: 1,
    borderColor: '#f0d0d8',
    borderRadius: 14,
    backgroundColor: '#fdf2f5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  lookingForLabel: { fontSize: 12, color: '#777', fontFamily: 'Outfit-Bold', marginBottom: 4 },
  lookingForValue: { fontSize: 16, color: '#D20236', fontFamily: 'Outfit-Bold' },
  lookingForPlaceholder: { color: '#999' },
  continueBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },

  otherPill: { width: '100%', justifyContent: 'center' },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
  },
  relOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  relText: { fontSize: 15, color: '#333' },
  relTextActive: { color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
    color: '#000',
  },
});
