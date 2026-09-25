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
import SearchableDropdown from '../../../components/SearchableDropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';
import { useScrollToError } from '../../../hooks/useScrollToError';
import { useTranslation } from 'react-i18next';
import SplitTitle from '../../../components/SplitTitle';
const QUALIFICATIONS = [
  'B.Tech', 'B.E', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'B.Pharm', 'LLB', 'MBBS',
  'M.Tech', 'M.E', 'M.Sc', 'M.Com', 'M.A', 'MBA', 'MCA', 'M.Pharm', 'LLM',
  'PhD', 'Diploma', 'ITI', '12th', '10th', 'Other',
];

export default function QualificationScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { data, setField } = useSignup();
  const [qualification, setQualification] = useState(data.education?.highestQualification || '');
  const [college, setCollege] = useState(data.education?.college || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ qualification?: boolean; college?: boolean }>({});
  const { scrollRef, registerField, scrollToError } = useScrollToError();

  const submit = async (_skip = false) => {
    const newErrors: { qualification?: boolean; college?: boolean } = {};
    if (!qualification.trim()) newErrors.qualification = true;
    if (!college.trim()) newErrors.college = true;
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollToError(Object.keys(newErrors), ['qualification', 'college']);
      return Alert.alert('Required', 'Please fill all mandatory fields');
    }

    try {
      setLoading(true);
      const education = {
        highestQualification: qualification.trim(),
        college: college.trim(),
      };
      // skip API if unchanged (prevents backend step rewind on back-navigation)
      const prev = data.education || {};
      if (prev.highestQualification === education.highestQualification && prev.college === education.college) {
        return navigation.navigate('FamilyDetails');
      }
      await apiClient.patch('/onboarding/profile', { education });
      setField('education', education);
      navigation.navigate('FamilyDetails');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper ref={scrollRef}>
        <View style={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <ProgressBar step={6} total={16} />

        <SplitTitle
          style={styles.title}
          highlightStyle={styles.titleRed}
          newLine
          pre={t('signup.qualification.titlePre')}
          highlight={t('signup.qualification.titleHighlight')}
          post={t('signup.qualification.titlePost')}
        />

        <Text style={styles.label}>{t('signup.qualification.highestQualification')} <Text style={styles.star}>*</Text></Text>
        <View ref={registerField('qualification')}>
          <SearchableDropdown
            placeholder={t('signup.qualification.qualificationPlaceholder')}
            value={qualification}
            options={QUALIFICATIONS.map((q) => ({ label: q, value: q }))}
            onSelect={(val) => { setQualification(val); setErrors({}); }}
            allowCustom
            error={errors.qualification}
          />
        </View>

        <Text style={styles.label}>{t('signup.qualification.college')} <Text style={styles.star}>*</Text></Text>
        <View ref={registerField('college')}>
          <TextInput
            style={[styles.input, errors.college && styles.inputError]}
            placeholder={t('signup.qualification.collegePlaceholder')}
            placeholderTextColor="#999"
            value={college}
            onChangeText={(value) => {
              setCollege(value);
              setErrors((current) => ({ ...current, college: false }));
            }}
          />
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextBtn} onPress={() => submit(false)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{t('signup.common.next')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => submit(true)}>
          <Text style={styles.skipText}>{t('signup.common.skip')}</Text>
        </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 26, fontFamily: 'Outfit-Regular', color: '#000', textAlign: 'center', marginBottom: 36 },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 10 },
  star: { color: '#D20236' },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 24,
    color: '#000',
  },
  spacer: { flex: 1, minHeight: 40 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: { color: '#000', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
});