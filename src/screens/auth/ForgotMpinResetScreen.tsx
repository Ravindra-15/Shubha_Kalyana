import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resetMpin } from '../../api/settings';

const PIN_LENGTH = 4;

export default function ForgotMpinResetScreen({ navigation, route }: any) {
  const identifier: string = route?.params?.identifier || '';
  const code: string = route?.params?.code || '';

  const [mpin, setMpin] = useState(['', '', '', '']);
  const [confirmMpin, setConfirmMpin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [errMpin, setErrMpin] = useState(false);
  const [errConfirm, setErrConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const mpinRefs = useRef<Array<TextInput | null>>([]);
  const confirmRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (
    value: string,
    index: number,
    arr: string[],
    setArr: (v: string[]) => void,
    refs: React.MutableRefObject<Array<TextInput | null>>,
    clearErr: () => void
  ) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    const next = [...arr];
    next[index] = value;
    setArr(next);
    clearErr();
    if (value && index < PIN_LENGTH - 1) refs.current[index + 1]?.focus();
    if (!value && index > 0) refs.current[index - 1]?.focus();
  };

  const submit = async () => {
    const pin = mpin.join('');
    const confirm = confirmMpin.join('');

    if (pin.length !== PIN_LENGTH) {
      setErrMpin(true);
      return Alert.alert('Required', `Enter a ${PIN_LENGTH}-digit MPIN`);
    }
    if (confirm.length !== PIN_LENGTH) {
      setErrConfirm(true);
      return Alert.alert('Required', 'Confirm your MPIN');
    }
    if (pin !== confirm) {
      setErrConfirm(true);
      return Alert.alert('Mismatch', 'MPIN and Confirm MPIN do not match');
    }

    try {
      setLoading(true);
      await resetMpin({ mobile: identifier, code, mpin: pin, confirmMpin: confirm });
      setCreated(true);
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login', params: { justResetMpin: true } }],
        });
      }, 1200);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not reset MPIN');
    } finally {
      setLoading(false);
    }
  };

  const renderBoxes = (
    arr: string[],
    setArr: (v: string[]) => void,
    refs: React.MutableRefObject<Array<TextInput | null>>,
    error: boolean,
    clearErr: () => void
  ) => (
    <View style={styles.pinRow}>
      {arr.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={[styles.pinBox, error && styles.pinBoxError]}
          value={digit}
          onChangeText={(v) => handleChange(v, i, arr, setArr, refs, clearErr)}
          keyboardType="number-pad"
          maxLength={1}
          secureTextEntry={!showPin}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>
          Set up a{'\n'}
          <Text style={styles.titleRed}>MPIN</Text>
        </Text>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Create a MPIN</Text>
          <TouchableOpacity onPress={() => setShowPin(!showPin)}>
            <Text style={styles.eye}>{showPin ? '🙈 Hide' : '👁 Show'}</Text>
          </TouchableOpacity>
        </View>
        {renderBoxes(mpin, setMpin, mpinRefs, errMpin, () => setErrMpin(false))}

        <Text style={[styles.label, { marginTop: 28 }]}>Confirm a MPIN</Text>
        {renderBoxes(confirmMpin, setConfirmMpin, confirmRefs, errConfirm, () => setErrConfirm(false))}

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextBtn} onPress={submit} disabled={loading || created}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Next →</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={created} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.card}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.cardText}>MPIN Reset Successful</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 30, paddingTop: 20 },
  title: {
    fontSize: 26,
    fontFamily: 'Outfit-Regular',
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#333', marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 0 },
  eye: { fontSize: 13, color: '#D20236', fontFamily: 'Outfit-SemiBold', marginLeft: 12, marginBottom: 16 },
  pinRow: { flexDirection: 'row', justifyContent: 'center' },
  pinBox: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 22,
    color: '#000',
    marginHorizontal: 8,
  },
  pinBoxError: { borderColor: '#D20236', borderWidth: 1.5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  check: { fontSize: 40, color: '#2ecc71', marginBottom: 12 },
  cardText: { fontSize: 18, fontFamily: 'Outfit-SemiBold', color: '#000' },
  spacer: { flex: 1 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});
