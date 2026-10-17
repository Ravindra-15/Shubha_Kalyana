import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Animated,
  PanResponder,
  PanResponderGestureState,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import SearchableDropdown from './SearchableDropdown';
import MultiSelectDropdown from './MultiSelectDropdown';
import { getCastes, Caste } from '../api/caste';
import { INDIAN_STATE_OPTIONS } from '../constants/indianStates';
import { getDistrictOptionsForStates } from '../constants/districtsByState';

export type Filters = {
  minAge: number;
  maxAge: number;
  religion: string;
  caste: string[];
  subCaste: string[];
  maritalStatus: string;
  education: string[];
  profession: string[];
  preferredLocation: string[];
  district: string[];
};

const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Other'];
const MARITAL_STATUS = [
  { label: 'Never Married', value: 'NEVER_MARRIED' },
  { label: 'Divorced', value: 'DIVORCED' },
  { label: 'Widowed', value: 'WIDOWED' },
  { label: 'Awaiting Divorce', value: 'AWAITING_DIVORCE' },
];

// The profiles being searched for are (usually) the opposite gender of the
// logged-in user, so "Widowed" is shown as it would describe them —
// matches the same helper used on partner preference.
const getMaritalStatusOptions = (gender?: string) =>
  MARITAL_STATUS.map((option) =>
    option.value === 'WIDOWED'
      ? {
          ...option,
          label:
            gender === 'MALE' ? 'Widow (Girl)' : gender === 'FEMALE' ? 'Widower (Boy)' : 'Widowed',
        }
      : option,
  );
const EDUCATION = ['B.Tech', 'B.E', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'MBBS', 'M.Tech', 'M.Sc', 'MBA', 'MCA', 'PhD', 'Diploma'];
// Kept in sync with the profession options shown during onboarding
// (matrimony-user/src/onboarding/onboardingOptions.js -> professionOptions).
const PROFESSION = [
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
];

// Sheet is 85% of the screen tall (styles.sheet); used as its off-screen offset.
const SHEET_HEIGHT = Dimensions.get('window').height * 0.85;

const DEFAULT: Filters = {
  minAge: 24, maxAge: 30, religion: '', caste: [], subCaste: [], maritalStatus: '', education: [], profession: [], preferredLocation: [], district: [],
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters | null) => void;
  initial?: Filters;
  gender?: string;
};

export default function FilterModal({ visible, onClose, onApply, initial, gender }: Props) {
  const maritalStatusOptions = getMaritalStatusOptions(gender);
  const [minAge, setMinAge] = useState(initial?.minAge ?? 24);
  const [maxAge, setMaxAge] = useState(initial?.maxAge ?? 30);
  const [religion, setReligion] = useState(initial?.religion || '');
  const [caste, setCaste] = useState<string[]>(initial?.caste || []);
  const [subCaste, setSubCaste] = useState<string[]>(initial?.subCaste || []);
  const [maritalStatus, setMaritalStatus] = useState(initial?.maritalStatus || '');
  const [education, setEducation] = useState<string[]>(initial?.education || []);
  const [profession, setProfession] = useState<string[]>(initial?.profession || []);
  const [preferredLocation, setPreferredLocation] = useState<string[]>(initial?.preferredLocation || []);
  const [district, setDistrict] = useState<string[]>(initial?.district || []);
  const [castes, setCastes] = useState<Caste[]>([]);

  useEffect(() => {
    (async () => {
      try { setCastes(await getCastes()); } catch {}
    })();
  }, []);

  // re-sync local state whenever modal opens with fresh "initial" values (e.g. after a reset)
  useEffect(() => {
    if (visible) {
      setMinAge(initial?.minAge ?? 24);
      setMaxAge(initial?.maxAge ?? 30);
      setReligion(initial?.religion || '');
      setCaste(initial?.caste || []);
      setSubCaste(initial?.subCaste || []);
      setMaritalStatus(initial?.maritalStatus || '');
      setEducation(initial?.education || []);
      setProfession(initial?.profession || []);
      setPreferredLocation(initial?.preferredLocation || []);
      setDistrict(initial?.district || []);
    }
  }, [visible, initial]);

  // union of subcastes across all currently-selected castes
  const subCasteOptions = castes
    .filter((c) => caste.includes(c._id))
    .flatMap((c) => c.subCastes || []);
  const uniqueSubCasteOptions = Array.from(new Set(subCasteOptions));

  // union of districts across all currently-selected states
  const districtOptions = getDistrictOptionsForStates(preferredLocation);

  // Bottom-sheet motion. The Modal itself doesn't animate (animationType
  // "none"); the sheet slides with translateY and the dim backdrop fades
  // with it, so dragging, flicking, tapping outside, Back, Apply and Reset
  // all close with the same quick slide-down.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SHEET_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const closingRef = useRef(false);
  const scrollYRef = useRef(0);
  const dragStartedAtTopRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    scrollYRef.current = 0;
    translateY.setValue(SHEET_HEIGHT);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  // Only uses refs + the stable Animated value, so the PanResponder below
  // (created once) can safely call it.
  const closeSheet = useRef(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onCloseRef.current());
  }).current;

  const springBack = () =>
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();

  const reset = () => {
    setMinAge(DEFAULT.minAge); setMaxAge(DEFAULT.maxAge);
    setReligion(''); setCaste([]); setSubCaste([]); setMaritalStatus(''); setEducation([]); setProfession([]); setPreferredLocation([]); setDistrict([]);
    onApply(null); // clear all filters → reload full list
    closeSheet();
  };

  const apply = () => {
    onApply({ minAge, maxAge, religion, caste, subCaste, maritalStatus, education, profession, preferredLocation, district });
    closeSheet();
  };

  // Swipe down anywhere on the sheet: always from the handle/title, and from
  // the body while the options list is scrolled to the top (otherwise the
  // swipe just scrolls the list back up). Mostly-vertical moves only, so the
  // horizontal age sliders keep working.
  const isDownSwipe = (g: PanResponderGestureState) => g.dy > 3 && g.dy > Math.abs(g.dx) * 1.5;
  const dragHandlers = {
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_: unknown, g: PanResponderGestureState) =>
      translateY.setValue(Math.max(0, g.dy)),
    onPanResponderRelease: (_: unknown, g: PanResponderGestureState) => {
      if (g.dy > 80 || g.vy > 0.5) closeSheet();
      else springBack();
    },
    onPanResponderTerminate: springBack,
  };
  // Whole sheet: only while the options list is at the top.
  const sheetPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => scrollYRef.current <= 0 && isDownSwipe(g),
      ...dragHandlers,
    }),
  ).current;
  // Handle + title: always draggable.
  const headerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => isDownSwipe(g),
      ...dragHandlers,
    }),
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeSheet}>
      <View style={styles.overlay}>
        {/* Tapping the dimmed area above the sheet closes it. */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          {...sheetPan.panHandlers}
        >
          <View style={styles.dragZone} {...headerPan.panHandlers}>
            <View style={styles.handle} />
            <Text style={styles.title}>Filters</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={{ paddingBottom: 10 }}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollYRef.current = e.nativeEvent.contentOffset.y;
            }}
            onScrollBeginDrag={(e) => {
              dragStartedAtTopRef.current = e.nativeEvent.contentOffset.y <= 0;
            }}
            onScrollEndDrag={(e) => {
              // A fast flick down at the top can be grabbed by Android's
              // native ScrollView before the swipe handler sees it. Android
              // reports finger velocity (dp/ms, positive = downwards), so a
              // downward flick that started at the top closes the sheet.
              const vy = e.nativeEvent.velocity?.y ?? 0;
              if (
                Platform.OS === 'android' &&
                dragStartedAtTopRef.current &&
                e.nativeEvent.contentOffset.y <= 0 &&
                vy > 0.5
              ) {
                closeSheet();
              }
            }}
          >
            <Text style={styles.label}>Age Between : {minAge} - {maxAge}</Text>
            <Text style={styles.sliderHint}>Min Age: {minAge}</Text>
            <Slider
              minimumValue={18}
              maximumValue={70}
              step={1}
              value={minAge}
              onValueChange={(v) => setMinAge(Math.min(v, maxAge))}
              minimumTrackTintColor="#D20236"
              maximumTrackTintColor="#eee"
              thumbTintColor="#D20236"
            />
            <Text style={styles.sliderHint}>Max Age: {maxAge}</Text>
            <Slider
              minimumValue={18}
              maximumValue={70}
              step={1}
              value={maxAge}
              onValueChange={(v) => setMaxAge(Math.max(v, minAge))}
              minimumTrackTintColor="#D20236"
              maximumTrackTintColor="#eee"
              thumbTintColor="#D20236"
            />

            <Text style={styles.label}>Preferred Religion</Text>
            <SearchableDropdown
              placeholder="Select Religion"
              value={religion}
              options={RELIGIONS.map((r) => ({ label: r, value: r }))}
              onSelect={setReligion}
            />

            <Text style={styles.label}>Preferred Caste</Text>
            <MultiSelectDropdown
              placeholder="Select Caste"
              value={caste}
              options={castes.map((c) => ({ label: c.casteName, value: c._id }))}
              onChange={(vals) => { setCaste(vals); setSubCaste([]); }}
            />

            <Text style={styles.label}>Preferred Sub Caste</Text>
            <MultiSelectDropdown
              placeholder="Select Sub Caste"
              value={subCaste}
              options={uniqueSubCasteOptions.map((s) => ({ label: s, value: s }))}
              onChange={setSubCaste}
              allowCustom
              disabled={uniqueSubCasteOptions.length === 0}
            />

            <Text style={styles.label}>Preferred Marital Status</Text>
            <SearchableDropdown
              placeholder="Select Marital Status"
              value={maritalStatus}
              options={maritalStatusOptions}
              onSelect={setMaritalStatus}
            />

            <Text style={styles.label}>Preferred Education</Text>
            <MultiSelectDropdown
              placeholder="Select Education"
              value={education}
              options={EDUCATION.map((e) => ({ label: e, value: e }))}
              onChange={setEducation}
              allowCustom
            />

            <Text style={styles.label}>Preferred Profession</Text>
            <MultiSelectDropdown
              placeholder="Select Profession"
              value={profession}
              options={PROFESSION.map((p) => ({ label: p, value: p }))}
              onChange={setProfession}
              allowCustom
            />

            <Text style={styles.label}>Preferred State</Text>
            <MultiSelectDropdown
              placeholder="Search and select state"
              value={preferredLocation}
              options={INDIAN_STATE_OPTIONS}
              onChange={(vals) => { setPreferredLocation(vals); setDistrict([]); }}
            />

            <Text style={styles.label}>Preferred District</Text>
            <MultiSelectDropdown
              placeholder={
                districtOptions.length
                  ? 'Search and select district / city'
                  : 'Select a state first'
              }
              value={district}
              options={districtOptions}
              onChange={setDistrict}
              disabled={districtOptions.length === 0}
            />
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetText}>Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={apply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    height: '85%',
  },
  dragZone: { paddingTop: 4 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#000', marginBottom: 16 },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 8, marginTop: 10 },
  sliderHint: { fontSize: 12, color: '#666' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  resetBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  resetText: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#333' },
  applyBtn: { flex: 1, backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  applyText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#fff' },
});
