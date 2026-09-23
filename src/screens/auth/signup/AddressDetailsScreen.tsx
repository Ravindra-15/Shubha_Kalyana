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
import SearchableDropdown from '../../../components/SearchableDropdown';
import { INDIAN_STATE_OPTIONS } from '../../../constants/indianStates';
import { getDistrictOptionsForStates } from '../../../constants/districtsByState';
import { useScrollToError } from '../../../hooks/useScrollToError';
import { useTranslation } from 'react-i18next';
import SplitTitle from '../../../components/SplitTitle';

export default function AddressDetailsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { data, setField } = useSignup();
  const addr = data.address || {};

  // current
  const [residenceType, setResidenceType] = useState<'INDIA' | 'NRI'>(addr.residenceType || 'INDIA');
  const [addressLine1, setAddressLine1] = useState(addr.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(addr.addressLine2 || '');
  const [district, setDistrict] = useState(addr.district || '');
  const [state, setState] = useState(addr.state || '');
  const [country, setCountry] = useState(addr.country || '');
  const [stateOrProvince, setStateOrProvince] = useState(addr.stateOrProvince || '');
  const [postalCode, setPostalCode] = useState(addr.postalCode || '');

  // permanent
  const [sameAsCurrent, setSameAsCurrent] = useState(addr.sameAsCurrent ?? false);
  const [pResidenceType, setPResidenceType] = useState<'INDIA' | 'NRI'>(addr.pResidenceType || 'INDIA');
  const [pAddressLine1, setPAddressLine1] = useState(addr.pAddressLine1 || '');
  const [pAddressLine2, setPAddressLine2] = useState(addr.pAddressLine2 || '');
  const [pDistrict, setPDistrict] = useState(addr.pDistrict || '');
  const [pState, setPState] = useState(addr.pState || '');
  const [pCountry, setPCountry] = useState(addr.pCountry || '');
  const [pStateOrProvince, setPStateOrProvince] = useState(addr.pStateOrProvince || '');
  const [pPostalCode, setPPostalCode] = useState(addr.pPostalCode || '');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});
  const { scrollRef, registerField, scrollToError } = useScrollToError();
  const FIELD_ORDER = ['addressLine1', 'state', 'district', 'country', 'pAddressLine1', 'pState', 'pDistrict', 'pCountry'];

  const clearErr = (key: string) => setErrors((e) => ({ ...e, [key]: false }));

  const validate = () => {
    const e: { [k: string]: boolean } = {};
    let msg = '';

    if (!addressLine1.trim()) { e.addressLine1 = true; msg = msg || 'Please enter your Address'; }

    if (residenceType === 'INDIA') {
      if (!state.trim()) { e.state = true; msg = msg || 'Please enter your State'; }
      if (!district.trim()) { e.district = true; msg = msg || 'Please enter your District'; }
    } else {
      if (!country.trim()) { e.country = true; msg = msg || 'Please enter your Country'; }
    }

    if (!sameAsCurrent) {
      if (!pAddressLine1.trim()) { e.pAddressLine1 = true; msg = msg || 'Please enter Permanent Address'; }

      if (pResidenceType === 'INDIA') {
        if (!pState.trim()) { e.pState = true; msg = msg || 'Please enter Permanent State'; }
        if (!pDistrict.trim()) { e.pDistrict = true; msg = msg || 'Please enter Permanent District'; }
      } else {
        if (!pCountry.trim()) { e.pCountry = true; msg = msg || 'Please enter Permanent Country'; }
      }
    }

    return { e, msg };
  };

  const buildAddr = (type: 'INDIA' | 'NRI', line: string, line2: string, d: string, s: string, c: string, sp: string, pc: string) => {
    const o: any = { residenceType: type, addressLine1: line.trim(), addressLine2: line2.trim() };
    if (type === 'INDIA') {
      o.district = d.trim(); o.state = s.trim();
    } else {
      o.country = c.trim(); o.stateOrProvince = sp.trim(); o.postalCode = pc.trim();
    }
    return o;
  };

  const submit = async (_skip = false) => {
    const { e, msg } = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollToError(Object.keys(e), FIELD_ORDER);
      return Alert.alert('Required', msg);
    }

    const current = buildAddr(residenceType, addressLine1, addressLine2, district, state, country, stateOrProvince, postalCode);

    const permanent = sameAsCurrent
      ? { sameAsCurrent: true, ...current }
      : { sameAsCurrent: false, ...buildAddr(pResidenceType, pAddressLine1, pAddressLine2, pDistrict, pState, pCountry, pStateOrProvince, pPostalCode) };

    try {
      setLoading(true);
      const addrNow = {
        residenceType, addressLine1, addressLine2, district, state, country, stateOrProvince, postalCode,
        sameAsCurrent, pResidenceType, pAddressLine1, pAddressLine2, pDistrict, pState, pCountry, pStateOrProvince, pPostalCode,
      };
      // skip API if unchanged (prevents backend step rewind)
      if (JSON.stringify(data.address || {}) === JSON.stringify(addrNow)) {
        return navigation.navigate('Employment');
      }
      await apiClient.patch('/onboarding/profile', { address: { current, permanent } });
      setField('address', addrNow);
      navigation.navigate('Employment');
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
    line2: string, setLine2: (v: string) => void,
    d: string, setD: (v: string) => void,
    s: string, setS: (v: string) => void,
    c: string, setC: (v: string) => void,
    sp: string, setSp: (v: string) => void,
    pc: string, setPc: (v: string) => void,
    prefix: string
  ) => {
    const key = (name: string, capName: string) => (prefix ? `${prefix}${capName}` : name);
    return (
    <>
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggle, type === 'INDIA' && styles.toggleActive]} onPress={() => setType('INDIA')}>
          <Text style={[styles.toggleText, type === 'INDIA' && styles.toggleTextActive]}>{t('signup.address.india')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggle, type === 'NRI' && styles.toggleActive]} onPress={() => setType('NRI')}>
          <Text style={[styles.toggleText, type === 'NRI' && styles.toggleTextActive]}>{t('signup.address.nri')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('signup.address.addressLine1')} <Text style={styles.star}>*</Text></Text>
      <TextInput
        ref={registerField(key('addressLine1', 'AddressLine1')) as any}
        style={[styles.input, errors[key('addressLine1', 'AddressLine1')] && styles.inputError]}
        placeholder={t('signup.address.addressLine1Placeholder')}
        placeholderTextColor="#999"
        value={line}
        onChangeText={(v) => { setLine(v); clearErr(key('addressLine1', 'AddressLine1')); }}
      />

      <Text style={styles.label}>{t('signup.address.addressLine2')}</Text>
      <TextInput style={styles.input} placeholder={t('signup.address.addressLine2Placeholder')} placeholderTextColor="#999" value={line2} onChangeText={setLine2} />

      {type === 'INDIA' ? (
        <>
          <Text style={styles.label}>{t('signup.address.state')} <Text style={styles.star}>*</Text></Text>
          <View ref={registerField(prefix ? `${prefix}State` : 'state')}>
            <SearchableDropdown
              placeholder={t('signup.address.statePlaceholder')}
              value={s}
              options={INDIAN_STATE_OPTIONS}
              onSelect={(v) => {
                setS(v);
                clearErr(prefix ? `${prefix}State` : 'state');
                // District options depend on the selected state -- clear it
                // so a stale district from a different state can't remain.
                setD('');
              }}
              error={Boolean(errors[prefix ? `${prefix}State` : 'state'])}
            />
          </View>
          <Text style={styles.label}>{t('signup.address.district')} <Text style={styles.star}>*</Text></Text>
          <View ref={registerField(key('district', 'District')) as any}>
            <SearchableDropdown
              placeholder={s ? t('signup.address.selectDistrict') : t('signup.address.selectStateFirst')}
              value={d}
              options={getDistrictOptionsForStates(s ? [s] : [])}
              onSelect={(v) => {
                setD(v);
                clearErr(key('district', 'District'));
              }}
              error={Boolean(errors[key('district', 'District')])}
              disabled={!s}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>{t('signup.address.country')} <Text style={styles.star}>*</Text></Text>
          <TextInput ref={registerField(key('country', 'Country')) as any} style={[styles.input, errors[key('country', 'Country')] && styles.inputError]} placeholder={t('signup.address.countryPlaceholder')} placeholderTextColor="#999" value={c} onChangeText={(v) => { setC(v); clearErr(key('country', 'Country')); }} />
          <Text style={styles.label}>{t('signup.address.stateProvince')}</Text>
          <TextInput style={styles.input} placeholder={t('signup.address.stateProvincePlaceholder')} placeholderTextColor="#999" value={sp} onChangeText={setSp} />
          <Text style={styles.label}>{t('signup.address.postalCode')}</Text>
          <TextInput style={styles.input} placeholder={t('signup.address.postalCodePlaceholder')} placeholderTextColor="#999" value={pc} onChangeText={setPc} keyboardType="number-pad" />
        </>
      )}
    </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper ref={scrollRef}>
        <View style={styles.inner}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={9} total={16} />

          <SplitTitle
            style={styles.title}
            highlightStyle={styles.titleRed}
            pre={t('signup.address.titlePre')}
            highlight={t('signup.address.titleHighlight')}
            post={t('signup.address.titlePost')}
          />

          <Text style={styles.section}>{t('signup.address.currentAddress')}</Text>
          {renderFields(
            residenceType, setResidenceType, addressLine1, setAddressLine1,
            addressLine2, setAddressLine2, district, setDistrict, state, setState,
            country, setCountry, stateOrProvince, setStateOrProvince, postalCode, setPostalCode, ''
          )}

          <Text style={styles.section}>{t('signup.address.permanentAddress')}</Text>
          <TouchableOpacity style={styles.checkRow} onPress={() => setSameAsCurrent(!sameAsCurrent)}>
            <View style={[styles.checkbox, sameAsCurrent && styles.checkboxActive]}>
              {sameAsCurrent && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>{t('signup.address.sameAsCurrent')}</Text>
          </TouchableOpacity>

          {!sameAsCurrent &&
            renderFields(
              pResidenceType, setPResidenceType, pAddressLine1, setPAddressLine1,
              pAddressLine2, setPAddressLine2, pDistrict, setPDistrict, pState, setPState,
              pCountry, setPCountry, pStateOrProvince, setPStateOrProvince, pPostalCode, setPPostalCode, 'p'
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
  inner: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 26, fontFamily: 'Outfit-Regular', color: '#000', textAlign: 'center', marginBottom: 20 },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  section: { fontSize: 17, fontFamily: 'Outfit-Bold', color: '#D20236', marginTop: 20, marginBottom: 14 },
  toggleRow: { flexDirection: 'row', marginBottom: 16 },
  toggle: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', paddingVertical: 12, alignItems: 'center' },
  toggleActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  toggleText: { fontSize: 15, color: '#333' },
  toggleTextActive: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 10, marginTop: 4 },
  star: { color: '#D20236' },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14, color: '#000' },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  checkmark: { color: '#fff', fontSize: 14, fontFamily: 'Outfit-Bold' },
  checkLabel: { fontSize: 15, color: '#333' },
  spacer: { minHeight: 20 },
  nextBtn: { backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  skipBtn: { borderWidth: 1, borderColor: '#D20236', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  skipText: { color: '#000', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
});
