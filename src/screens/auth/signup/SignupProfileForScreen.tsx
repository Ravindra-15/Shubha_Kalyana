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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignup } from '../../../context/SignupContext';

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
const OTHER_RELATIONS = [
  'Cousin',
  'Nephew',
  'Niece',
  'Grandson',
  'Granddaughter',
];

export default function SignupProfileForScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [profileFor, setProfileFor] = useState(data.profileFor || '');
  const [gender, setGender] = useState(data.gender || '');
  const [showOther, setShowOther] = useState(false);
  const [otherRelation, setOtherRelation] = useState('');

  const handleContinue = () => {
    const finalProfileFor = showOther ? otherRelation.trim() : profileFor;
    if (!finalProfileFor)
      return Alert.alert('Required', 'Please select who this profile is for');
    if (!gender) return Alert.alert('Required', 'Please select gender');
    setField('profileFor', showOther ? 'My Relative' : finalProfileFor);
    setField('gender', gender);
    navigation.navigate('SignupAbout');
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
          This <Text style={styles.titleRed}>Profile</Text> is for
        </Text>

        <View style={styles.grid}>
          {PROFILE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.pill,
                profileFor === opt.value && styles.pillActive,
              ]}
              onPress={() => setProfileFor(opt.value)}
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
            showOther && styles.pillActive,
          ]}
          onPress={() => setShowOther(!showOther)}
        >
          <View style={[styles.radio, showOther && styles.radioActive]} />
          <Text style={[styles.pillText, showOther && styles.pillTextActive]}>
            Add other Relation
          </Text>
        </TouchableOpacity>

        <Text style={styles.genderTitle}>Gender</Text>
        <View style={styles.genderRow}>
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

        {showOther && (
          <>
            <View style={styles.pickerWrap}>
              {OTHER_RELATIONS.map(rel => (
                <TouchableOpacity
                  key={rel}
                  style={styles.relOption}
                  onPress={() => setOtherRelation(rel)}
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

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue →</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Shubhakalyana is built for genuine match makers. Any falsification or
          commercial use or marriage bureaus are strictly prohibited & may
          reported to law enforcement
        </Text>
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
  genderPill: { width: '48%', justifyContent: 'flex-start' },
  pillText: { fontSize: 15, color: '#333', marginLeft: 10 },
  pillTextActive: { color: '#D20236', fontWeight: '600' },
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
    fontWeight: '700',
    color: '#D20236',
    textAlign: 'center',
    marginVertical: 16,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  continueBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
  relTextActive: { color: '#D20236', fontWeight: '600' },
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
