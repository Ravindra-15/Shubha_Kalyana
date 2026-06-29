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
import { useSignup } from '../../../context/SignupContext';

export default function AddressDetailsScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const addr = data.address || {};

  // current
  const [residenceType, setResidenceType] = useState<'INDIA' | 'NRI'>(addr.residenceType || 'INDIA');
  const [addressLine1, setAddressLine1] = useState(addr.addressLine1 || '');
  const [taluka, setTaluka] = useState(addr.taluka || '');
  const [district, setDistrict] = useState(addr.district || '');
  const [state, setState] = useState(addr.state || '');
  const [pincode, setPincode] = useState(addr.pincode || '');
  const [country, setCountry] = useState(addr.country || '');
  const [stateOrProvince, setStateOrProvince] = useState(addr.stateOrProvince || '');
  const [city, setCity] = useState(addr.city || '');
  const [postalCode, setPostalCode] = useState(addr.postalCode || '');

  // permanent
  const [sameAsCurrent, setSameAsCurrent] = useState(addr.sameAsCurrent ?? false);
  const [pResidenceType, setPResidenceType] = useState<'INDIA' | 'NRI'>(addr.pResidenceType || 'INDIA');
  const [pAddressLine1, setPAddressLine1] = useState(addr.pAddressLine1 || '');
  const [pTaluka, setPTaluka] = useState(addr.pTaluka || '');
  const [pDistrict, setPDistrict] = useState(addr.pDistrict || '');
  const [pState, setPState] = useState(addr.pState || '');
  const [pPincode, setPPincode] = useState(addr.pPincode || '');
  const [pCountry, setPCountry] = useState(addr.pCountry || '');
  const [pStateOrProvince, setPStateOrProvince] = useState(addr.pStateOrProvince || '');
  const [pCity, setPCity] = useState(addr.pCity || '');
  const [pPostalCode, setPPostalCode] = useState(addr.pPostalCode || '');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});

  const clearErr = (key: string) => setErrors((e) => ({ ...e, [key]: false }));

  const validate = () => {
    const e: { [k: string]: boolean } = {};
    let msg = '';

    if (residenceType === 'INDIA') {
      if (!state.trim()) { e.state = true; msg = msg || 'Please enter your State'; }
      if (!district.trim()) { e.district = true; msg = msg || 'Please enter your District'; }
      if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) { e.pincode = true; msg = msg || 'Pincode must be 6 digits'; }
    } else {
      if (!country.trim()) { e.country = true; msg = msg || 'Please enter your Country'; }
      if (!city.trim()) { e.city = true; msg = msg || 'Please enter your City'; }
    }

    if (!sameAsCurrent) {
      if (pResidenceType === 'INDIA') {
        if (!pState.trim()) { e.pState = true; msg = msg || 'Please enter Permanent State'; }
        if (!pDistrict.trim()) { e.pDistrict = true; msg = msg || 'Please enter Permanent District'; }
        if (pPincode.trim() && !/^\d{6}$/.test(pPincode.trim())) { e.pPincode = true; msg = msg || 'Permanent Pincode must be 6 digits'; }
      } else {
        if (!pCountry.trim()) { e.pCountry = true; msg = msg || 'Please enter Permanent Country'; }
        if (!pCity.trim()) { e.pCity = true; msg = msg || 'Please enter Permanent City'; }
      }
    }

    return { e, msg };
  };

  const buildAddr = (type: 'INDIA' | 'NRI', line: string, t: string, d: string, s: string, pin: string, c: string, sp: string, ct: string, pc: string) => {
    const o: any = { residenceType: type, addressLine1: line.trim() };
    if (type === 'INDIA') {
      o.taluka = t.trim(); o.district = d.trim(); o.state = s.trim(); o.pincode = pin.trim();
    } else {
      o.country = c.trim(); o.stateOrProvince = sp.trim(); o.city = ct.trim(); o.postalCode = pc.trim();
    }
    return o;
  };

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('AboutYou');
      return;
    }

    const { e, msg } = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      return Alert.alert('Required', msg);
    }

    const current = buildAddr(residenceType, addressLine1, taluka, district, state, pincode, country, stateOrProvince, city, postalCode);

    const permanent = sameAsCurrent
      ? { sameAsCurrent: true, ...current }
      : { sameAsCurrent: false, ...buildAddr(pResidenceType, pAddressLine1, pTaluka, pDistrict, pState, pPincode, pCountry, pStateOrProvince, pCity, pPostalCode) };

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', { address: { current, permanent } });
      setField('address', {
        residenceType, addressLine1, taluka, district, state, pincode, country, stateOrProvince, city, postalCode,
        sameAsCurrent, pResidenceType, pAddressLine1, pTaluka, pDistrict, pState, pPincode, pCountry, pStateOrProvince, pCity, pPostalCode,
      });
      navigation.navigate('AboutYou');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  const renderFields = (
    type: 'INDIA' | 'NRI',
    setType: (v: 'INDIA' | 'NRI') => void,
    line: string, setLine: (v: string) => void,
    t: string, setT: (v: string) => void,
    d: string, setD: (v: string) => void,
    s: string, setS: (v: string) => void,
    pin: string, setPin: (v: string) => void,
    c: string, setC: (v: string) => void,
    sp: string, setSp: (v: string) => void,
    ct: string, setCt: (v: string) => void,
    pc: string, setPc: (v: string) => void,
    prefix: string
  ) => (
    <>
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggle, type === 'INDIA' && styles.toggleActive]} onPress={() => setType('INDIA')}>
          <Text style={[styles.toggleText, type === 'INDIA' && styles.toggleTextActive]}>India</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggle, type === 'NRI' && styles.toggleActive]} onPress={() => setType('NRI')}>
          <Text style={[styles.toggleText, type === 'NRI' && styles.toggleTextActive]}>NRI</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Address Line</Text>
      <TextInput style={styles.input} placeholder="House no, street, area" placeholderTextColor="#999" value={line} onChangeText={setLine} />

      {type === 'INDIA' ? (
        <>
          <Text style={styles.label}>State <Text style={styles.star}>*</Text></Text>
          <TextInput style={[styles.input, errors[`${prefix}State`] && styles.inputError]} placeholder="State" placeholderTextColor="#999" value={s} onChangeText={(v) => { setS(v); clearErr(`${prefix}State`); }} />
          <Text style={styles.label}>District <Text style={styles.star}>*</Text></Text>
          <TextInput style={[styles.input, errors[`${prefix}District`] && styles.inputError]} placeholder="District" placeholderTextColor="#999" value={d} onChangeText={(v) => { setD(v); clearErr(`${prefix}District`); }} />
          <Text style={styles.label}>Taluka</Text>
          <TextInput style={styles.input} placeholder="Taluka" placeholderTextColor="#999" value={t} onChangeText={setT} />
          <Text style={styles.label}>Pincode</Text>
          <TextInput style={[styles.input, errors[`${prefix}Pincode`] && styles.inputError]} placeholder="6-digit pincode" placeholderTextColor="#999" value={pin} onChangeText={(v) => { setPin(v); clearErr(`${prefix}Pincode`); }} keyboardType="number-pad" maxLength={6} />
        </>
      ) : (
        <>
          <Text style={styles.label}>Country <Text style={styles.star}>*</Text></Text>
          <TextInput style={[styles.input, errors[`${prefix}Country`] && styles.inputError]} placeholder="Country" placeholderTextColor="#999" value={c} onChangeText={(v) => { setC(v); clearErr(`${prefix}Country`); }} />
          <Text style={styles.label}>City <Text style={styles.star}>*</Text></Text>
          <TextInput style={[styles.input, errors[`${prefix}City`] && styles.inputError]} placeholder="City" placeholderTextColor="#999" value={ct} onChangeText={(v) => { setCt(v); clearErr(`${prefix}City`); }} />
          <Text style={styles.label}>State / Province</Text>
          <TextInput style={styles.input} placeholder="State or Province" placeholderTextColor="#999" value={sp} onChangeText={setSp} />
          <Text style={styles.label}>Postal Code</Text>
          <TextInput style={styles.input} placeholder="Postal code" placeholderTextColor="#999" value={pc} onChangeText={setPc} keyboardType="number-pad" />
        </>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper>
        <View style={styles.inner}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={7} total={9} />

          <Text style={styles.title}>Where do you <Text style={styles.titleRed}>Live</Text></Text>

          <Text style={styles.section}>Current Address</Text>
          {renderFields(
            residenceType, setResidenceType, addressLine1, setAddressLine1,
            taluka, setTaluka, district, setDistrict, state, setState, pincode, setPincode,
            country, setCountry, stateOrProvince, setStateOrProvince, city, setCity, postalCode, setPostalCode, ''
          )}

          <Text style={styles.section}>Permanent Address</Text>
          <TouchableOpacity style={styles.checkRow} onPress={() => setSameAsCurrent(!sameAsCurrent)}>
            <View style={[styles.checkbox, sameAsCurrent && styles.checkboxActive]}>
              {sameAsCurrent && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>Same as current</Text>
          </TouchableOpacity>

          {!sameAsCurrent &&
            renderFields(
              pResidenceType, setPResidenceType, pAddressLine1, setPAddressLine1,
              pTaluka, setPTaluka, pDistrict, setPDistrict, pState, setPState, pPincode, setPPincode,
              pCountry, setPCountry, pStateOrProvince, setPStateOrProvince, pCity, setPCity, pPostalCode, setPPostalCode, 'p'
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
  title: { fontSize: 26, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 20 },
  titleRed: { color: '#D20236' },
  section: { fontSize: 17, fontWeight: '700', color: '#D20236', marginTop: 20, marginBottom: 14 },
  toggleRow: { flexDirection: 'row', marginBottom: 16 },
  toggle: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', paddingVertical: 12, alignItems: 'center' },
  toggleActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  toggleText: { fontSize: 15, color: '#333' },
  toggleTextActive: { color: '#D20236', fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10, marginTop: 4 },
  star: { color: '#D20236' },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14, color: '#000' },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkLabel: { fontSize: 15, color: '#333' },
  spacer: { minHeight: 20 },
  nextBtn: { backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { borderWidth: 1, borderColor: '#D20236', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  skipText: { color: '#000', fontSize: 16, fontWeight: '600' },
});