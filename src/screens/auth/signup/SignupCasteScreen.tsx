import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import ProgressBar from '../../../components/ProgressBar';
import { useSignup } from '../../../context/SignupContext';
import { getCastes, Caste } from '../../../api/caste';
import SearchableDropdown from '../../../components/SearchableDropdown';
import { useScrollToError } from '../../../hooks/useScrollToError';

const MOTHER_TONGUES = [
  'Kannada',
  'Hindi',
  'English',
  'Telugu',
  'Tamil',
  'Malayalam',
  'Marathi',
  'Konkani',
  'Tulu',
  'Kodava',
  'Urdu',
  'Gujarati',
  'Bengali',
  'Punjabi',
  'Other',
];

const RELIGIONS = [
  'Hindu',
  'Muslim',
  'Christian',
  'Sikh',
  'Jain',
  'Buddhist',
  'Parsi',
  'Other',
];

export default function SignupCasteScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [religion, setReligion] = useState(data.religion || '');
  const [casteId, setCasteId] = useState(data.caste || '');
  const [subCaste, setSubCaste] = useState(data.subCaste || '');
  const [motherTongue, setMotherTongue] = useState(data.motherTongue || '');
  const [livingIn, setLivingIn] = useState(data.livingIn || '');

  const [castes, setCastes] = useState<Caste[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});
  const { scrollRef, registerField, scrollToError } = useScrollToError();
  const FIELD_ORDER = ['religion', 'casteId', 'subCaste', 'livingIn', 'motherTongue'];

  useEffect(() => {
    (async () => {
      try {
        const list = await getCastes();
        setCastes(list);
      } catch {
        Alert.alert('Error', 'Could not load castes');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

const visibleCastes = religion
    ? castes.filter(c => c.religion === religion)
    : castes;
  const selectedCaste = castes.find(c => c._id === casteId);
  const subCasteOptions = selectedCaste?.subCastes || [];

  const handleContinue = () => {
    const newErrors: { [k: string]: boolean } = {};
    if (!religion.trim()) newErrors.religion = true;
    if (!casteId) newErrors.casteId = true;
    if (!subCaste) newErrors.subCaste = true;
    if (!livingIn.trim()) newErrors.livingIn = true;
    if (!motherTongue.trim()) newErrors.motherTongue = true;
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollToError(Object.keys(newErrors), FIELD_ORDER);
      return Alert.alert('Required', 'Please fill all mandatory fields');
    }

    setField('religion', religion.trim());
    setField('caste', casteId);
    setField('subCaste', subCaste);
    setField('livingIn', livingIn.trim());
    setField('motherTongue', motherTongue.trim());
    navigation.navigate('SignupContact');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper ref={scrollRef}>
        <View style={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <ProgressBar step={3} total={16} />

        <View style={styles.iconCircle}>
          <Image
            source={require('../../../assets/images/user-icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          Select <Text style={styles.titleRed}>Caste</Text>
        </Text>

        <Text style={styles.label}>
          Religion <Text style={styles.star}>*</Text>
        </Text>
        <View ref={registerField('religion')}>
          <SearchableDropdown
            placeholder="Select Religion"
            value={religion}
            options={RELIGIONS.map(r => ({ label: r, value: r }))}
            onSelect={val => {
              setReligion(val);
              setCasteId('');
              setSubCaste('');
              setErrors(e => ({ ...e, religion: false }));
            }}
            allowCustom
            error={errors.religion}
          />
        </View>

        <Text style={styles.label}>
          Select Caste <Text style={styles.star}>*</Text>
        </Text>
        {loading ? (
          <ActivityIndicator color="#D20236" style={{ marginVertical: 16 }} />
        ) : (
          <View ref={registerField('casteId')}>
            <SearchableDropdown
              placeholder="Caste"
              value={casteId}
              options={visibleCastes.map(c => ({ label: c.casteName, value: c._id }))}
              onSelect={val => {
                setCasteId(val);
                setSubCaste('');
                setErrors(e => ({ ...e, casteId: false }));
              }}
              error={errors.casteId}
            />
          </View>
        )}
        <View ref={registerField('subCaste')}>
          <SearchableDropdown
            placeholder="Sub- Caste"
            value={subCaste}
            options={subCasteOptions.map(sc => ({ label: sc, value: sc }))}
            onSelect={val => {
              setSubCaste(val);
              setErrors(e => ({ ...e, subCaste: false }));
            }}
            allowCustom
            disabled={subCasteOptions.length === 0}
            error={errors.subCaste}
          />
        </View>

        <Text style={styles.label}>
          Living In <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          ref={registerField('livingIn') as any}
          style={[styles.input, errors.livingIn && styles.inputError]}
          placeholder="Enter city / place"
          placeholderTextColor="#999"
          value={livingIn}
          onChangeText={t => {
            setLivingIn(t);
            setErrors(e => ({ ...e, livingIn: false }));
          }}
        />

        <Text style={styles.label}>
          Mother Tongue <Text style={styles.star}>*</Text>
        </Text>
        <View ref={registerField('motherTongue')}>
          <SearchableDropdown
            placeholder="Select Mother Tongue"
            value={motherTongue}
            options={MOTHER_TONGUES.map(tongue => ({ label: tongue, value: tongue }))}
            onSelect={val => {
              setMotherTongue(val);
              setErrors(e => ({ ...e, motherTongue: false }));
            }}
            allowCustom
            error={errors.motherTongue}
          />
        </View>

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
    fontFamily: 'Outfit-Regular',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
  },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  label: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#000',
    marginBottom: 10,
    marginTop: 6,
  },
  star: { color: '#D20236' },
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
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  continueBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});
