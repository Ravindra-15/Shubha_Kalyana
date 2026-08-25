import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  BackHandler,
  PermissionsAndroid,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Lock,
  X,
} from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import KeyboardWrapper from '../../components/KeyboardWrapper';
import SearchableDropdown from '../../components/SearchableDropdown';
import {
  getMyFullProfile,
  isProfilePictureVerified,
  updateMyProfile,
  updateMyPartnerPreference,
  uploadMyProfilePhoto,
} from '../../api/profile';
import {
  Caste,
  getCasteOptions,
  getReligionOptions,
} from '../../api/caste';
import { INDIAN_STATE_OPTIONS } from '../../constants/indianStates';
import { resolveImageUrl } from '../../utils/imageUrl';
import { validateProfilePhotoAsset } from '../../utils/profilePhotoValidation';

type ResidenceType = 'INDIA' | 'NRI';
type Option = { label: string; value: string };
type AddressFields = {
  residenceType: ResidenceType;
  addressLine1: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  stateOrProvince: string;
  city: string;
  postalCode: string;
};

const GENDER_OPTIONS: Option[] = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

const MARITAL_STATUS: Option[] = [
  { label: 'Never Married', value: 'NEVER_MARRIED' },
  { label: 'Divorced', value: 'DIVORCED' },
  { label: 'Widowed', value: 'WIDOWED' },
  { label: 'Awaiting Divorce', value: 'AWAITING_DIVORCE' },
];

const RASHIS: Option[] = [
  { label: 'Mesha (Aries)', value: 'MESHA' },
  { label: 'Vrishabha (Taurus)', value: 'VRISHABHA' },
  { label: 'Mithuna (Gemini)', value: 'MITHUNA' },
  { label: 'Karka (Cancer)', value: 'KARKA' },
  { label: 'Simha (Leo)', value: 'SIMHA' },
  { label: 'Kanya (Virgo)', value: 'KANYA' },
  { label: 'Tula (Libra)', value: 'TULA' },
  { label: 'Vrischika (Scorpio)', value: 'VRISCHIKA' },
  { label: 'Dhanu (Sagittarius)', value: 'DHANU' },
  { label: 'Makara (Capricorn)', value: 'MAKARA' },
  { label: 'Kumbha (Aquarius)', value: 'KUMBHA' },
  { label: 'Meena (Pisces)', value: 'MEENA' },
];

const NAKSHATRAS: Option[] = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
].map((nakshatra) => ({ label: nakshatra, value: nakshatra }));

const EMPLOYED_TYPES: Option[] = [
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Government', value: 'GOVERNMENT' },
  { label: 'Semi Government', value: 'SEMI_GOVERNMENT' },
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Agriculture', value: 'AGRICULTURE' },
];

const INCOME_SLABS: Option[] = [
  { label: 'Below ₹3 Lakh', value: 'BELOW_3L' },
  { label: '₹3 - 5 Lakh', value: '3L_5L' },
  { label: '₹5 - 10 Lakh', value: '5L_10L' },
  { label: '₹10 - 20 Lakh', value: '10L_20L' },
  { label: '₹20 - 50 Lakh', value: '20L_50L' },
  { label: 'Above ₹50 Lakh', value: 'ABOVE_50L' },
  { label: 'Write your own', value: '__other__' },
];

const BUSINESS_TYPES: Option[] = [
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Trading', value: 'Trading' },
  { label: 'Services', value: 'Services' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Other', value: 'Other' },
];

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

const DIET_OPTIONS: Option[] = [
  { label: 'Veg', value: 'VEG' },
  { label: 'Non Veg', value: 'NON_VEG' },
  { label: 'Eggitarian', value: 'EGGITARIAN' },
  { label: 'Jain', value: 'JAIN' },
  { label: 'Vegan', value: 'VEGAN' },
];

const YES_NO_OCCASIONAL: Option[] = [
  { label: 'No', value: 'NO' },
  { label: 'Yes', value: 'YES' },
  { label: 'Occasionally', value: 'OCCASIONALLY' },
];

const HEALTH_CONDITION_OPTIONS: Option[] = [
  { label: 'No', value: 'NO' },
  { label: 'Yes', value: 'YES' },
];

const RESIDENCE_TYPES: Option[] = [
  { label: 'India', value: 'INDIA' },
  { label: 'NRI', value: 'NRI' },
];

const RESIDENT_OPTIONS: Option[] = [
  { label: 'Indian', value: 'Indian' },
  { label: 'NRI', value: 'NRI' },
];

const EDUCATION_OPTIONS: Option[] = [
  '10th',
  '12th',
  'Diploma',
  'ITI',
  'B.Tech',
  'BCA',
  'BBA',
  'B.Com',
  'BA',
  'M.Tech',
  'MCA',
  'MBA',
  'M.Com',
  'MA',
  'MBBS',
  'BDS',
  'PhD',
  'CA',
  'CS',
].map((item) => ({ label: item, value: item }));

const PROFESSION_OPTIONS: Option[] = [
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
].map((item) => ({ label: item, value: item }));

const HOBBY_GROUPS = [
  {
    title: 'Entertainment',
    options: ['Music', 'Movies', 'Web Series', 'Reading'],
  },
  {
    title: 'Lifestyle & Activities',
    options: ['Traveling', 'Cooking', 'Gardening', 'Shopping', 'Drinking', 'Driving', 'Smoking', 'Podcasts'],
  },
  {
    title: 'Fitness & Health',
    options: ['Gym', 'Yoga', 'Running', 'Meditation', 'Sports', 'Cycling', 'Cricket'],
  },
];

const emptyAddress = (): AddressFields => ({
  residenceType: 'INDIA',
  addressLine1: '',
  taluka: '',
  district: '',
  state: '',
  pincode: '',
  country: '',
  stateOrProvince: '',
  city: '',
  postalCode: '',
});

// const hasValue = (value: unknown) => String(value ?? '').trim() !== '';
// (hasValue removed — no longer used now that real editLocks drive field state)
const isValidPincode = (value: string) => !value || /^\d{6}$/.test(value);
const isValidLinkedIn = (value: string) => !value || /linkedin\.com/i.test(value);
const toArray = (value: any) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
};
const cleanPayload = (payload: any) => JSON.parse(JSON.stringify(payload));

const profileTypeFromGender = (value: string) => {
  const gender = String(value || '').trim().toUpperCase();
  if (gender === 'MALE') return 'Groom';
  if (gender === 'FEMALE') return 'Bride';
  return '';
};

const optionLabel = (options: Option[], value: string) =>
  options.find((option) => option.value === value)?.label || value;

const addressFromProfile = (address: any = {}): AddressFields => ({
  residenceType: address.residenceType === 'NRI' ? 'NRI' : 'INDIA',
  addressLine1: address.addressLine1 || '',
  taluka: address.taluka || '',
  district: address.district || '',
  state: address.state || '',
  pincode: address.pincode || '',
  country: address.country || '',
  stateOrProvince: address.stateOrProvince || '',
  city: address.city || '',
  postalCode: address.postalCode || '',
});

const buildAddressPart = (address: AddressFields) => {
  const isNri = address.residenceType === 'NRI';

  return {
    residenceType: address.residenceType,
    addressLine1: address.addressLine1.trim(),
    taluka: isNri ? '' : address.taluka.trim(),
    district: isNri ? '' : address.district.trim(),
    state: isNri ? '' : address.state.trim(),
    pincode: isNri ? '' : address.pincode.trim(),
    country: isNri ? address.country.trim() : 'India',
    stateOrProvince: isNri ? address.stateOrProvince.trim() : '',
    city: isNri ? address.city.trim() : '',
    postalCode: isNri ? address.postalCode.trim() : '',
  };
};

export default function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [readonly, setReadonly] = useState({
    religion: '',
    casteName: '',
    subCaste: '',
    motherTongue: '',
    mobile: '',
    email: '',
    photoUrl: '',
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [rashi, setRashi] = useState('');
  const [nakshatra, setNakshatra] = useState('');

  const [religionValue, setReligionValue] = useState('');
  const [casteId, setCasteId] = useState('');
  const [subCasteValue, setSubCasteValue] = useState('');

  const [currentAddress, setCurrentAddress] = useState<AddressFields>(emptyAddress());
  const [permanentAddress, setPermanentAddress] = useState<AddressFields>(emptyAddress());
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  const [qualification, setQualification] = useState('');
  const [college, setCollege] = useState('');

  const [employedType, setEmployedType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [typeOfBusiness, setTypeOfBusiness] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [isCustomIncome, setIsCustomIncome] = useState(false);
  const [companyLocation, setCompanyLocation] = useState('');
  const [expYears, setExpYears] = useState('');
  const [expMonths, setExpMonths] = useState('');
  const [expPreset, setExpPreset] = useState('');
  const [isCustomExperience, setIsCustomExperience] = useState(false);
  const [linkedIn, setLinkedIn] = useState('');

  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [brothers, setBrothers] = useState('');
  const [sisters, setSisters] = useState('');

  const [diet, setDiet] = useState('');
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [healthCondition, setHealthCondition] = useState('');
  const [healthConditionDetails, setHealthConditionDetails] = useState('');

  const [aboutMe, setAboutMe] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);

  const [prefAgeMin, setPrefAgeMin] = useState('');
  const [prefAgeMax, setPrefAgeMax] = useState('');
  const [prefReligionValues, setPrefReligionValues] = useState<string[]>([]);
  const [prefCasteIds, setPrefCasteIds] = useState<string[]>([]);
  const [prefSubCasteValues, setPrefSubCasteValues] = useState<string[]>([]);
  const [prefEducationValues, setPrefEducationValues] = useState<string[]>([]);
  const [prefProfessionValues, setPrefProfessionValues] = useState<string[]>([]);
  const [prefMaritalStatusValues, setPrefMaritalStatusValues] = useState<string[]>([]);
  const [prefResidentValues, setPrefResidentValues] = useState<string[]>([]);

  const [castes, setCastes] = useState<Caste[]>([]);
  const [religions, setReligions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [profilePictureVerified, setProfilePictureVerified] = useState(false);
  const canVerifyProfilePhoto = true;

  // --- Tier 1 lock/change-request state (from backend) ---
  const [editLocks, setEditLocks] = useState<Record<string, { locked: boolean; lockedAt: string }>>({});
  const [changeRequests, setChangeRequests] = useState<
    Array<{ field: string; requestedValue: any; status: string; requestedAt: string }>
  >([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<{ flagged: boolean; fields: string[]; flaggedAt: string } | null>(null);

  // Values typed into a "Request Change" reveal-input for a locked field.
  // Local-only until Save is pressed — not sent anywhere until then.
  const [pendingChangeValues, setPendingChangeValues] = useState<Record<string, string>>({});
  // DOB's request-change input needs 3 separate fields, not one string.
  const [pendingDobDay, setPendingDobDay] = useState('');
  const [pendingDobMonth, setPendingDobMonth] = useState('');
  const [pendingDobYear, setPendingDobYear] = useState('');
  // Tracks which locked fields currently have their "Request Change" input open.
  const [openRequestFields, setOpenRequestFields] = useState<Record<string, boolean>>({});

  type TierFieldState = 'UNLOCKED' | 'LOCKED_NO_REQUEST' | 'LOCKED_PENDING';

  const getTierFieldState = useCallback(
    (fieldKey: string): TierFieldState => {
      const isLocked = editLocks[fieldKey]?.locked === true;
      if (!isLocked) return 'UNLOCKED';

      const hasPending = changeRequests.some(
        (request) => request.field === fieldKey && request.status === 'PENDING',
      );
      return hasPending ? 'LOCKED_PENDING' : 'LOCKED_NO_REQUEST';
    },
    [editLocks, changeRequests],
  );

  const openRequestChange = (fieldKey: string, currentValue: string) => {
    setOpenRequestFields((prev) => ({ ...prev, [fieldKey]: true }));
    setPendingChangeValues((prev) => ({ ...prev, [fieldKey]: currentValue }));
  };

  const setPendingChangeValue = (fieldKey: string, value: string) => {
    setPendingChangeValues((prev) => ({ ...prev, [fieldKey]: value }));
    markChanged();
  };

  const profileType = profileTypeFromGender(gender);
  const dobDisplay = [dobDay, dobMonth, dobYear].filter(Boolean).join('/');

  const isJobType = employedType === 'PRIVATE' || employedType === 'GOVERNMENT' || employedType === 'SEMI_GOVERNMENT';
  const isBusiness = employedType === 'BUSINESS';
  const isAgriculture = employedType === 'AGRICULTURE';
  const showDesignation = isJobType || isBusiness;
  const showExperience = isJobType || isBusiness;
  const showLinkedIn = !isAgriculture;

  const preferredCasteOptions = useMemo(() => {
    return castes
      .filter((caste) => {
        if (!prefReligionValues.length) return true;
        return prefReligionValues.includes(caste.religion || '');
      })
      .map((caste) => ({ label: caste.casteName, value: caste._id }));
  }, [castes, prefReligionValues]);

  const preferredSubCasteOptions = useMemo(() => {
    const selected = castes.filter((caste) => prefCasteIds.includes(caste._id));
    const values = [...new Set(selected.flatMap((caste) => caste.subCastes || []))];
    return values.map((value) => ({ label: value, value }));
  }, [castes, prefCasteIds]);

    const ownSubCasteOptions = useMemo(() => {
    const selectedCaste = castes.find((caste) => caste._id === casteId);
    return (selectedCaste?.subCastes || []).map((value) => ({ label: value, value }));
  }, [castes, casteId]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, casteList, religionList] = await Promise.all([
        getMyFullProfile(),
        getCasteOptions().catch(() => []),
        getReligionOptions().catch(() => []),
      ]);

      const user = data?.user || {};
      const profile = data?.profile || {};
      const basic = profile.basicInfo || {};
      const pref = data?.partnerPreference || data?.partnerPrefrence || {};
      const current = profile.address?.current || {};
      const permanent = profile.address?.permanent || {};
      const photo = profile.photos?.find((p: any) => p.isProfilePhoto)?.url || profile.photos?.[0]?.url || '';
      const casteName = basic.caste?.casteName || '';

      setCastes(casteList);
      setReligions(religionList);
      setReadonly({
        religion: basic.religion || '',
        casteName,
        subCaste: basic.subCaste || '',
        motherTongue: basic.motherTongue || '',
        mobile: user.mobile || '',
        email: user.email || '',
        photoUrl: photo,
      });

      setReligionValue(basic.religion || '');
      setCasteId(basic.caste?._id || '');
      setSubCasteValue(basic.subCaste || '');

      setEditLocks(profile.editLocks || {});
      setChangeRequests(profile.changeRequests || []);
      setRecentlyUpdated(profile.recentlyUpdated || null);
      setPendingChangeValues({});
      setOpenRequestFields({});

      setFirstName(basic.firstName || user.firstName || '');
      setLastName(basic.lastName || user.lastName || '');
      setGender(basic.gender || '');
      if (basic.dob) {
        const date = new Date(basic.dob);
        setDobDay(String(date.getDate()));
        setDobMonth(String(date.getMonth() + 1));
        setDobYear(String(date.getFullYear()));
      } else {
        setDobDay('');
        setDobMonth('');
        setDobYear('');
      }

      setHeightFeet(basic.height?.feet ? String(basic.height.feet) : '');
      setHeightInches(
        basic.height?.inches === 0 || basic.height?.inches
          ? String(basic.height.inches)
          : '',
      );
      setWeight(basic.weight?.value ? String(basic.weight.value) : '');
      setMaritalStatus(basic.maritalStatus || '');
      setRashi(profile.horoscopeDetail?.rashi || '');
      setNakshatra(profile.horoscopeDetail?.nakshatra || '');

      setCurrentAddress(addressFromProfile(current));
      setSameAsCurrent(Boolean(permanent.sameAsCurrent));
      setPermanentAddress(addressFromProfile(permanent));

      setQualification(profile.education?.highestQualification || '');
      setCollege(profile.education?.college || '');
      setEmployedType(profile.employment?.employedType || '');
      setCompanyName(profile.employment?.companyName || '');
      setDesignation(profile.employment?.designation || '');
      setTypeOfBusiness(profile.employment?.typeOfBusiness || '');
      setCompanyLocation(profile.employment?.companyLocation || '');
      setLinkedIn(profile.employment?.linkedInProfile || '');

      const loadedIncome = profile.employment?.annualIncome || '';
      setAnnualIncome(loadedIncome ? String(loadedIncome) : '');
      setIsCustomIncome(
        loadedIncome ? !INCOME_SLABS.some((slab) => slab.value === String(loadedIncome)) : false,
      );

      setExpYears(
        profile.employment?.totalExperienceYears !== undefined
          ? String(profile.employment.totalExperienceYears)
          : '',
      );
      setExpMonths(
        profile.employment?.totalExperienceMonths !== undefined
          ? String(profile.employment.totalExperienceMonths)
          : '',
      );
      setExpPreset('');
      setIsCustomExperience(false);

      setFatherName(profile.family?.fatherName || '');
      setMotherName(profile.family?.motherName || '');
      setFatherOccupation(profile.family?.fatherOccupation || '');
      setMotherOccupation(profile.family?.motherOccupation || '');
      setBrothers(profile.family?.brothers !== undefined ? String(profile.family.brothers) : '');
      setSisters(profile.family?.sisters !== undefined ? String(profile.family.sisters) : '');

      setDiet(profile.lifestyle?.diet || '');
      setSmoking(profile.lifestyle?.smoking || '');
      setDrinking(profile.lifestyle?.drinking || '');
      setHealthCondition(
        profile.healthDisclosure?.hasCondition === true
          ? 'YES'
          : profile.healthDisclosure?.hasCondition === false
            ? 'NO'
            : '',
      );
      setHealthConditionDetails(profile.healthDisclosure?.details || '');

      setAboutMe(profile.about?.aboutMe || '');
      setSelectedHobbies(toArray(profile.hobbiesAndInterests));

      setPrefAgeMin(pref.ageRange?.min ? String(pref.ageRange.min) : '');
      setPrefAgeMax(pref.ageRange?.max ? String(pref.ageRange.max) : '');
      setPrefReligionValues(toArray(pref.religion));
      setPrefCasteIds(toArray(pref.caste).map((item: any) => item?._id || item).filter(Boolean));
      setPrefSubCasteValues(toArray(pref.subCaste));
      setPrefEducationValues(toArray(pref.education));
      setPrefProfessionValues(toArray(pref.profession));
      setPrefMaritalStatusValues(toArray(pref.maritalStatus));
      setPrefResidentValues(toArray(pref.ressident || pref.resident));

      setProfilePictureVerified(isProfilePictureVerified(profile));
      setFieldErrors({});
      setErrorMsg('');
      setHasChanges(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasChanges) {
          Alert.alert(
            'Discard changes?',
            'You have unsaved changes. Are you sure you want to go back?',
            [
              { text: 'Stay', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
            ],
          );
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [hasChanges, navigation]),
  );

  const markChanged = () => setHasChanges(true);
  const clearError = (key: string) => {
    setFieldErrors((errors) => ({ ...errors, [key]: '' }));
    setErrorMsg('');
  };
  const setCurrentAddressField = (key: keyof AddressFields, value: string) => {
    setCurrentAddress((prev) => ({ ...prev, [key]: value }));
    markChanged();
    clearError(`current${String(key)}`);
  };
  const setPermanentAddressField = (key: keyof AddressFields, value: string) => {
    setPermanentAddress((prev) => ({ ...prev, [key]: value }));
    markChanged();
    clearError(`permanent${String(key)}`);
  };

  const setPreferredReligions = (values: string[]) => {
    const allowedCastes = castes.filter((caste) => !values.length || values.includes(caste.religion || ''));
    const allowedIds = new Set(allowedCastes.map((caste) => caste._id));
    const casteIds = prefCasteIds.filter((id) => allowedIds.has(id));
    const allowedSubs = new Set(
      castes
        .filter((caste) => casteIds.includes(caste._id))
        .flatMap((caste) => caste.subCastes || []),
    );

    setPrefReligionValues(values);
    setPrefCasteIds(casteIds);
    setPrefSubCasteValues((prev) => prev.filter((item) => allowedSubs.has(item)));
    markChanged();
  };

  const setPreferredCastes = (values: string[]) => {
    const selected = castes.filter((caste) => values.includes(caste._id));
    const casteReligions = selected.map((caste) => caste.religion).filter(Boolean) as string[];
    const allowedSubs = new Set(selected.flatMap((caste) => caste.subCastes || []));

    setPrefCasteIds(values);
    setPrefReligionValues((prev) => [...new Set([...prev, ...casteReligions])]);
    setPrefSubCasteValues((prev) => prev.filter((item) => allowedSubs.has(item)));
    markChanged();
  };

  const toggleHobby = (item: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    );
    markChanged();
  };

  const handleHeaderBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  const openProfileVerification = () => {
    if (!canVerifyProfilePhoto) {
      Alert.alert(
        'Membership required',
        'Photo verification is available with an active membership plan.',
      );
      return;
    }

    if (!readonly.photoUrl) {
      Alert.alert('Profile photo required', 'Please upload a profile photo before verification.');
      return;
    }

    if (hasChanges) {
      Alert.alert(
        'Unsaved changes',
        'Please save or discard your profile changes before verification.',
      );
      return;
    }

    navigation.navigate('FaceTecTest');
  };

  const pickPhoto = () => {
    Alert.alert('Change Photo', 'Choose an option', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;

    const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) return true;

    const result = await PermissionsAndroid.request(permission, {
      title: 'Camera Permission',
      message: 'Allow Shubha Kalyana to use your camera to take a profile photo.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const openCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please allow camera access to take a profile photo.');
        return;
      }

      const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
      handlePhotoResult(result);
    } catch {
      Alert.alert('Error', 'Could not open camera');
    }
  };

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      handlePhotoResult(result);
    } catch {
      Alert.alert('Error', 'Could not open gallery');
    }
  };

  const handlePhotoResult = async (result: any) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      return Alert.alert('Error', result.errorMessage || 'Could not pick image');
    }
    const asset = result.assets?.[0];
    if (!asset) return;

    const validationError = validateProfilePhotoAsset(asset);
    if (validationError) return Alert.alert('Invalid photo', validationError);

    try {
      setUploadingPhoto(true);
      const updated = await uploadMyProfilePhoto({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
      });
      const nextPhoto = updated?.profile?.photos?.find((p: any) => p.isProfilePhoto)?.url || updated?.profile?.photos?.[0]?.url;
      if (nextPhoto) {
        setReadonly((prev) => ({ ...prev, photoUrl: nextPhoto }));
      }
      setProfilePictureVerified(isProfilePictureVerified(updated?.profile));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (getTierFieldState('firstName') === 'UNLOCKED') {
      if (!firstName.trim()) {
        errors.firstName = 'First name is required';
      } else if (!/^[a-zA-Z\s'-]+$/.test(firstName.trim())) {
        errors.firstName = 'Only letters allowed';
      }
    }

    if (getTierFieldState('lastName') === 'UNLOCKED') {
      if (!lastName.trim()) {
        errors.lastName = 'Last name is required';
      } else if (!/^[a-zA-Z\s'-]+$/.test(lastName.trim())) {
        errors.lastName = 'Only letters allowed';
      }
    }

    if (getTierFieldState('gender') === 'UNLOCKED' && !gender) errors.gender = 'Gender is required';

    const validateDobParts = (day: string, month: string, year: string): string | null => {
      if (!day.trim() || !month.trim() || !year.trim()) {
        return 'Date of birth is required';
      }
      const dd = parseInt(day, 10);
      const mm = parseInt(month, 10);
      const yy = parseInt(year, 10);

      if (mm < 1 || mm > 12) return 'Month must be between 1 and 12';

      const daysInMonth = new Date(yy, mm, 0).getDate();
      if (dd < 1 || dd > daysInMonth) return `Day must be between 1 and ${daysInMonth}`;

      const currentYear = new Date().getFullYear();
      if (yy < 1900 || yy > currentYear) return 'Enter a valid year';

      const dobDate = new Date(yy, mm - 1, dd);
      const today = new Date();
      if (dobDate > today) return 'Date of birth cannot be in the future';

      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;
      if (age < 18) return 'Must be at least 18 years old';

      return null;
    };

    if (getTierFieldState('dob') === 'UNLOCKED') {
      const dobError = validateDobParts(dobDay, dobMonth, dobYear);
      if (dobError) errors.dob = dobError;
    }

    if (getTierFieldState('dob') === 'LOCKED_NO_REQUEST' && openRequestFields.dob) {
      const dobError = validateDobParts(pendingDobDay, pendingDobMonth, pendingDobYear);
      if (dobError) errors.dobRequest = dobError;
    }

    const numberInRange = (key: string, value: string, min: number, max: number, message: string) => {
      if (!value.trim()) return;
      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < min || parsed > max) errors[key] = message;
    };

    numberInRange('heightFeet', heightFeet, 3, 8, 'Feet must be between 3 and 8');
    numberInRange('heightInches', heightInches, 0, 11, 'Inches must be between 0 and 11');
    numberInRange('weight', weight, 20, 250, 'Weight must be between 20 and 250 KG');
    if (showExperience) {
      if (expYears.trim()) {
        const years = Number(expYears);
        if (Number.isNaN(years) || years < 0 || years > 50) {
          errors.totalExperience = 'Years must be between 0 and 50';
        }
      }
      if (expMonths.trim() && !errors.totalExperience) {
        const months = Number(expMonths);
        if (Number.isNaN(months) || months < 0 || months > 11) {
          errors.totalExperience = 'Months must be between 0 and 11';
        }
      }
    }
    numberInRange('brothers', brothers, 0, 20, 'Enter a valid number');
    numberInRange('sisters', sisters, 0, 20, 'Enter a valid number');

    if (currentAddress.pincode.trim() && !isValidPincode(currentAddress.pincode.trim())) {
      errors.currentpincode = 'Enter 6 digit pincode';
    }
    if (!sameAsCurrent && permanentAddress.pincode.trim() && !isValidPincode(permanentAddress.pincode.trim())) {
      errors.permanentpincode = 'Enter 6 digit pincode';
    }
    if (annualIncome.trim() && Number(annualIncome) < 0) {
      errors.annualIncome = 'Enter a valid amount';
    }
    if (linkedIn.trim() && !isValidLinkedIn(linkedIn.trim())) {
      errors.linkedIn = 'Enter a valid LinkedIn URL';
    }
    if (aboutMe.length > 2000) {
      errors.aboutMe = 'Bio can be up to 2000 characters';
    }
    if (healthCondition === 'YES' && !healthConditionDetails.trim()) {
      errors.healthConditionDetails = 'Please add a brief note';
    }
    if (
      prefAgeMin.trim() &&
      prefAgeMax.trim() &&
      Number(prefAgeMin) > Number(prefAgeMax)
    ) {
      errors.prefAgeMax = 'Maximum age should be greater than minimum age';
    }
    numberInRange('prefAgeMin', prefAgeMin, 18, 80, 'Minimum age must be 18 to 80');
    numberInRange('prefAgeMax', prefAgeMax, 18, 80, 'Maximum age must be 18 to 80');

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildAddressPayload = () => {
    const current = buildAddressPart(currentAddress);

    return {
      current,
      permanent: sameAsCurrent
        ? { ...current, sameAsCurrent: true }
        : { ...buildAddressPart(permanentAddress), sameAsCurrent: false },
    };
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!validate()) {
      setErrorMsg('Please fix the highlighted fields before saving');
      return;
    }

    const dobString =
      dobDay.trim() && dobMonth.trim() && dobYear.trim()
        ? `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`
        : undefined;

    // For each Tier 1 field, use the pending "Request Change" value if the user
    // opened one and typed something — otherwise fall back to the field's
    // normal current value (which is a no-op for the backend if unchanged,
    // since it only reroutes to changeRequests when the value actually differs).
    const resolvedFirstName = openRequestFields.firstName ? pendingChangeValues.firstName : firstName;
    const resolvedLastName = openRequestFields.lastName ? pendingChangeValues.lastName : lastName;
    const resolvedGender = openRequestFields.gender ? pendingChangeValues.gender : gender;
    const resolvedDobString = openRequestFields.dob && pendingChangeValues.dob
      ? pendingChangeValues.dob
      : dobString;
    const resolvedMaritalStatus = openRequestFields.maritalStatus ? pendingChangeValues.maritalStatus : maritalStatus;
    const resolvedReligion = openRequestFields.religion ? pendingChangeValues.religion : religionValue;
    const resolvedCasteId = openRequestFields.caste ? pendingChangeValues.caste : casteId;
    const resolvedSubCaste = openRequestFields.subCaste ? pendingChangeValues.subCaste : subCasteValue;

    let resolvedHeight: { feet: number; inches: number } | undefined;
    if (openRequestFields.height && pendingChangeValues.height) {
      // parsed loosely from the free-text reveal-input, e.g. `5' 8"`
      const match = pendingChangeValues.height.match(/(\d+).*?(\d+)/);
      resolvedHeight = match
        ? { feet: Number(match[1]), inches: Number(match[2]) }
        : { feet: Number(heightFeet || 0), inches: Number(heightInches || 0) };
    } else if (heightFeet || heightInches) {
      resolvedHeight = { feet: Number(heightFeet || 0), inches: Number(heightInches || 0) };
    }

    const profilePayload: any = {
      firstName: resolvedFirstName?.trim() || undefined,
      lastName: resolvedLastName?.trim() || undefined,
      gender: resolvedGender || undefined,
      dob: resolvedDobString ? new Date(resolvedDobString).toISOString() : undefined,
      maritalStatus: resolvedMaritalStatus || undefined,
      religion: resolvedReligion || undefined,
      caste: resolvedCasteId || undefined,
      subCaste: resolvedSubCaste || undefined,
      height: resolvedHeight,
      weight: weight
        ? {
            value: Number(weight),
            units: 'KG',
          }
        : undefined,
      horoscopeDetail: {
        rashi: rashi || undefined,
        nakshatra: nakshatra || undefined,
      },
      hobbiesAndInterests: selectedHobbies,
      education: {
        highestQualification: qualification,
        college,
      },
      employment: {
        employedType: employedType || undefined,
        designation: showDesignation ? designation.trim() : undefined,
        companyName: companyName.trim() || undefined,
        typeOfBusiness: isBusiness ? typeOfBusiness || undefined : undefined,
        companyLocation: companyLocation.trim() || undefined,
        annualIncome: annualIncome || undefined,
        totalExperienceYears: showExperience && expYears ? Number(expYears) : undefined,
        totalExperienceMonths: showExperience && expMonths ? Number(expMonths) : undefined,
        linkedInProfile: showLinkedIn ? linkedIn.trim() || undefined : undefined,
      },
      family: {
        fatherName,
        fatherOccupation,
        motherName,
        motherOccupation,
        brothers: Number(brothers || 0),
        sisters: Number(sisters || 0),
      },
      about: {
        aboutMe,
      },
      lifestyle: {
        diet: diet || undefined,
        smoking: smoking || undefined,
        drinking: drinking || undefined,
      },
      address: buildAddressPayload(),
    };

    if (healthCondition) {
      profilePayload.healthDisclosure = {
        hasCondition: healthCondition === 'YES',
        details: healthCondition === 'YES' ? healthConditionDetails.trim() : undefined,
      };
    }

    const preferencePayload: any = {
      ageRange:
        prefAgeMin || prefAgeMax
          ? {
              min: prefAgeMin ? Number(prefAgeMin) : undefined,
              max: prefAgeMax ? Number(prefAgeMax) : undefined,
            }
          : undefined,
      religion: prefReligionValues || undefined,
      caste: prefCasteIds || undefined,
      subCaste: prefSubCasteValues || undefined,
      education: prefEducationValues || undefined,
      profession: prefProfessionValues || undefined,
      maritalStatus: prefMaritalStatusValues || undefined,
      ressident: prefResidentValues || undefined,
    };

    try {
      setSaving(true);
      const result = await updateMyProfile(cleanPayload(profilePayload));
      await updateMyPartnerPreference(cleanPayload(preferencePayload));
      setHasChanges(false);

      const appliedFields: string[] = result?.appliedFields || [];
      const queuedFields: string[] = result?.queuedFields || [];

      let message = 'Profile updated successfully';
      if (queuedFields.length > 0) {
        message = `Profile updated. ${queuedFields.length} field${queuedFields.length > 1 ? 's' : ''} sent for admin approval.`;
      }

      Alert.alert('Success', message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#D20236" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Your Profile';
  const religionOptions = religions.length
    ? religions.map((religion) => ({ label: religion, value: religion }))
    : [
        { label: 'Hindu', value: 'Hindu' },
        { label: 'Muslim', value: 'Muslim' },
        { label: 'Christian', value: 'Christian' },
        { label: 'Jain', value: 'Jain' },
        { label: 'Sikh', value: 'Sikh' },
        { label: 'Buddhist', value: 'Buddhist' },
      ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleHeaderBack}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardWrapper>
        <View style={styles.content}>
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoWrap} onPress={pickPhoto} disabled={uploadingPhoto}>
              {uploadingPhoto ? (
                <View style={[styles.photo, styles.photoCenter]}>
                  <ActivityIndicator color="#D20236" />
                </View>
              ) : readonly.photoUrl ? (
                <Image source={{ uri: resolveImageUrl(readonly.photoUrl) }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoCenter]}>
                  <Camera color="#999" size={28} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera color="#fff" size={13} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickPhoto} disabled={uploadingPhoto}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
            {canVerifyProfilePhoto && (
              <TouchableOpacity
                style={[
                  styles.verifyProfileBtn,
                  (!readonly.photoUrl || uploadingPhoto) && styles.verifyProfileBtnDisabled,
                ]}
                onPress={openProfileVerification}
                disabled={!readonly.photoUrl || uploadingPhoto}
              >
                <Text style={styles.verifyProfileText}>Verify Profile Photo</Text>
              </TouchableOpacity>
            )}
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
              {profilePictureVerified && (
                <BadgeCheck color="#fff" size={17} fill="#D20236" />
              )}
            </View>
          </View>

          {!!errorMsg && <Text style={styles.errorBanner}>{errorMsg}</Text>}

          <Text style={styles.sectionTitle}>BASIC DETAILS</Text>
          <TieredField
            label="First Name"
            fieldState={getTierFieldState('firstName')}
            displayValue={firstName}
            requestedValue={changeRequests.find((r) => r.field === 'firstName' && r.status === 'PENDING')?.requestedValue}
            isRequestOpen={!!openRequestFields.firstName}
            requestValue={pendingChangeValues.firstName || ''}
            onOpenRequest={() => openRequestChange('firstName', firstName)}
            onChangeRequestValue={(value) => setPendingChangeValue('firstName', value)}
          >
            <EditableTextField
              label="First Name"
              value={firstName}
              placeholder="First Name"
              error={fieldErrors.firstName}
              onChangeText={(text) => {
                setFirstName(text);
                markChanged();
                clearError('firstName');
              }}
            />
          </TieredField>

          <TieredField
            label="Last Name"
            fieldState={getTierFieldState('lastName')}
            displayValue={lastName}
            requestedValue={changeRequests.find((r) => r.field === 'lastName' && r.status === 'PENDING')?.requestedValue}
            isRequestOpen={!!openRequestFields.lastName}
            requestValue={pendingChangeValues.lastName || ''}
            onOpenRequest={() => openRequestChange('lastName', lastName)}
            onChangeRequestValue={(value) => setPendingChangeValue('lastName', value)}
          >
            <EditableTextField
              label="Last Name"
              value={lastName}
              placeholder="Last Name"
              error={fieldErrors.lastName}
              onChangeText={(text) => {
                setLastName(text);
                markChanged();
                clearError('lastName');
              }}
            />
          </TieredField>

          <TieredField
            label="Gender"
            fieldState={getTierFieldState('gender')}
            displayValue={optionLabel(GENDER_OPTIONS, gender)}
            requestedValue={
              changeRequests.find((r) => r.field === 'gender' && r.status === 'PENDING')
                ? optionLabel(GENDER_OPTIONS, changeRequests.find((r) => r.field === 'gender' && r.status === 'PENDING')?.requestedValue)
                : undefined
            }
            isRequestOpen={!!openRequestFields.gender}
            requestValue={pendingChangeValues.gender || ''}
            onOpenRequest={() => openRequestChange('gender', gender)}
            onChangeRequestValue={(value) => setPendingChangeValue('gender', value)}
            requestOptions={GENDER_OPTIONS}
          >
            <Text style={styles.label}>Gender</Text>
            <SegmentedOptions
              options={GENDER_OPTIONS}
              value={gender}
              onChange={(value) => {
                setGender(value);
                markChanged();
                clearError('gender');
              }}
              error={fieldErrors.gender}
            />
          </TieredField>

          <LockedField label="Profile Type" value={profileType} />

          <TieredField
            label="Date of Birth"
            fieldState={getTierFieldState('dob')}
            displayValue={dobDisplay}
            requestedValue={changeRequests.find((r) => r.field === 'dob' && r.status === 'PENDING')?.requestedValue}
            isRequestOpen={!!openRequestFields.dob}
            requestValue={pendingChangeValues.dob || ''}
            onOpenRequest={() => {
              openRequestChange('dob', dobDisplay);
              setPendingDobDay(dobDay);
              setPendingDobMonth(dobMonth);
              setPendingDobYear(dobYear);
            }}
            onChangeRequestValue={(value) => setPendingChangeValue('dob', value)}
            requestInput={
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="Day"
                  placeholderTextColor="#999"
                  value={pendingDobDay}
                  onChangeText={(text) => {
                    setPendingDobDay(text);
                    const combined = `${pendingDobYear}-${String(pendingDobMonth).padStart(2, '0')}-${String(text).padStart(2, '0')}`;
                    setPendingChangeValue('dob', combined);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="Month"
                  placeholderTextColor="#999"
                  value={pendingDobMonth}
                  onChangeText={(text) => {
                    setPendingDobMonth(text);
                    const combined = `${pendingDobYear}-${String(text).padStart(2, '0')}-${String(pendingDobDay).padStart(2, '0')}`;
                    setPendingChangeValue('dob', combined);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="Year"
                  placeholderTextColor="#999"
                  value={pendingDobYear}
                  onChangeText={(text) => {
                    setPendingDobYear(text);
                    const combined = `${text}-${String(pendingDobMonth).padStart(2, '0')}-${String(pendingDobDay).padStart(2, '0')}`;
                    setPendingChangeValue('dob', combined);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            }
            requestError={fieldErrors.dobRequest}
          >
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.dobInput, fieldErrors.dob && styles.inputError]}
                placeholder="Day"
                placeholderTextColor="#999"
                value={dobDay}
                onChangeText={(text) => {
                  setDobDay(text);
                  markChanged();
                  clearError('dob');
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[styles.input, styles.dobInput, fieldErrors.dob && styles.inputError]}
                placeholder="Month"
                placeholderTextColor="#999"
                value={dobMonth}
                onChangeText={(text) => {
                  setDobMonth(text);
                  markChanged();
                  clearError('dob');
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[styles.input, styles.dobInput, fieldErrors.dob && styles.inputError]}
                placeholder="Year"
                placeholderTextColor="#999"
                value={dobYear}
                onChangeText={(text) => {
                  setDobYear(text);
                  markChanged();
                  clearError('dob');
                }}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            {!!fieldErrors.dob && <Text style={styles.fieldErrorText}>{fieldErrors.dob}</Text>}
          </TieredField>

          <TieredField
            label="Height"
            fieldState={getTierFieldState('height')}
            displayValue={heightFeet && heightInches ? `${heightFeet}' ${heightInches}"` : ''}
            requestedValue={changeRequests.find((r) => r.field === 'height' && r.status === 'PENDING')?.requestedValue}
            isRequestOpen={!!openRequestFields.height}
            requestValue={pendingChangeValues.height || ''}
            onOpenRequest={() => openRequestChange('height', `${heightFeet}' ${heightInches}"`)}
            onChangeRequestValue={(value) => setPendingChangeValue('height', value)}
          >
            <Text style={styles.label}>Height</Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <View style={styles.unitInputWrap}>
                  <TextInput
                    style={[styles.input, styles.unitInput, fieldErrors.heightFeet && styles.inputError]}
                    placeholder="Feet"
                    placeholderTextColor="#999"
                    value={heightFeet}
                    onChangeText={(text) => {
                      setHeightFeet(text);
                      markChanged();
                      clearError('heightFeet');
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                  <Text style={styles.unitLabel}>Ft</Text>
                </View>
                {!!fieldErrors.heightFeet && <Text style={styles.fieldErrorText}>{fieldErrors.heightFeet}</Text>}
              </View>
              <View style={styles.half}>
                <View style={styles.unitInputWrap}>
                  <TextInput
                    style={[styles.input, styles.unitInput, fieldErrors.heightInches && styles.inputError]}
                    placeholder="Inches"
                    placeholderTextColor="#999"
                    value={heightInches}
                    onChangeText={(text) => {
                      setHeightInches(text);
                      markChanged();
                      clearError('heightInches');
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.unitLabel}>In</Text>
                </View>
                {!!fieldErrors.heightInches && <Text style={styles.fieldErrorText}>{fieldErrors.heightInches}</Text>}
              </View>
            </View>
          </TieredField>

          <EditableTextField
            label="Weight"
            value={weight}
            placeholder="Enter weight"
            error={fieldErrors.weight}
            keyboardType="number-pad"
            unit="Kg"
            onChangeText={(text) => {
              setWeight(text);
              markChanged();
              clearError('weight');
            }}
          />

          <TieredField
            label="Marital Status"
            fieldState={getTierFieldState('maritalStatus')}
            displayValue={optionLabel(MARITAL_STATUS, maritalStatus)}
            requestedValue={
              changeRequests.find((r) => r.field === 'maritalStatus' && r.status === 'PENDING')
                ? optionLabel(MARITAL_STATUS, changeRequests.find((r) => r.field === 'maritalStatus' && r.status === 'PENDING')?.requestedValue)
                : undefined
            }
            isRequestOpen={!!openRequestFields.maritalStatus}
            requestValue={pendingChangeValues.maritalStatus || ''}
            onOpenRequest={() => openRequestChange('maritalStatus', maritalStatus)}
            onChangeRequestValue={(value) => setPendingChangeValue('maritalStatus', value)}
          >
            <Text style={styles.label}>Marital Status</Text>
            <SearchableDropdown
              placeholder="Select marital status"
              value={maritalStatus}
              options={MARITAL_STATUS}
              onSelect={(value) => {
                setMaritalStatus(value);
                markChanged();
              }}
            />
          </TieredField>

          <Text style={styles.label}>Rashi</Text>
          <SearchableDropdown
            placeholder="Select Rashi"
            value={rashi}
            options={RASHIS}
            onSelect={(value) => {
              setRashi(value);
              markChanged();
            }}
          />

          <Text style={styles.label}>Nakshatra</Text>
          <SearchableDropdown
            placeholder="Select Nakshatra"
            value={nakshatra}
            options={NAKSHATRAS}
            onSelect={(value) => {
              setNakshatra(value);
              markChanged();
            }}
          />

          <Text style={styles.sectionTitle}>COMMUNITY DETAILS</Text>

          <TieredField
            label="Religion"
            fieldState={getTierFieldState('religion')}
            displayValue={religionValue}
            requestedValue={changeRequests.find((r) => r.field === 'religion' && r.status === 'PENDING')?.requestedValue}
            isRequestOpen={!!openRequestFields.religion}
            requestValue={pendingChangeValues.religion || ''}
            onOpenRequest={() => openRequestChange('religion', religionValue)}
            onChangeRequestValue={(value) => setPendingChangeValue('religion', value)}
          >
            <Text style={styles.label}>Religion</Text>
            <SearchableDropdown
              placeholder="Select religion"
              value={religionValue}
              options={religionOptions}
              onSelect={(value) => {
                setReligionValue(value);
                markChanged();
              }}
            />
          </TieredField>

          <TieredField
            label="Caste"
            fieldState={getTierFieldState('caste')}
            displayValue={readonly.casteName}
            requestedValue={changeRequests.find((r) => r.field === 'caste' && r.status === 'PENDING')?.requestedValue}
            isRequestOpen={!!openRequestFields.caste}
            requestValue={pendingChangeValues.caste || ''}
            onOpenRequest={() => openRequestChange('caste', casteId)}
            onChangeRequestValue={(value) => setPendingChangeValue('caste', value)}
            requestInput={
              <SearchableDropdown
                placeholder="Select caste"
                value={pendingChangeValues.caste || ''}
                options={castes.map((c) => ({ label: c.casteName, value: c._id }))}
                onSelect={(value) => setPendingChangeValue('caste', value)}
              />
            }
          >
            <Text style={styles.label}>Caste</Text>
            <SearchableDropdown
              placeholder="Select caste"
              value={casteId}
              options={castes.map((c) => ({ label: c.casteName, value: c._id }))}
              onSelect={(value) => {
                setCasteId(value);
                setSubCasteValue('');
                markChanged();
              }}
            />
          </TieredField>

          <TieredField
            label="Sub Caste"
            fieldState={getTierFieldState('subCaste')}
            displayValue={subCasteValue}
            requestedValue={changeRequests.find((r) => r.field === 'subCaste' && r.status === 'PENDING')?.requestedValue}
            isRequestOpen={!!openRequestFields.subCaste}
            requestValue={pendingChangeValues.subCaste || ''}
            onOpenRequest={() => openRequestChange('subCaste', subCasteValue)}
            onChangeRequestValue={(value) => setPendingChangeValue('subCaste', value)}
            requestInput={
              <SearchableDropdown
                placeholder="Select sub caste"
                value={pendingChangeValues.subCaste || ''}
                options={ownSubCasteOptions}
                onSelect={(value) => setPendingChangeValue('subCaste', value)}
                allowCustom
                disabled={!ownSubCasteOptions.length}
              />
            }
          >
            <Text style={styles.label}>Sub Caste</Text>
            <SearchableDropdown
              placeholder="Select sub caste"
              value={subCasteValue}
              options={ownSubCasteOptions}
              onSelect={(value) => {
                setSubCasteValue(value);
                markChanged();
              }}
              allowCustom
              disabled={!ownSubCasteOptions.length}
            />
          </TieredField>

          <LockedField label="Mother Tongue" value={readonly.motherTongue} />

          <Text style={styles.sectionTitle}>CONTACT DETAILS</Text>
          <LockedField label="Mobile Number" value={readonly.mobile ? `+91 ${readonly.mobile}` : ''} />
          <LockedField label="Email ID" value={readonly.email} />
          <Text style={styles.hint}>To change your mobile or email, use Account Settings.</Text>

          <Text style={styles.sectionTitle}>ADDRESS</Text>
          <AddressEditor
            title="Present Address"
            address={currentAddress}
            errorPrefix="current"
            errors={fieldErrors}
            onChange={setCurrentAddressField}
          />

          <View style={styles.subSectionHeader}>
            <Text style={styles.subSectionTitle}>Permanent Address</Text>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => {
                setSameAsCurrent((prev) => !prev);
                markChanged();
              }}
            >
              <View style={[styles.checkbox, sameAsCurrent && styles.checkboxActive]}>
                {sameAsCurrent && <Check color="#fff" size={14} strokeWidth={3} />}
              </View>
              <Text style={styles.checkLabel}>Same as present</Text>
            </TouchableOpacity>
          </View>

          {!sameAsCurrent ? (
            <AddressEditor
              address={permanentAddress}
              errorPrefix="permanent"
              errors={fieldErrors}
              onChange={setPermanentAddressField}
            />
          ) : null}

          <Text style={styles.sectionTitle}>PROFESSIONAL DETAILS</Text>

          <Text style={styles.label}>Employment Type</Text>
          <SearchableDropdown
            placeholder="Select employment type"
            value={employedType}
            options={EMPLOYED_TYPES}
            onSelect={(value) => {
              setEmployedType(value);
              markChanged();
            }}
          />

          {showDesignation && (
            <EditableTextField
              label="You work as"
              value={designation}
              placeholder="Designation"
              onChangeText={(text) => {
                setDesignation(text);
                markChanged();
              }}
            />
          )}

          {isBusiness ? (
            <>
              <EditableTextField
                label="Firm Name"
                value={companyName}
                placeholder="Firm name"
                onChangeText={(text) => {
                  setCompanyName(text);
                  markChanged();
                }}
              />
              <Text style={styles.label}>Type of Business</Text>
              <SearchableDropdown
                placeholder="Select type of business"
                value={typeOfBusiness}
                options={BUSINESS_TYPES}
                onSelect={(value) => {
                  setTypeOfBusiness(value);
                  markChanged();
                }}
              />
              <EditableTextField
                label="Firm Location"
                value={companyLocation}
                placeholder="Firm location"
                onChangeText={(text) => {
                  setCompanyLocation(text);
                  markChanged();
                }}
              />
            </>
          ) : isJobType ? (
            <>
              <EditableTextField
                label="You work with"
                value={companyName}
                placeholder="Company name"
                onChangeText={(text) => {
                  setCompanyName(text);
                  markChanged();
                }}
              />
              <EditableTextField
                label="Company Location"
                value={companyLocation}
                placeholder="Enter your company location"
                onChangeText={(text) => {
                  setCompanyLocation(text);
                  markChanged();
                }}
              />
            </>
          ) : null}

          <Text style={styles.label}>Annual Income</Text>
          {isCustomIncome ? (
            <>
              <TextInput
                style={[styles.input, fieldErrors.annualIncome && styles.inputError]}
                placeholder="Enter annual income"
                placeholderTextColor="#999"
                value={annualIncome}
                onChangeText={(text) => {
                  setAnnualIncome(text);
                  markChanged();
                  clearError('annualIncome');
                }}
                keyboardType="number-pad"
              />
              {!!fieldErrors.annualIncome && <Text style={styles.fieldErrorText}>{fieldErrors.annualIncome}</Text>}
              <TouchableOpacity onPress={() => { setIsCustomIncome(false); setAnnualIncome(''); markChanged(); }}>
                <Text style={styles.linkText}>Choose from list instead</Text>
              </TouchableOpacity>
            </>
          ) : (
            <SearchableDropdown
              placeholder="Select Income Slab"
              value={annualIncome}
              options={INCOME_SLABS}
              onSelect={(value) => {
                if (value === '__other__') {
                  setIsCustomIncome(true);
                  setAnnualIncome('');
                  markChanged();
                  return;
                }
                setAnnualIncome(value);
                markChanged();
              }}
            />
          )}

          {showExperience && (
            <>
              <Text style={styles.label}>Total Experience</Text>
              {isCustomExperience ? (
                <>
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <TextInput
                        style={[styles.input, fieldErrors.totalExperience && styles.inputError]}
                        placeholder="Years"
                        placeholderTextColor="#999"
                        value={expYears}
                        onChangeText={(text) => {
                          const raw = text.replace(/\D/g, '');
                          setExpYears(raw && Number(raw) > 50 ? '50' : raw);
                          markChanged();
                          clearError('totalExperience');
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.half}>
                      <TextInput
                        style={[styles.input, fieldErrors.totalExperience && styles.inputError]}
                        placeholder="Months"
                        placeholderTextColor="#999"
                        value={expMonths}
                        onChangeText={(text) => {
                          const raw = text.replace(/\D/g, '');
                          setExpMonths(raw && Number(raw) > 11 ? '11' : raw);
                          markChanged();
                          clearError('totalExperience');
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </View>
                  {!!fieldErrors.totalExperience && <Text style={styles.fieldErrorText}>{fieldErrors.totalExperience}</Text>}
                  <TouchableOpacity
                    onPress={() => {
                      setIsCustomExperience(false);
                      setExpPreset('');
                      setExpYears('');
                      setExpMonths('');
                      markChanged();
                    }}
                  >
                    <Text style={styles.linkText}>Choose from list instead</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <SearchableDropdown
                  placeholder="Select experience"
                  value={expPreset}
                  options={EXPERIENCE_PRESETS}
                  onSelect={(value) => {
                    if (value === '__other__') {
                      setIsCustomExperience(true);
                      setExpPreset('');
                      setExpYears('');
                      setExpMonths('');
                      markChanged();
                      return;
                    }
                    const preset = EXPERIENCE_PRESETS.find((p) => p.value === value);
                    if (preset) {
                      setExpPreset(value);
                      setExpYears(String(preset.years));
                      setExpMonths(String(preset.months));
                      markChanged();
                    }
                  }}
                />
              )}
            </>
          )}

          {showLinkedIn && (
            <EditableTextField
              label="LinkedIn Profile"
              value={linkedIn}
              placeholder="https://linkedin.com/in/your-name"
              error={fieldErrors.linkedIn}
              autoCapitalize="none"
              onChangeText={(text) => {
                setLinkedIn(text);
                markChanged();
                clearError('linkedIn');
              }}
            />
          )}

          <Text style={styles.sectionTitle}>EDUCATION DETAILS</Text>
          <Text style={styles.label}>Highest Qualification</Text>
          <SearchableDropdown
            placeholder="Select or type qualification"
            value={qualification}
            options={EDUCATION_OPTIONS}
            allowCustom
            onSelect={(value) => {
              setQualification(value);
              markChanged();
            }}
          />
          <EditableTextField
            label="University / College"
            value={college}
            placeholder="College name"
            onChangeText={(text) => {
              setCollege(text);
              markChanged();
            }}
          />

          <Text style={styles.sectionTitle}>LIFESTYLE & HEALTH</Text>
          <Text style={styles.label}>Diet</Text>
          <SearchableDropdown
            placeholder="Select diet"
            value={diet}
            options={DIET_OPTIONS}
            onSelect={(value) => {
              setDiet(value);
              markChanged();
            }}
          />
          <Text style={styles.label}>Smoking</Text>
          <SearchableDropdown
            placeholder="Select smoking"
            value={smoking}
            options={YES_NO_OCCASIONAL}
            onSelect={(value) => {
              setSmoking(value);
              markChanged();
            }}
          />
          <Text style={styles.label}>Drinking</Text>
          <SearchableDropdown
            placeholder="Select drinking"
            value={drinking}
            options={YES_NO_OCCASIONAL}
            onSelect={(value) => {
              setDrinking(value);
              markChanged();
            }}
          />
          <Text style={styles.label}>Ongoing health condition</Text>
          <SegmentedOptions
            options={HEALTH_CONDITION_OPTIONS}
            value={healthCondition}
            onChange={(value) => {
              setHealthCondition(value);
              if (value === 'NO') {
                setHealthConditionDetails('');
                clearError('healthConditionDetails');
              }
              markChanged();
            }}
          />
          {healthCondition === 'YES' ? (
            <>
              <Text style={styles.label}>Brief health note</Text>
              <TextInput
                style={[styles.textArea, fieldErrors.healthConditionDetails && styles.inputError]}
                placeholder="Briefly describe the condition or any relevant support needs"
                placeholderTextColor="#999"
                value={healthConditionDetails}
                onChangeText={(text) => {
                  setHealthConditionDetails(text.slice(0, 500));
                  markChanged();
                  clearError('healthConditionDetails');
                }}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              {!!fieldErrors.healthConditionDetails && (
                <Text style={styles.fieldErrorText}>{fieldErrors.healthConditionDetails}</Text>
              )}
              <Text style={styles.counter}>{healthConditionDetails.length}/500</Text>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>FAMILY DETAILS</Text>
          <EditableTextField
            label="Father Name"
            value={fatherName}
            placeholder="Father's name"
            onChangeText={(text) => {
              setFatherName(text);
              markChanged();
            }}
          />
          <EditableTextField
            label="Father Occupation"
            value={fatherOccupation}
            placeholder="Occupation"
            onChangeText={(text) => {
              setFatherOccupation(text);
              markChanged();
            }}
          />
          <EditableTextField
            label="Mother Name"
            value={motherName}
            placeholder="Mother's name"
            onChangeText={(text) => {
              setMotherName(text);
              markChanged();
            }}
          />
          <EditableTextField
            label="Mother Occupation"
            value={motherOccupation}
            placeholder="Occupation"
            onChangeText={(text) => {
              setMotherOccupation(text);
              markChanged();
            }}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <EditableTextField
                label="Brother"
                value={brothers}
                placeholder="0"
                error={fieldErrors.brothers}
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={(text) => {
                  setBrothers(text);
                  markChanged();
                  clearError('brothers');
                }}
              />
            </View>
            <View style={styles.half}>
              <EditableTextField
                label="Sister"
                value={sisters}
                placeholder="0"
                error={fieldErrors.sisters}
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={(text) => {
                  setSisters(text);
                  markChanged();
                  clearError('sisters');
                }}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>HOBBIES & INTERESTS</Text>
          {HOBBY_GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <ChipWrap
                options={group.options.map((option) => ({ label: option, value: option }))}
                selected={selectedHobbies}
                onToggle={toggleHobby}
              />
            </View>
          ))}

          <Text style={styles.sectionTitle}>ABOUT ME</Text>
          <TextInput
            style={[styles.textArea, fieldErrors.aboutMe && styles.inputError]}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#999"
            value={aboutMe}
            onChangeText={(text) => {
              setAboutMe(text.slice(0, 2000));
              markChanged();
              clearError('aboutMe');
            }}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={2000}
          />
          {!!fieldErrors.aboutMe && <Text style={styles.fieldErrorText}>{fieldErrors.aboutMe}</Text>}
          <Text style={styles.counter}>{aboutMe.length}/2000</Text>

          <Text style={styles.sectionTitle}>PARTNER PREFERENCES</Text>
          <Text style={styles.label}>Preferred Age Range</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <TextInput
                style={[styles.input, fieldErrors.prefAgeMin && styles.inputError]}
                placeholder="Min"
                placeholderTextColor="#999"
                value={prefAgeMin}
                onChangeText={(text) => {
                  setPrefAgeMin(text);
                  markChanged();
                  clearError('prefAgeMin');
                  clearError('prefAgeMax');
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.half}>
              <TextInput
                style={[styles.input, fieldErrors.prefAgeMax && styles.inputError]}
                placeholder="Max"
                placeholderTextColor="#999"
                value={prefAgeMax}
                onChangeText={(text) => {
                  setPrefAgeMax(text);
                  markChanged();
                  clearError('prefAgeMin');
                  clearError('prefAgeMax');
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          {!!fieldErrors.prefAgeMin && <Text style={styles.fieldErrorText}>{fieldErrors.prefAgeMin}</Text>}
          {!!fieldErrors.prefAgeMax && fieldErrors.prefAgeMax !== fieldErrors.prefAgeMin && (
            <Text style={styles.fieldErrorText}>{fieldErrors.prefAgeMax}</Text>
          )}

          <MultiSelectField
            label="Preferred Religion"
            placeholder="Select preferred religion"
            options={religionOptions}
            selected={prefReligionValues}
            onChange={setPreferredReligions}
          />
          <MultiSelectField
            label="Preferred Caste"
            placeholder="Select preferred caste"
            options={preferredCasteOptions}
            selected={prefCasteIds}
            onChange={setPreferredCastes}
          />
          <MultiSelectField
            label="Preferred Sub Caste"
            placeholder="Select preferred sub caste"
            options={preferredSubCasteOptions}
            selected={prefSubCasteValues}
            onChange={(values) => {
              setPrefSubCasteValues(values);
              markChanged();
            }}
            disabled={!prefCasteIds.length}
          />
          <MultiSelectField
            label="Preferred Education"
            placeholder="Select preferred education"
            options={EDUCATION_OPTIONS}
            selected={prefEducationValues}
            onChange={(values) => {
              setPrefEducationValues(values);
              markChanged();
            }}
          />
          <MultiSelectField
            label="Preferred Profession"
            placeholder="Select preferred profession"
            options={PROFESSION_OPTIONS}
            selected={prefProfessionValues}
            onChange={(values) => {
              setPrefProfessionValues(values);
              markChanged();
            }}
          />
          <MultiSelectField
            label="Preferred Marital Status"
            placeholder="Select preferred marital status"
            options={MARITAL_STATUS}
            selected={prefMaritalStatusValues}
            onChange={(values) => {
              setPrefMaritalStatusValues(values);
              markChanged();
            }}
          />
          <MultiSelectField
            label="Preferred Resident"
            placeholder="Select preferred resident"
            options={RESIDENT_OPTIONS}
            selected={prefResidentValues}
            onChange={(values) => {
              setPrefResidentValues(values);
              markChanged();
            }}
          />

          {!!errorMsg && <Text style={styles.errorBanner}>{errorMsg}</Text>}

          <TouchableOpacity
            style={[styles.saveChangesBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveChangesText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

function EditableTextField({
  label,
  value,
  placeholder,
  error,
  onChangeText,
  keyboardType,
  maxLength,
  autoCapitalize,
  unit,
}: {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  unit?: string;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.unitInputWrap}>
        <TextInput
          style={[styles.input, styles.unitInput, error && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
        />
        {!!unit && <Text style={styles.unitLabel}>{unit}</Text>}
      </View>
      {!!error && <Text style={styles.fieldErrorText}>{error}</Text>}
    </>
  );
}

function LockedField({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <View style={compact ? styles.lockedCompactWrap : styles.fieldWrap}>
      <View style={styles.lockedLabelRow}>
        <Text style={styles.label}>{label}</Text>
        <Lock color="#9aa1ad" size={14} />
      </View>
      <View style={styles.lockedBox}>
        <Text style={styles.lockedText} numberOfLines={2}>{value || '-'}</Text>
      </View>
    </View>
  );
}

function TieredField({
  label,
  fieldState,
  displayValue,
  requestedValue,
  isRequestOpen,
  requestValue,
  onOpenRequest,
  onChangeRequestValue,
  requestOptions,
  requestInput,
  requestError,
  children,
}: {
  label: string;
  fieldState: 'UNLOCKED' | 'LOCKED_NO_REQUEST' | 'LOCKED_PENDING';
  displayValue: string;
  requestedValue?: any;
  isRequestOpen: boolean;
  requestValue: string;
  onOpenRequest: () => void;
  onChangeRequestValue: (value: string) => void;
  requestOptions?: Option[]; // if set, shows a picker instead of free-text for the request-change input
  requestInput?: React.ReactNode; // if set, shows this custom input instead of free-text/options (highest priority)
  requestError?: string; // validation error shown under the request-change input
  children: React.ReactNode; // the normal editable input, rendered when UNLOCKED
}) {
  if (fieldState === 'UNLOCKED') {
    return <>{children}</>;
  }

  return (
    <View style={styles.fieldWrap}>
      <View style={styles.lockedLabelRow}>
        <Text style={styles.label}>{label}</Text>
        <Lock color="#9aa1ad" size={14} />
      </View>
      <View style={styles.lockedBox}>
        <Text style={styles.lockedText} numberOfLines={2}>{displayValue || '-'}</Text>
      </View>

      {fieldState === 'LOCKED_PENDING' ? (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>
            Pending Approval{requestedValue ? `: "${requestedValue}"` : ''}
          </Text>
        </View>
      ) : isRequestOpen ? (
        <>
          {requestInput ? (
            requestInput
          ) : requestOptions ? (
            <SegmentedOptions
              options={requestOptions}
              value={requestValue}
              onChange={onChangeRequestValue}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder={`New ${label}`}
              placeholderTextColor="#999"
              value={requestValue}
              onChangeText={onChangeRequestValue}
            />
          )}
          {!!requestError && <Text style={styles.fieldErrorText}>{requestError}</Text>}
        </>
      ) : (
        <TouchableOpacity style={styles.requestChangeBtn} onPress={onOpenRequest}>
          <Text style={styles.requestChangeText}>Request Change</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SegmentedOptions({
  options,
  value,
  onChange,
  error,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <>
      <View style={[styles.toggleRow, error && styles.toggleRowError]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.toggle, value === option.value && styles.toggleActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.toggleText, value === option.value && styles.toggleTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {!!error && <Text style={styles.fieldErrorText}>{error}</Text>}
    </>
  );
}

function AddressEditor({
  title,
  address,
  errorPrefix,
  errors,
  onChange,
}: {
  title?: string;
  address: AddressFields;
  errorPrefix: 'current' | 'permanent';
  errors: Record<string, string>;
  onChange: (key: keyof AddressFields, value: string) => void;
}) {
  const isIndia = address.residenceType === 'INDIA';
  const errorKey = (key: keyof AddressFields) => `${errorPrefix}${String(key)}`;

  return (
    <View style={styles.addressBlock}>
      {!!title && <Text style={styles.subSectionTitle}>{title}</Text>}
      <Text style={styles.label}>Residence Type</Text>
      <View style={styles.toggleRow}>
        {RESIDENCE_TYPES.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.toggle, address.residenceType === option.value && styles.toggleActive]}
            onPress={() => onChange('residenceType', option.value)}
          >
            <Text style={[styles.toggleText, address.residenceType === option.value && styles.toggleTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <EditableTextField
        label="Address Line 1"
        value={address.addressLine1}
        placeholder="House no, street, area"
        onChangeText={(value) => onChange('addressLine1', value)}
      />

      {isIndia ? (
        <>
          <EditableTextField
            label="Taluka"
            value={address.taluka}
            placeholder="Taluka"
            onChangeText={(value) => onChange('taluka', value)}
          />
          <EditableTextField
            label="District"
            value={address.district}
            placeholder="District"
            onChangeText={(value) => onChange('district', value)}
          />
          <Text style={styles.label}>State</Text>
          <SearchableDropdown
            placeholder="Select state"
            value={address.state}
            options={INDIAN_STATE_OPTIONS}
            onSelect={(value) => onChange('state', value)}
          />
          <EditableTextField
            label="Pincode"
            value={address.pincode}
            placeholder="6-digit pincode"
            error={errors[errorKey('pincode')]}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) => onChange('pincode', value)}
          />
        </>
      ) : (
        <>
          <EditableTextField
            label="Country"
            value={address.country}
            placeholder="Country"
            onChangeText={(value) => onChange('country', value)}
          />
          <EditableTextField
            label="State / Province"
            value={address.stateOrProvince}
            placeholder="State or Province"
            onChangeText={(value) => onChange('stateOrProvince', value)}
          />
          <EditableTextField
            label="City"
            value={address.city}
            placeholder="City"
            onChangeText={(value) => onChange('city', value)}
          />
          <EditableTextField
            label="Postal Code"
            value={address.postalCode}
            placeholder="Postal code"
            keyboardType="number-pad"
            maxLength={12}
            onChangeText={(value) => onChange('postalCode', value)}
          />
        </>
      )}
    </View>
  );
}

function ChipWrap({
  options,
  selected,
  onToggle,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(option.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MultiSelectField({
  label,
  placeholder,
  options,
  selected,
  onChange,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedLabels = selected
    .map((value) => options.find((option) => option.value === value)?.label || value)
    .filter(Boolean);
  const filteredOptions = search
    ? options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggleValue = (value: string) => {
    onChange(selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]);
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.multiField, disabled && styles.multiFieldDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.75}
      >
        <Text
          style={[styles.multiText, !selectedLabels.length && styles.placeholder]}
          numberOfLines={2}
        >
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </Text>
        <ChevronDown color={disabled ? '#b5bac3' : '#666'} size={18} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.multiModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X color="#333" size={20} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              style={styles.optionList}
              renderItem={({ item }) => {
                const active = selected.includes(item.value);
                return (
                  <TouchableOpacity style={styles.optionRow} onPress={() => toggleValue(item.value)}>
                    <Text style={styles.optionText}>{item.label}</Text>
                    <View style={[styles.optionCheck, active && styles.optionCheckActive]}>
                      {active && <Check color="#fff" size={14} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No options found</Text>}
            />
            <TouchableOpacity style={styles.doneBtn} onPress={() => setOpen(false)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  saveBtn: { backgroundColor: '#D20236', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnDisabled: { backgroundColor: '#e9a9b6' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  photoSection: { alignItems: 'center', paddingVertical: 20 },
  photoWrap: { position: 'relative' },
  photo: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#D20236' },
  photoCenter: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: { fontSize: 13, fontWeight: '600', color: '#D20236', marginTop: 8 },
  verifyProfileBtn: {
    minWidth: 150,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 18,
  },
  verifyProfileBtnDisabled: { backgroundColor: '#e9a9b6' },
  verifyProfileText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    maxWidth: '90%',
    marginTop: 10,
  },
  profileName: { flexShrink: 1, fontSize: 16, fontWeight: '700', color: '#000' },
  sectionTitle: {
    fontSize: 12,
    color: '#8b919c',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
  },
  subSectionHeader: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 18,
    marginTop: 8,
    marginBottom: 4,
  },
  subSectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 4 },
  hint: { fontSize: 11, color: '#999', marginTop: -8, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    marginBottom: 12,
  },
  unitInputWrap: { position: 'relative', justifyContent: 'center' },
  unitInput: { paddingRight: 44 },
  unitLabel: {
    position: 'absolute',
    right: 14,
    top: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#000',
    textAlignVertical: 'top',
    minHeight: 110,
  },
  counter: { alignSelf: 'flex-end', color: '#999', fontSize: 11, marginTop: 6, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  half: { flex: 1 },
  fieldWrap: { marginBottom: 14 },
  lockedCompactWrap: { marginBottom: 0 },
  lockedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  lockedBox: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#dfe3ea',
    borderRadius: 10,
    backgroundColor: '#f4f5f7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockedText: { fontSize: 14, color: '#5f6773', fontWeight: '600' },
  requestChangeBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  requestChangeText: { fontSize: 13, fontWeight: '700', color: '#D20236' },
  pendingBadge: {
    marginTop: 8,
    backgroundColor: '#fff4e5',
    borderWidth: 1,
    borderColor: '#f0c896',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  pendingBadgeText: { fontSize: 12, fontWeight: '600', color: '#8a5a00' },
  toggleRow: { flexDirection: 'row', marginBottom: 12, gap: 10 },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  toggleText: { fontSize: 14, color: '#333' },
  toggleTextActive: { color: '#D20236', fontWeight: '700' },
  toggleRowError: { borderWidth: 1.5, borderColor: '#D20236', borderRadius: 10, padding: 4 },
  dobInput: { flex: 1 },
   errorBanner: { fontSize: 13, color: '#D20236', fontWeight: '500', marginVertical: 10 },
  linkText: { color: '#D20236', fontSize: 13, fontWeight: '600', marginTop: -8, marginBottom: 14 },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  fieldErrorText: { fontSize: 11, color: '#D20236', marginTop: -8, marginBottom: 10, fontWeight: '500' },
  addressBlock: { marginBottom: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#c8ccd3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  checkLabel: { fontSize: 14, color: '#333', fontWeight: '600' },
  group: { marginBottom: 14 },
  groupTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 30,
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#D20236', fontWeight: '600' },
  multiField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  multiFieldDisabled: { backgroundColor: '#f5f5f5' },
  multiText: { flex: 1, fontSize: 14, color: '#000', marginRight: 10 },
  placeholder: { color: '#999' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'flex-end',
  },
  multiModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    maxHeight: '78%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, color: '#111', fontWeight: '700' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
  },
  optionList: { maxHeight: 330 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  optionText: { flex: 1, fontSize: 15, color: '#333', marginRight: 12 },
  optionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#c8ccd3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 20 },
  doneBtn: {
    backgroundColor: '#D20236',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  doneText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  saveChangesBtn: { backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  saveChangesText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
