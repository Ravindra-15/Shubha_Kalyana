import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  Image, Alert, BackHandler, PermissionsAndroid, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, BadgeCheck, Camera } from 'lucide-react-native';
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
import { resolveImageUrl } from '../../utils/imageUrl';

const MARITAL_STATUS = [
  { label: 'Never Married', value: 'NEVER_MARRIED' },
  { label: 'Divorced', value: 'DIVORCED' },
  { label: 'Widowed', value: 'WIDOWED' },
  { label: 'Awaiting Divorce', value: 'AWAITING_DIVORCE' },
];

const RASHIS = [
  'MESHA', 'VRISHABHA', 'MITHUNA', 'KARKA', 'SIMHA', 'KANYA',
  'TULA', 'VRISCHIKA', 'DHANU', 'MAKARA', 'KUMBHA', 'MEENA',
].map((r) => ({ label: r.charAt(0) + r.slice(1).toLowerCase(), value: r }));

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
].map((n) => ({ label: n, value: n }));

const EMPLOYED_TYPES = [
  { label: 'Government', value: 'GOVERNMENT' },
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Self Employed', value: 'SELF_EMPLOYED' },
  { label: 'Not Working', value: 'NOT_WORKING' },
];

const DIET_OPTIONS = [
  { label: 'Veg', value: 'VEG' },
  { label: 'Non Veg', value: 'NON_VEG' },
  { label: 'Eggitarian', value: 'EGGITARIAN' },
  { label: 'Jain', value: 'JAIN' },
  { label: 'Vegan', value: 'VEGAN' },
];

const YES_NO_OCCASIONAL = [
  { label: 'No', value: 'NO' },
  { label: 'Yes', value: 'YES' },
  { label: 'Occasionally', value: 'OCCASIONALLY' },
];

const RESIDENCE_TYPES = [
  { label: 'India', value: 'INDIA' },
  { label: 'NRI', value: 'NRI' },
];

const isValidPincode = (v: string) => !v || /^\d{6}$/.test(v);
const isValidLinkedIn = (v: string) => !v || /linkedin\.com/i.test(v);

export default function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // read-only display data (backend doesn't support editing these yet)
  const [readonly, setReadonly] = useState({
    religion: '', casteName: '', subCaste: '', motherTongue: '',
    mobile: '', email: '', photoUrl: '',
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  // editable fields
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [rashi, setRashi] = useState('');
  const [nakshatra, setNakshatra] = useState('');

  const [addrResidenceType, setAddrResidenceType] = useState<'INDIA' | 'NRI'>('INDIA');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrTaluka, setAddrTaluka] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrCountry, setAddrCountry] = useState('');
  const [addrStateOrProvince, setAddrStateOrProvince] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');

  const [qualification, setQualification] = useState('');
  const [college, setCollege] = useState('');

  const [employedType, setEmployedType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [totalExperience, setTotalExperience] = useState('');
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

  const [aboutMe, setAboutMe] = useState('');

  // partner preferences
  const [prefAgeMin, setPrefAgeMin] = useState('');
  const [prefAgeMax, setPrefAgeMax] = useState('');
  const [prefCasteIds, setPrefCasteIds] = useState<string[]>([]);
  const [prefEducation, setPrefEducation] = useState('');
  const [prefProfession, setPrefProfession] = useState('');

  const [hasChanges, setHasChanges] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [profilePictureVerified, setProfilePictureVerified] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyFullProfile();

      const user = data?.user || {};
      const profile = data?.profile || {};
      const basic = profile.basicInfo || {};
      const pref = data?.partnerPreference || {};

      const photo = profile.photos?.find((p: any) => p.isProfilePhoto)?.url || profile.photos?.[0]?.url || '';
      const casteName = basic.caste?.casteName || '';

      setReadonly({
        religion: basic.religion || '',
        casteName,
        subCaste: basic.subCaste || '',
        motherTongue: basic.motherTongue || '',
        mobile: user.mobile || '',
        email: user.email || '',
        photoUrl: photo,
      });

      setFirstName(basic.firstName || user.firstName || '');
      setLastName(basic.lastName || user.lastName || '');
      setGender(basic.gender || '');
      if (basic.dob) {
        const d = new Date(basic.dob);
        setDobDay(String(d.getDate()));
        setDobMonth(String(d.getMonth() + 1));
        setDobYear(String(d.getFullYear()));
      }

      setHeightFeet(basic.height?.feet ? String(basic.height.feet) : '');
      setHeightInches(basic.height?.inches ? String(basic.height.inches) : '');
      setWeight(basic.weight?.value ? String(basic.weight.value) : '');
      setMaritalStatus(basic.maritalStatus || '');
      setRashi(profile.horoscopeDetail?.rashi || '');
      setNakshatra(profile.horoscopeDetail?.nakshatra || '');

      const cur = profile.address?.current || {};
      setAddrResidenceType(cur.residenceType || 'INDIA');
      setAddrLine1(cur.addressLine1 || '');
      setAddrTaluka(cur.taluka || '');
      setAddrDistrict(cur.district || '');
      setAddrState(cur.state || '');
      setAddrPincode(cur.pincode || '');
      setAddrCountry(cur.country || '');
      setAddrStateOrProvince(cur.stateOrProvince || '');
      setAddrCity(cur.city || '');
      setAddrPostalCode(cur.postalCode || '');

      setQualification(profile.education?.highestQualification || '');
      setCollege(profile.education?.college || '');

      setEmployedType(profile.employment?.employedType || '');
      setCompanyName(profile.employment?.companyName || '');
      setDesignation(profile.employment?.designation || '');
      setAnnualIncome(profile.employment?.annualIncome ? String(profile.employment.annualIncome) : '');
      setCompanyLocation(profile.employment?.companyLocation || '');
      setTotalExperience(profile.employment?.totalExperience ? String(profile.employment.totalExperience) : '');
      setLinkedIn(profile.employment?.linkedInProfile || '');

      setFatherName(profile.family?.fatherName || '');
      setMotherName(profile.family?.motherName || '');
      setFatherOccupation(profile.family?.fatherOccupation || '');
      setMotherOccupation(profile.family?.motherOccupation || '');
      setBrothers(profile.family?.brothers !== undefined ? String(profile.family.brothers) : '');
      setSisters(profile.family?.sisters !== undefined ? String(profile.family.sisters) : '');

      setDiet(profile.lifestyle?.diet || '');
      setSmoking(profile.lifestyle?.smoking || '');
      setDrinking(profile.lifestyle?.drinking || '');

      setAboutMe(profile.about?.aboutMe || '');

      setPrefAgeMin(pref.ageRange?.min ? String(pref.ageRange.min) : '');
      setPrefAgeMax(pref.ageRange?.max ? String(pref.ageRange.max) : '');
      setPrefCasteIds((pref.caste || []).map((c: any) => c._id || c));
      setPrefEducation((pref.education || []).join(', '));
      setPrefProfession((pref.profession || []).join(', '));

      setProfilePictureVerified(isProfilePictureVerified(profile));
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
    }, [load])
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
            ]
          );
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [hasChanges, navigation])
  );

  const handleHeaderBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const markChanged = () => setHasChanges(true);

  const openProfileVerification = () => {
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

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      return Alert.alert('Too large', 'Image must be under 5MB');
    }

    try {
      setUploadingPhoto(true);
      const updated = await uploadMyProfilePhoto({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
      });
      const newPhoto = updated?.profile?.photos?.find((p: any) => p.isProfilePhoto)?.url || updated?.profile?.photos?.[0]?.url;
      if (newPhoto) {
        setReadonly((prev) => ({ ...prev, photoUrl: newPhoto }));
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

    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (!/^[a-zA-Z\s'-]+$/.test(firstName.trim())) {
      errors.firstName = 'Only letters allowed';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (!/^[a-zA-Z\s'-]+$/.test(lastName.trim())) {
      errors.lastName = 'Only letters allowed';
    }

    if (!gender) {
      errors.gender = 'Gender is required';
    }

    if (!dobDay.trim() || !dobMonth.trim() || !dobYear.trim()) {
      errors.dob = 'Date of birth is required';
    } else {
      const dd = parseInt(dobDay, 10);
      const mm = parseInt(dobMonth, 10);
      const yy = parseInt(dobYear, 10);

      if (mm < 1 || mm > 12) {
        errors.dob = 'Month must be between 1 and 12';
      } else {
        const daysInMonth = new Date(yy, mm, 0).getDate();
        if (dd < 1 || dd > daysInMonth) {
          errors.dob = `Day must be between 1 and ${daysInMonth}`;
        } else {
          const currentYear = new Date().getFullYear();
          if (yy < 1900 || yy > currentYear) {
            errors.dob = 'Enter a valid year';
          } else {
            const dobDate = new Date(yy, mm - 1, dd);
            const today = new Date();
            if (dobDate > today) {
              errors.dob = 'Date of birth cannot be in the future';
            } else {
              let age = today.getFullYear() - dobDate.getFullYear();
              const mDiff = today.getMonth() - dobDate.getMonth();
              if (mDiff < 0 || (mDiff === 0 && today.getDate() < dobDate.getDate())) age--;
              if (age < 18) {
                errors.dob = 'Must be at least 18 years old';
              }
            }
          }
        }
      }
    }

    if (heightFeet.trim() && (Number(heightFeet) < 1 || Number(heightFeet) > 8)) {
      errors.heightFeet = 'Must be 1-8';
    }
    if (heightInches.trim() && (Number(heightInches) < 0 || Number(heightInches) > 11)) {
      errors.heightInches = 'Must be 0-11';
    }
    if (weight.trim() && (Number(weight) < 20 || Number(weight) > 300)) {
      errors.weight = 'Weight must be between 20-300 kg';
    }
    if (addrPincode.trim() && !isValidPincode(addrPincode.trim())) {
      errors.addrPincode = 'Pincode must be 6 digits';
    }
    if (annualIncome.trim() && Number(annualIncome) < 0) {
      errors.annualIncome = 'Enter a valid amount';
    }
    if (totalExperience.trim() && (Number(totalExperience) < 0 || Number(totalExperience) > 50)) {
      errors.totalExperience = 'Must be between 0-50 years';
    }
    if (linkedIn.trim() && !isValidLinkedIn(linkedIn.trim())) {
      errors.linkedIn = 'Enter a valid LinkedIn URL';
    }
    if (brothers.trim() && (Number(brothers) < 0 || Number(brothers) > 14)) {
      errors.brothers = 'Must be between 0-14';
    }
    if (sisters.trim() && (Number(sisters) < 0 || Number(sisters) > 14)) {
      errors.sisters = 'Must be between 0-14';
    }
    if (prefAgeMin.trim() && prefAgeMax.trim()) {
      const mn = Number(prefAgeMin), mx = Number(prefAgeMax);
      if (mn < 18 || mx > 100 || mn > mx) {
        errors.prefAgeMin = 'Invalid range (18-100, min ≤ max)';
        errors.prefAgeMax = 'Invalid range (18-100, min ≤ max)';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!validate()) {
      setErrorMsg('Please fix the highlighted fields before saving');
      return;
    }

    const dobString = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;

    const profilePayload: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender,
      dob: dobString,
      height: { feet: Number(heightFeet) || 0, inches: Number(heightInches) || 0 },
      weight: { value: Number(weight) || 0, units: 'KG' },
      maritalStatus: maritalStatus || '',
      horoscopeDetail: { rashi: rashi || '', nakshatra: nakshatra || '' },
      address: {
        current: {
          residenceType: addrResidenceType,
          addressLine1: addrLine1.trim(),
          taluka: addrTaluka.trim(),
          district: addrDistrict.trim(),
          state: addrState.trim(),
          pincode: addrPincode.trim(),
          country: addrCountry.trim() || 'India',
          stateOrProvince: addrStateOrProvince.trim(),
          city: addrCity.trim(),
          postalCode: addrPostalCode.trim(),
        },
      },
      education: {
        highestQualification: qualification.trim(),
        college: college.trim(),
      },
      employment: {
        employedType: employedType || '',
        companyName: companyName.trim(),
        designation: designation.trim(),
        annualIncome: Number(annualIncome) || 0,
        companyLocation: companyLocation.trim(),
        totalExperience: Number(totalExperience) || 0,
        linkedInProfile: linkedIn.trim(),
      },
      family: {
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        fatherOccupation: fatherOccupation.trim(),
        motherOccupation: motherOccupation.trim(),
        brothers: brothers.trim() ? Number(brothers) : 0,
        sisters: sisters.trim() ? Number(sisters) : 0,
      },
      lifestyle: {
        diet: diet || '',
        smoking: smoking || '',
        drinking: drinking || '',
      },
      about: { aboutMe: aboutMe.trim() },
    };

    const preferencePayload: any = {
      ageRange: prefAgeMin.trim() && prefAgeMax.trim() ? { min: Number(prefAgeMin), max: Number(prefAgeMax) } : undefined,
      caste: prefCasteIds,
      education: prefEducation.trim() ? prefEducation.split(',').map((s) => s.trim()).filter(Boolean) : [],
      profession: prefProfession.trim() ? prefProfession.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };

    try {
      setSaving(true);
      await updateMyProfile(profilePayload);
      await updateMyPartnerPreference(preferencePayload);
      setHasChanges(false);
      Alert.alert('Success', 'Profile updated successfully', [
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
          {/* Photo */}
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
            <TouchableOpacity
              style={[
                styles.verifyProfileBtn,
                (!readonly.photoUrl || uploadingPhoto) && styles.verifyProfileBtnDisabled,
              ]}
              onPress={openProfileVerification}
              disabled={!readonly.photoUrl || uploadingPhoto}
            >
              <Text style={styles.verifyProfileText}>Verify Profile</Text>
            </TouchableOpacity>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
              {profilePictureVerified && (
                <BadgeCheck color="#fff" size={17} fill="#D20236" />
              )}
            </View>
          </View>

          {!!errorMsg && <Text style={styles.errorBanner}>{errorMsg}</Text>}

          {/* Basic Details */}
          <Text style={styles.sectionTitle}>BASIC DETAILS</Text>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={[styles.input, fieldErrors.firstName && styles.inputError]}
            placeholder="First Name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={(t) => { setFirstName(t); markChanged(); setFieldErrors((e) => ({ ...e, firstName: '' })); }}
          />
          {!!fieldErrors.firstName && <Text style={styles.fieldErrorText}>{fieldErrors.firstName}</Text>}

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={[styles.input, fieldErrors.lastName && styles.inputError]}
            placeholder="Last Name"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={(t) => { setLastName(t); markChanged(); setFieldErrors((e) => ({ ...e, lastName: '' })); }}
          />
          {!!fieldErrors.lastName && <Text style={styles.fieldErrorText}>{fieldErrors.lastName}</Text>}

          <Text style={styles.label}>Gender</Text>
          <View style={[styles.toggleRow, fieldErrors.gender && styles.toggleRowError]}>
            {['MALE', 'FEMALE', 'OTHER'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.toggle, gender === g && styles.toggleActive]}
                onPress={() => { setGender(g); markChanged(); setFieldErrors((e) => ({ ...e, gender: '' })); }}
              >
                <Text style={[styles.toggleText, gender === g && styles.toggleTextActive]}>
                  {g.charAt(0) + g.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {!!fieldErrors.gender && <Text style={styles.fieldErrorText}>{fieldErrors.gender}</Text>}

          <Text style={styles.label}>Date of Birth</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.dobInput, fieldErrors.dob && styles.inputError]}
              placeholder="Day"
              placeholderTextColor="#999"
              value={dobDay}
              onChangeText={(t) => { setDobDay(t); markChanged(); setFieldErrors((e) => ({ ...e, dob: '' })); }}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.dobInput, fieldErrors.dob && styles.inputError]}
              placeholder="Month"
              placeholderTextColor="#999"
              value={dobMonth}
              onChangeText={(t) => { setDobMonth(t); markChanged(); setFieldErrors((e) => ({ ...e, dob: '' })); }}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.dobInput, fieldErrors.dob && styles.inputError]}
              placeholder="Year"
              placeholderTextColor="#999"
              value={dobYear}
              onChangeText={(t) => { setDobYear(t); markChanged(); setFieldErrors((e) => ({ ...e, dob: '' })); }}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          {!!fieldErrors.dob && <Text style={styles.fieldErrorText}>{fieldErrors.dob}</Text>}

          <Text style={styles.label}>Height</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <TextInput
                style={[styles.input, fieldErrors.heightFeet && styles.inputError]}
                placeholder="Feet"
                placeholderTextColor="#999"
                value={heightFeet}
                onChangeText={(t) => { setHeightFeet(t); markChanged(); setFieldErrors((e) => ({ ...e, heightFeet: '' })); }}
                keyboardType="number-pad"
                maxLength={1}
              />
              {!!fieldErrors.heightFeet && <Text style={styles.fieldErrorText}>{fieldErrors.heightFeet}</Text>}
            </View>
            <View style={styles.half}>
              <TextInput
                style={[styles.input, fieldErrors.heightInches && styles.inputError]}
                placeholder="Inches"
                placeholderTextColor="#999"
                value={heightInches}
                onChangeText={(t) => { setHeightInches(t); markChanged(); setFieldErrors((e) => ({ ...e, heightInches: '' })); }}
                keyboardType="number-pad"
                maxLength={2}
              />
              {!!fieldErrors.heightInches && <Text style={styles.fieldErrorText}>{fieldErrors.heightInches}</Text>}
            </View>
          </View>

          <Text style={styles.label}>Weight (KG)</Text>
          <TextInput
            style={[styles.input, fieldErrors.weight && styles.inputError]}
            placeholder="Enter weight"
            placeholderTextColor="#999"
            value={weight}
            onChangeText={(t) => { setWeight(t); markChanged(); setFieldErrors((e) => ({ ...e, weight: '' })); }}
            keyboardType="number-pad"
          />
          {!!fieldErrors.weight && <Text style={styles.fieldErrorText}>{fieldErrors.weight}</Text>}

          <Text style={styles.label}>Marital Status</Text>
          <SearchableDropdown
            placeholder="Select marital status"
            value={maritalStatus}
            options={MARITAL_STATUS}
            onSelect={(v) => { setMaritalStatus(v); markChanged(); }}
          />

          {/* Community Details (read-only) */}
          <Text style={styles.sectionTitle}>COMMUNITY DETAILS</Text>
          <ReadonlyField label="Religion" value={readonly.religion} />
          <ReadonlyField label="Caste" value={readonly.casteName} />
          <ReadonlyField label="Sub Caste" value={readonly.subCaste} />
          <ReadonlyField label="Mother Tongue" value={readonly.motherTongue} />

          {/* Horoscope */}
          <Text style={styles.sectionTitle}>HOROSCOPE</Text>
          <Text style={styles.label}>Rashi</Text>
          <SearchableDropdown
            placeholder="Select Rashi"
            value={rashi}
            options={RASHIS}
            onSelect={(v) => { setRashi(v); markChanged(); }}
          />
          <Text style={styles.label}>Nakshatra</Text>
          <SearchableDropdown
            placeholder="Select Nakshatra"
            value={nakshatra}
            options={NAKSHATRAS}
            onSelect={(v) => { setNakshatra(v); markChanged(); }}
          />

          {/* Contact (read-only) */}
          <Text style={styles.sectionTitle}>CONTACT DETAILS</Text>
          <ReadonlyField label="Mobile Number" value={readonly.mobile ? `+91 ${readonly.mobile}` : ''} />
          <ReadonlyField label="Email ID" value={readonly.email} />
          <Text style={styles.hint}>To change your mobile or email, use Account Settings.</Text>

          {/* Address */}
          <Text style={styles.sectionTitle}>ADDRESS</Text>
          <Text style={styles.label}>Residence Type</Text>
          <View style={styles.toggleRow}>
            {RESIDENCE_TYPES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.toggle, addrResidenceType === r.value && styles.toggleActive]}
                onPress={() => { setAddrResidenceType(r.value as 'INDIA' | 'NRI'); markChanged(); }}
              >
                <Text style={[styles.toggleText, addrResidenceType === r.value && styles.toggleTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Address Line</Text>
          <TextInput style={styles.input} placeholder="House no, street, area" placeholderTextColor="#999" value={addrLine1} onChangeText={(t) => { setAddrLine1(t); markChanged(); }} />

          {addrResidenceType === 'INDIA' ? (
            <>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} placeholder="State" placeholderTextColor="#999" value={addrState} onChangeText={(t) => { setAddrState(t); markChanged(); }} />
              <Text style={styles.label}>District</Text>
              <TextInput style={styles.input} placeholder="District" placeholderTextColor="#999" value={addrDistrict} onChangeText={(t) => { setAddrDistrict(t); markChanged(); }} />
              <Text style={styles.label}>Taluka</Text>
              <TextInput style={styles.input} placeholder="Taluka" placeholderTextColor="#999" value={addrTaluka} onChangeText={(t) => { setAddrTaluka(t); markChanged(); }} />
              <Text style={styles.label}>Pincode</Text>
              <TextInput style={[styles.input, fieldErrors.addrPincode && styles.inputError]} placeholder="6-digit pincode" placeholderTextColor="#999" value={addrPincode} onChangeText={(t) => { setAddrPincode(t); markChanged(); setFieldErrors((e) => ({ ...e, addrPincode: '' })); }} keyboardType="number-pad" maxLength={6} />
              {!!fieldErrors.addrPincode && <Text style={styles.fieldErrorText}>{fieldErrors.addrPincode}</Text>}
            </>
          ) : (
            <>
              <Text style={styles.label}>Country</Text>
              <TextInput style={styles.input} placeholder="Country" placeholderTextColor="#999" value={addrCountry} onChangeText={(t) => { setAddrCountry(t); markChanged(); }} />
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} placeholder="City" placeholderTextColor="#999" value={addrCity} onChangeText={(t) => { setAddrCity(t); markChanged(); }} />
              <Text style={styles.label}>State / Province</Text>
              <TextInput style={styles.input} placeholder="State or Province" placeholderTextColor="#999" value={addrStateOrProvince} onChangeText={(t) => { setAddrStateOrProvince(t); markChanged(); }} />
              <Text style={styles.label}>Postal Code</Text>
              <TextInput style={styles.input} placeholder="Postal code" placeholderTextColor="#999" value={addrPostalCode} onChangeText={(t) => { setAddrPostalCode(t); markChanged(); }} keyboardType="number-pad" />
            </>
          )}

          {/* Education */}
          <Text style={styles.sectionTitle}>EDUCATION</Text>
          <Text style={styles.label}>Highest Qualification</Text>
          <TextInput style={styles.input} placeholder="e.g. B.Tech" placeholderTextColor="#999" value={qualification} onChangeText={(t) => { setQualification(t); markChanged(); }} />
          <Text style={styles.label}>College / University</Text>
          <TextInput style={styles.input} placeholder="College name" placeholderTextColor="#999" value={college} onChangeText={(t) => { setCollege(t); markChanged(); }} />

          {/* Professional Details */}
          <Text style={styles.sectionTitle}>PROFESSIONAL DETAILS</Text>
          <Text style={styles.label}>Employment Type</Text>
          <SearchableDropdown
            placeholder="Select employment type"
            value={employedType}
            options={EMPLOYED_TYPES}
            onSelect={(v) => { setEmployedType(v); markChanged(); }}
          />
          <Text style={styles.label}>Designation</Text>
          <TextInput style={styles.input} placeholder="Enter profession" placeholderTextColor="#999" value={designation} onChangeText={(t) => { setDesignation(t); markChanged(); }} />
          <Text style={styles.label}>Company Name</Text>
          <TextInput style={styles.input} placeholder="Enter company name" placeholderTextColor="#999" value={companyName} onChangeText={(t) => { setCompanyName(t); markChanged(); }} />
          <Text style={styles.label}>Annual Income</Text>
          <TextInput style={[styles.input, fieldErrors.annualIncome && styles.inputError]} placeholder="Annual income" placeholderTextColor="#999" value={annualIncome} onChangeText={(t) => { setAnnualIncome(t); markChanged(); setFieldErrors((e) => ({ ...e, annualIncome: '' })); }} keyboardType="number-pad" />
          {!!fieldErrors.annualIncome && <Text style={styles.fieldErrorText}>{fieldErrors.annualIncome}</Text>}
          <Text style={styles.label}>Work Location</Text>
          <TextInput style={styles.input} placeholder="Enter location" placeholderTextColor="#999" value={companyLocation} onChangeText={(t) => { setCompanyLocation(t); markChanged(); }} />
          <Text style={styles.label}>Experience (Years)</Text>
          <TextInput style={[styles.input, fieldErrors.totalExperience && styles.inputError]} placeholder="Years of experience" placeholderTextColor="#999" value={totalExperience} onChangeText={(t) => { setTotalExperience(t); markChanged(); setFieldErrors((e) => ({ ...e, totalExperience: '' })); }} keyboardType="number-pad" />
          {!!fieldErrors.totalExperience && <Text style={styles.fieldErrorText}>{fieldErrors.totalExperience}</Text>}
          <Text style={styles.label}>LinkedIn URL</Text>
          <TextInput style={[styles.input, fieldErrors.linkedIn && styles.inputError]} placeholder="https://" placeholderTextColor="#999" value={linkedIn} onChangeText={(t) => { setLinkedIn(t); markChanged(); setFieldErrors((e) => ({ ...e, linkedIn: '' })); }} autoCapitalize="none" />
          {!!fieldErrors.linkedIn && <Text style={styles.fieldErrorText}>{fieldErrors.linkedIn}</Text>}

          {/* Family */}
          <Text style={styles.sectionTitle}>FAMILY DETAILS</Text>
          <Text style={styles.label}>Father Name</Text>
          <TextInput style={styles.input} placeholder="Father's name" placeholderTextColor="#999" value={fatherName} onChangeText={(t) => { setFatherName(t); markChanged(); }} />
          <Text style={styles.label}>Mother Name</Text>
          <TextInput style={styles.input} placeholder="Mother's name" placeholderTextColor="#999" value={motherName} onChangeText={(t) => { setMotherName(t); markChanged(); }} />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Brothers</Text>
              <TextInput style={[styles.input, fieldErrors.brothers && styles.inputError]} placeholder="0" placeholderTextColor="#999" value={brothers} onChangeText={(t) => { setBrothers(t); markChanged(); setFieldErrors((e) => ({ ...e, brothers: '' })); }} keyboardType="number-pad" maxLength={2} />
              {!!fieldErrors.brothers && <Text style={styles.fieldErrorText}>{fieldErrors.brothers}</Text>}
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Sisters</Text>
              <TextInput style={[styles.input, fieldErrors.sisters && styles.inputError]} placeholder="0" placeholderTextColor="#999" value={sisters} onChangeText={(t) => { setSisters(t); markChanged(); setFieldErrors((e) => ({ ...e, sisters: '' })); }} keyboardType="number-pad" maxLength={2} />
              {!!fieldErrors.sisters && <Text style={styles.fieldErrorText}>{fieldErrors.sisters}</Text>}
            </View>
          </View>
          <Text style={styles.label}>Father Occupation</Text>
          <TextInput style={styles.input} placeholder="Occupation" placeholderTextColor="#999" value={fatherOccupation} onChangeText={(t) => { setFatherOccupation(t); markChanged(); }} />
          <Text style={styles.label}>Mother Occupation</Text>
          <TextInput style={styles.input} placeholder="Occupation" placeholderTextColor="#999" value={motherOccupation} onChangeText={(t) => { setMotherOccupation(t); markChanged(); }} />

          {/* Lifestyle */}
          <Text style={styles.sectionTitle}>LIFESTYLE</Text>
          <Text style={styles.label}>Diet</Text>
          <SearchableDropdown placeholder="Select diet" value={diet} options={DIET_OPTIONS} onSelect={(v) => { setDiet(v); markChanged(); }} />
          <Text style={styles.label}>Smoking</Text>
          <SearchableDropdown placeholder="Select" value={smoking} options={YES_NO_OCCASIONAL} onSelect={(v) => { setSmoking(v); markChanged(); }} />
          <Text style={styles.label}>Drinking</Text>
          <SearchableDropdown placeholder="Select" value={drinking} options={YES_NO_OCCASIONAL} onSelect={(v) => { setDrinking(v); markChanged(); }} />

          {/* About */}
          <Text style={styles.sectionTitle}>ABOUT ME</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#999"
            value={aboutMe}
            onChangeText={(t) => { setAboutMe(t.slice(0, 2000)); markChanged(); }}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.counter}>{aboutMe.length}/2000</Text>

          {/* Partner Preferences */}
          <Text style={styles.sectionTitle}>PARTNER PREFERENCES</Text>
          <Text style={styles.label}>Preferred Age Range</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <TextInput style={[styles.input, fieldErrors.prefAgeMin && styles.inputError]} placeholder="Min" placeholderTextColor="#999" value={prefAgeMin} onChangeText={(t) => { setPrefAgeMin(t); markChanged(); setFieldErrors((e) => ({ ...e, prefAgeMin: '', prefAgeMax: '' })); }} keyboardType="number-pad" maxLength={2} />
            </View>
            <View style={styles.half}>
              <TextInput style={[styles.input, fieldErrors.prefAgeMax && styles.inputError]} placeholder="Max" placeholderTextColor="#999" value={prefAgeMax} onChangeText={(t) => { setPrefAgeMax(t); markChanged(); setFieldErrors((e) => ({ ...e, prefAgeMin: '', prefAgeMax: '' })); }} keyboardType="number-pad" maxLength={2} />
            </View>
          </View>
          {!!fieldErrors.prefAgeMin && <Text style={styles.fieldErrorText}>{fieldErrors.prefAgeMin}</Text>}

          <Text style={styles.label}>Preferred Education</Text>
          <TextInput style={styles.input} placeholder="e.g. Graduate or above" placeholderTextColor="#999" value={prefEducation} onChangeText={(t) => { setPrefEducation(t); markChanged(); }} />

          <Text style={styles.label}>Preferred Profession</Text>
          <TextInput style={styles.input} placeholder="e.g. Doctor, Engineer" placeholderTextColor="#999" value={prefProfession} onChangeText={(t) => { setPrefProfession(t); markChanged(); }} />

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

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readonlyBox}>
        <Text style={styles.readonlyText}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
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
    position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#D20236', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
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
  sectionTitle: { fontSize: 12, color: '#999', fontWeight: '700', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 4 },
  hint: { fontSize: 11, color: '#999', marginTop: -8, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#000', marginBottom: 12,
  },
  textArea: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#000', textAlignVertical: 'top', minHeight: 110,
  },
  counter: { alignSelf: 'flex-end', color: '#999', fontSize: 11, marginTop: 6, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  half: { flex: 1 },
  readonlyBox: { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  readonlyText: { fontSize: 14, color: '#666' },
  toggleRow: { flexDirection: 'row', marginBottom: 12, gap: 10 },
  toggle: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  toggleActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  toggleText: { fontSize: 14, color: '#333' },
  toggleTextActive: { color: '#D20236', fontWeight: '700' },
  toggleRowError: { borderWidth: 1.5, borderColor: '#D20236', borderRadius: 10, padding: 4 },
  dobInput: { flex: 1 },
  errorBanner: { fontSize: 13, color: '#D20236', fontWeight: '500', marginVertical: 10 },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
  fieldErrorText: { fontSize: 11, color: '#D20236', marginTop: -8, marginBottom: 10, fontWeight: '500' },
  saveChangesBtn: { backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  saveChangesText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
