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
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';

export default function AddressDetailsScreen({ navigation }: any) {
  const [residenceType, setResidenceType] = useState<'INDIA' | 'NRI'>('INDIA');
  const [addressLine1, setAddressLine1] = useState('');
  // India fields
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  // NRI fields
  const [country, setCountry] = useState('');
  const [stateOrProvince, setStateOrProvince] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('AboutYou');
      return;
    }

    const newErrors: { [k: string]: boolean } = {};

    if (residenceType === 'INDIA') {
      if (!state.trim()) newErrors.state = true;
      if (!district.trim()) newErrors.district = true;
      if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) newErrors.pincode = true;
    } else {
      if (!country.trim()) newErrors.country = true;
      if (!city.trim()) newErrors.city = true;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return Alert.alert('Required', 'Please fill the required address fields correctly');
    }

    const current: any = { residenceType, addressLine1: addressLine1.trim() };
    if (residenceType === 'INDIA') {
      current.taluka = taluka.trim();
      current.district = district.trim();
      current.state = state.trim();
      current.pincode = pincode.trim();
    } else {
      current.country = country.trim();
      current.stateOrProvince = stateOrProvince.trim();
      current.city = city.trim();
      current.postalCode = postalCode.trim();
    }

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', { address: { current } });
      navigation.navigate('AboutYou');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  const clearErr = (key: string) => setErrors((e) => ({ ...e, [key]: false }));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper>
        <View style={styles.inner}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={7} total={9} />

          <Text style={styles.title}>
            Where do you <Text style={styles.titleRed}>Live</Text>
          </Text>

          {/* India / NRI toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggle, residenceType === 'INDIA' && styles.toggleActive]}
              onPress={() => setResidenceType('INDIA')}
            >
              <Text style={[styles.toggleText, residenceType === 'INDIA' && styles.toggleTextActive]}>
                India
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggle, residenceType === 'NRI' && styles.toggleActive]}
              onPress={() => setResidenceType('NRI')}
            >
              <Text style={[styles.toggleText, residenceType === 'NRI' && styles.toggleTextActive]}>
                NRI
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Address Line</Text>
          <TextInput
            style={styles.input}
            placeholder="House no, street, area"
            placeholderTextColor="#999"
            value={addressLine1}
            onChangeText={setAddressLine1}
          />

          {residenceType === 'INDIA' ? (
            <>
              <Text style={styles.label}>State <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.state && styles.inputError]}
                placeholder="State"
                placeholderTextColor="#999"
                value={state}
                onChangeText={(t) => { setState(t); clearErr('state'); }}
              />

              <Text style={styles.label}>District <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.district && styles.inputError]}
                placeholder="District"
                placeholderTextColor="#999"
                value={district}
                onChangeText={(t) => { setDistrict(t); clearErr('district'); }}
              />

              <Text style={styles.label}>Taluka</Text>
              <TextInput
                style={styles.input}
                placeholder="Taluka"
                placeholderTextColor="#999"
                value={taluka}
                onChangeText={setTaluka}
              />

              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={[styles.input, errors.pincode && styles.inputError]}
                placeholder="6-digit pincode"
                placeholderTextColor="#999"
                value={pincode}
                onChangeText={(t) => { setPincode(t); clearErr('pincode'); }}
                keyboardType="number-pad"
                maxLength={6}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Country <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.country && styles.inputError]}
                placeholder="Country"
                placeholderTextColor="#999"
                value={country}
                onChangeText={(t) => { setCountry(t); clearErr('country'); }}
              />

              <Text style={styles.label}>City <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="City"
                placeholderTextColor="#999"
                value={city}
                onChangeText={(t) => { setCity(t); clearErr('city'); }}
              />

              <Text style={styles.label}>State / Province</Text>
              <TextInput
                style={styles.input}
                placeholder="State or Province"
                placeholderTextColor="#999"
                value={stateOrProvince}
                onChangeText={setStateOrProvince}
              />

              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Postal code"
                placeholderTextColor="#999"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="number-pad"
              />
            </>
          )}

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.nextBtn} onPress={() => submit(false)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Next  →</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => submit(true)}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 24 },
  titleRed: { color: '#D20236' },
  toggleRow: { flexDirection: 'row', marginBottom: 20 },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  toggleText: { fontSize: 15, color: '#333' },
  toggleTextActive: { color: '#D20236', fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10, marginTop: 4 },
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
  spacer: { minHeight: 20 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: { color: '#000', fontSize: 16, fontWeight: '600' },
});