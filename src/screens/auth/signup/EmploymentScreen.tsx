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
import ProgressBar from '../../../components/ProgressBar';
import SearchableDropdown from '../../../components/SearchableDropdown';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';
import { useScrollToError } from '../../../hooks/useScrollToError';
import { useTranslation } from 'react-i18next';
import SplitTitle from '../../../components/SplitTitle';

const EMPLOYED_TYPES = [
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Government', value: 'GOVERNMENT' },
  { label: 'Semi Government', value: 'SEMI_GOVERNMENT' },
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Agriculture', value: 'AGRICULTURE' },
];

const INCOME_SLABS = [
  { label: 'Below ₹3 Lakh', value: 'BELOW_3L' },
  { label: '₹3 - 5 Lakh', value: '3L_5L' },
  { label: '₹5 - 10 Lakh', value: '5L_10L' },
  { label: '₹10 - 20 Lakh', value: '10L_20L' },
  { label: '₹20 - 50 Lakh', value: '20L_50L' },
  { label: 'Above ₹50 Lakh', value: 'ABOVE_50L' },
  { label: 'Write your own', value: '__other__' },
];

const BUSINESS_TYPES = [
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Trading', value: 'Trading' },
  { label: 'Services', value: 'Services' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Other', value: 'Other' },
];

// Mirrors the web app's professionOptions (onboarding/onboardingOptions.js)
// so the designation list matches across platforms.
const DESIGNATIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Team Lead',
  'Project Manager',
  'Doctor',
  'Teacher',
  'Professor',
  'Lawyer',
  'Business Owner',
  'Government Officer',
  'Associate',
  'Manager',
  'Mid-Senior',
  'Senior',
  'Director',
  'VP',
  'Executive',
  'Senior Executive',
  'Others',
].map((item) => ({ label: item, value: item }));

const EXPERIENCE_PRESETS = [
  { label: 'Less than 1 year', value: '0-1', years: 0, months: 6 },
  { label: '1 - 2 years', value: '1-2', years: 1, months: 6 },
  { label: '2 - 5 years', value: '2-5', years: 3, months: 6 },
  { label: '5 - 10 years', value: '5-10', years: 7, months: 6 },
  { label: '10 - 15 years', value: '10-15', years: 12, months: 6 },
  { label: '15 - 20 years', value: '15-20', years: 17, months: 6 },
  { label: 'More than 20 years', value: '20+', years: 22, months: 0 },
  { label: 'Other (enter exact)', value: '__other__' },
];

export default function EmploymentScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { data, setField } = useSignup();
  const emp = data.employment || {};

  const [employedType, setEmployedType] = useState(emp.employedType || '');
  const [designation, setDesignation] = useState(emp.designation || '');
  const [companyName, setCompanyName] = useState(emp.companyName || '');
  const [typeOfBusiness, setTypeOfBusiness] = useState(emp.typeOfBusiness || '');
  const [companyLocation, setCompanyLocation] = useState(emp.companyLocation || '');
  const [linkedIn, setLinkedIn] = useState(emp.linkedInProfile || '');

  const [annualIncome, setAnnualIncome] = useState(emp.annualIncome || '');
  const [isCustomIncome, setIsCustomIncome] = useState(
    emp.annualIncome ? !INCOME_SLABS.some((s) => s.value === emp.annualIncome) : false,
  );

  const [expPreset, setExpPreset] = useState('');
  const [expYears, setExpYears] = useState(
    emp.totalExperienceYears ? String(emp.totalExperienceYears) : '',
  );
  const [expMonths, setExpMonths] = useState(
    emp.totalExperienceMonths ? String(emp.totalExperienceMonths) : '',
  );
  const [isCustomExperience, setIsCustomExperience] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});
  const { scrollRef, registerField, scrollToError } = useScrollToError();

  const isJobType = employedType === 'PRIVATE' || employedType === 'GOVERNMENT' || employedType === 'SEMI_GOVERNMENT';
  const isBusiness = employedType === 'BUSINESS';
  const isAgriculture = employedType === 'AGRICULTURE';
  const showDesignation = isJobType || isBusiness;
  const showExperience = isJobType || isBusiness;
  const showLinkedIn = !isAgriculture;

  const FIELD_ORDER = [
    'employedType',
    'designation',
    'companyName',
    'companyLocation',
    'annualIncome',
    'experience',
  ];

  const submit = async (_skip = false) => {
    // Everything shown for the chosen employment type is mandatory, so Skip
    // has to pass the same checks.
    const newErrors: { [k: string]: boolean } = {};
    if (!employedType) newErrors.employedType = true;

    if (showDesignation && !designation) newErrors.designation = true;

    if ((isJobType || isBusiness) && !companyName.trim()) {
      newErrors.companyName = true;
    }

    if ((isJobType || isBusiness) && !companyLocation.trim()) {
      newErrors.companyLocation = true;
    }

    if (!String(annualIncome).trim()) newErrors.annualIncome = true;

    if (showExperience) {
      const hasPreset = Boolean(expPreset);
      const hasExact = String(expYears).trim() !== '' || String(expMonths).trim() !== '';
      if (!hasPreset && !hasExact) newErrors.experience = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollToError(Object.keys(newErrors), FIELD_ORDER);
      return Alert.alert('Required', 'Please fill all mandatory fields');
    }

    if (linkedIn.trim() && !/linkedin\.com/i.test(linkedIn.trim())) {
      setErrors({ linkedIn: true });
      return Alert.alert('Invalid', 'Please enter a valid LinkedIn URL');
    }

    const employment: any = { employedType };
    if (annualIncome) employment.annualIncome = annualIncome;
    if (showDesignation && designation.trim()) employment.designation = designation.trim();
    if (companyName.trim()) employment.companyName = companyName.trim();
    if (isBusiness && typeOfBusiness) employment.typeOfBusiness = typeOfBusiness;
    if (companyLocation.trim()) employment.companyLocation = companyLocation.trim();
    if (showLinkedIn && linkedIn.trim()) employment.linkedInProfile = linkedIn.trim();
    if (showExperience && expYears) employment.totalExperienceYears = Number(expYears);
    if (showExperience && expMonths) employment.totalExperienceMonths = Number(expMonths);

    try {
      setLoading(true);
      if (JSON.stringify(data.employment || {}) === JSON.stringify(employment)) {
        return navigation.navigate('AboutYou');
      }
      await apiClient.patch('/onboarding/profile', { employment });
      setField('employment', employment);
      navigation.navigate('AboutYou');
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

          <ProgressBar step={10} total={16} />

          <SplitTitle
            style={styles.title}
            highlightStyle={styles.titleRed}
            newLine
            pre={t('signup.employment.titlePre')}
            highlight={t('signup.employment.titleHighlight')}
            post={t('signup.employment.titlePost')}
          />

          <Text style={styles.label}>{t('signup.employment.employmentType')} <Text style={styles.star}>*</Text></Text>
          <View ref={registerField('employedType')}>
            <SearchableDropdown
              placeholder={t('signup.employment.employmentTypePlaceholder')}
              value={employedType}
              options={EMPLOYED_TYPES}
              onSelect={(val) => {
                setEmployedType(val);
                setErrors((e) => ({ ...e, employedType: false }));
              }}
              error={errors.employedType}
            />
          </View>

          {showDesignation && (
            <>
              <Text style={styles.label}>{t('signup.employment.youWorkAs')} <Text style={styles.star}>*</Text></Text>
              <View ref={registerField('designation')}>
                <SearchableDropdown
                  placeholder={t('signup.employment.designationPlaceholder')}
                  value={designation}
                  options={DESIGNATIONS}
                  onSelect={(val) => {
                    setDesignation(val);
                    setErrors((e) => ({ ...e, designation: false }));
                  }}
                  error={errors.designation}
                />
              </View>
            </>
          )}

          {isBusiness ? (
            <>
              <Text style={styles.label}>{t('signup.employment.firmName')} <Text style={styles.star}>*</Text></Text>
              <TextInput
                ref={registerField('companyName') as any}
                style={[styles.input, errors.companyName && styles.inputError]}
                placeholder={t('signup.employment.firmNamePlaceholder')}
                placeholderTextColor="#999"
                value={companyName}
                onChangeText={(value) => {
                  setCompanyName(value);
                  setErrors((e) => ({ ...e, companyName: false }));
                }}
              />

              <Text style={styles.label}>{t('signup.employment.typeOfBusiness')}</Text>
              <SearchableDropdown
                placeholder={t('signup.employment.businessPlaceholder')}
                value={typeOfBusiness}
                options={BUSINESS_TYPES}
                onSelect={setTypeOfBusiness}
              />

              <Text style={styles.label}>{t('signup.employment.firmLocation')} <Text style={styles.star}>*</Text></Text>
              <TextInput
                ref={registerField('companyLocation') as any}
                style={[styles.input, errors.companyLocation && styles.inputError]}
                placeholder={t('signup.employment.firmLocationPlaceholder')}
                placeholderTextColor="#999"
                value={companyLocation}
                onChangeText={(value) => {
                  setCompanyLocation(value);
                  setErrors((e) => ({ ...e, companyLocation: false }));
                }}
              />
            </>
          ) : isJobType ? (
            <>
              <Text style={styles.label}>{t('signup.employment.youWorkWith')} <Text style={styles.star}>*</Text></Text>
              <TextInput
                ref={registerField('companyName') as any}
                style={[styles.input, errors.companyName && styles.inputError]}
                placeholder={t('signup.employment.companyPlaceholder')}
                placeholderTextColor="#999"
                value={companyName}
                onChangeText={(value) => {
                  setCompanyName(value);
                  setErrors((e) => ({ ...e, companyName: false }));
                }}
              />

              <Text style={styles.label}>{t('signup.employment.companyLocation')} <Text style={styles.star}>*</Text></Text>
              <TextInput
                ref={registerField('companyLocation') as any}
                style={[styles.input, errors.companyLocation && styles.inputError]}
                placeholder={t('signup.employment.companyLocationPlaceholder')}
                placeholderTextColor="#999"
                value={companyLocation}
                onChangeText={(value) => {
                  setCompanyLocation(value);
                  setErrors((e) => ({ ...e, companyLocation: false }));
                }}
              />
            </>
          ) : null}

          <Text style={styles.label}>{t('signup.employment.annualIncome')} <Text style={styles.star}>*</Text></Text>
          {isCustomIncome ? (
            <>
              <TextInput
                ref={registerField('annualIncome') as any}
                style={[styles.input, errors.annualIncome && styles.inputError]}
                placeholder={t('signup.employment.incomePlaceholder')}
                placeholderTextColor="#999"
                value={annualIncome}
                onChangeText={(value) => {
                  setAnnualIncome(value);
                  setErrors((e) => ({ ...e, annualIncome: false }));
                }}
                keyboardType="number-pad"
              />
              <TouchableOpacity onPress={() => { setIsCustomIncome(false); setAnnualIncome(''); }}>
                <Text style={styles.linkText}>{t('signup.common.chooseFromListInstead')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View ref={registerField('annualIncome')}>
            <SearchableDropdown
              placeholder={t('signup.employment.incomeSlabPlaceholder')}
              value={annualIncome}
              options={INCOME_SLABS}
              onSelect={(val) => {
                if (val === '__other__') {
                  setIsCustomIncome(true);
                  setAnnualIncome('');
                  return;
                }
                setAnnualIncome(val);
                setErrors((e) => ({ ...e, annualIncome: false }));
              }}
              error={errors.annualIncome}
            />
            </View>
          )}

          {showExperience && (
            <>
              <Text style={styles.label}>{t('signup.employment.totalExperience')} <Text style={styles.star}>*</Text></Text>
              {isCustomExperience ? (
                <>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.flexInput]}
                      placeholder={t('signup.employment.yearsPlaceholder')}
                      placeholderTextColor="#999"
                      value={expYears}
                      onChangeText={(t) => {
                        const raw = t.replace(/\D/g, '');
                        setExpYears(raw && Number(raw) > 50 ? '50' : raw);
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <TextInput
                      style={[styles.input, styles.flexInput]}
                      placeholder={t('signup.employment.monthsPlaceholder')}
                      placeholderTextColor="#999"
                      value={expMonths}
                      onChangeText={(t) => {
                        const raw = t.replace(/\D/g, '');
                        setExpMonths(raw && Number(raw) > 11 ? '11' : raw);
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setIsCustomExperience(false);
                      setExpPreset('');
                      setExpYears('');
                      setExpMonths('');
                    }}
                  >
                    <Text style={styles.linkText}>{t('signup.common.chooseFromListInstead')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <SearchableDropdown
                  placeholder={t('signup.employment.experiencePlaceholder')}
                  value={expPreset}
                  options={EXPERIENCE_PRESETS}
                  onSelect={(val) => {
                    if (val === '__other__') {
                      setIsCustomExperience(true);
                      setExpPreset('');
                      setExpYears('');
                      setExpMonths('');
                      return;
                    }
                    const preset = EXPERIENCE_PRESETS.find((p) => p.value === val);
                    if (preset) {
                      setExpPreset(val);
                      setExpYears(String(preset.years));
                      setExpMonths(String(preset.months));
                    }
                  }}
                />
              )}
            </>
          )}

          {showLinkedIn && (
            <>
              <Text style={styles.label}>{t('signup.employment.linkedin')}</Text>
              <TextInput
                style={[styles.input, errors.linkedIn && styles.inputError]}
                placeholder="https://linkedin.com/in/your-name"
                placeholderTextColor="#999"
                value={linkedIn}
                onChangeText={(t) => {
                  setLinkedIn(t);
                  setErrors((e) => ({ ...e, linkedIn: false }));
                }}
                autoCapitalize="none"
              />
            </>
          )}

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
  title: { fontSize: 26, fontFamily: 'Outfit-Regular', color: '#000', textAlign: 'center', marginBottom: 30 },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 10 },
  star: { color: '#D20236' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
    color: '#000',
  },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  row: { flexDirection: 'row', gap: 10 },
  flexInput: { flex: 1 },
  linkText: { color: '#D20236', fontSize: 13, fontFamily: 'Outfit-SemiBold', marginTop: -12, marginBottom: 16 },
  spacer: { flex: 1, minHeight: 30 },
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