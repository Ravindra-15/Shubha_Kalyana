import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import { useSignup } from '../../../context/SignupContext';
import { getCastes, Caste } from '../../../api/caste';
import SearchableDropdown from '../../../components/SearchableDropdown';

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
  const [religion, setReligion] = useState(data.religion || 'Hindu');
  const [casteId, setCasteId] = useState(data.caste || '');
  const [subCaste, setSubCaste] = useState(data.subCaste || '');
  const [motherTongue, setMotherTongue] = useState(data.motherTongue || '');

  const [castes, setCastes] = useState<Caste[]>([]);
  const [loading, setLoading] = useState(true);

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

  const selectedCaste = castes.find(c => c._id === casteId);
  const subCasteOptions = selectedCaste?.subCastes || [];

  const handleContinue = () => {
    if (!religion.trim())
      return Alert.alert('Required', 'Please enter religion');
    if (!casteId) return Alert.alert('Required', 'Please select caste');
    if (!subCaste) return Alert.alert('Required', 'Please select sub caste');
    if (!motherTongue.trim())
      return Alert.alert('Required', 'Please enter mother tongue');

    setField('religion', religion.trim());
    setField('caste', casteId);
    setField('subCaste', subCaste);
    setField('motherTongue', motherTongue.trim());
    navigation.navigate('SignupContact');
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
            source={require('../../../assets/images/logo-red.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          Select <Text style={styles.titleRed}>Caste</Text>
        </Text>

        <Text style={styles.label}>Religion</Text>
        <SearchableDropdown
          placeholder="Select Religion"
          value={religion}
          options={RELIGIONS.map(r => ({ label: r, value: r }))}
          onSelect={val => setReligion(val)}
          allowCustom
        />

        <Text style={styles.label}>
          Select Caste <Text style={styles.star}>*</Text>
        </Text>
        {loading ? (
          <ActivityIndicator color="#D20236" style={{ marginVertical: 16 }} />
        ) : (
          <SearchableDropdown
            placeholder="Caste"
            value={casteId}
            options={castes.map(c => ({ label: c.casteName, value: c._id }))}
            onSelect={val => {
              setCasteId(val);
              setSubCaste('');
            }}
          />
        )}
        <SearchableDropdown
          placeholder="Sub- Caste"
          value={subCaste}
          options={subCasteOptions.map(sc => ({ label: sc, value: sc }))}
          onSelect={val => setSubCaste(val)}
          allowCustom
          disabled={subCasteOptions.length === 0}
        />

        <Text style={styles.label}>
          Mother Tongue <Text style={styles.star}>*</Text>
        </Text>
        <SearchableDropdown
          placeholder="Select Mother Tongue"
          value={motherTongue}
          options={MOTHER_TONGUES.map(tongue => ({ label: tongue, value: tongue }))}
          onSelect={val => setMotherTongue(val)}
          allowCustom
        />

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
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
    marginTop: 6,
  },
  star: { color: '#D20236' },
  continueBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
