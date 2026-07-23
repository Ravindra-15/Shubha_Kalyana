import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronUp,
  ChevronDown,
  Lock,
  Briefcase,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Bookmark,
} from 'lucide-react-native';
import { getPartnerProfile } from '../../api/profile';
import { resolveImageUrl } from '../../utils/imageUrl';
import apiClient from '../../api/client';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import RequestSentModal from '../../components/RequestSentModal';
import UnlockAccessModal from '../../components/UnlockAccessModal';
import { payToUnlockProfile } from '../../utils/razorpayCheckout';
import { getUnlockPrice, getProfileAccess } from '../../api/membershipPayment';
import { revealContact } from '../../api/membershipPayment';
import { startChat } from '../../api/chat';
import { getAccessSummary } from '../../api/membershipPayment';
import { isProfileSaved, removeSavedProfile, saveProfile } from '../../utils/savedProfiles';
import { useFocusEffect } from '@react-navigation/native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const isBlur = (v: any) =>
  v === 'blur' || v === undefined || v === null || v === '';
const isLocked = (v: any) => v === 'blur';
const isEmpty = (v: any) => v === undefined || v === null || v === '';

const getAge = (dob?: string) => {
  if (!dob) return null;
  const b = new Date(dob);
  if (isNaN(b.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
};

// A row that shows value OR a lock if blurred
function Row({
  label,
  value,
  onLockedPress,
}: {
  label: string;
  value: any;
  onLockedPress?: () => void;
}) {
  const locked = isLocked(value);
  const empty = isEmpty(value);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {locked ? (
        <TouchableOpacity
          style={styles.lockedVal}
          onPress={onLockedPress}
          activeOpacity={0.6}
        >
          <Lock color="#D20236" size={12} />
          <View style={styles.blurBar} />
        </TouchableOpacity>
      ) : empty ? (
        <Text style={styles.notProvided}>Not provided</Text>
      ) : (
        <Text style={styles.rowValue}>{value}</Text>
      )}
    </View>
  );
}

function ContactRow({
  Icon,
  iconColor,
  label,
  value,
  isPremiumLocked,
  onLockedPress,
}: {
  Icon: any;
  iconColor: string;
  label: string;
  value: any;
  isPremiumLocked?: boolean;
  onLockedPress?: () => void;
}) {
  const locked = isPremiumLocked || isLocked(value);
  const empty = !locked && isEmpty(value);
  return (
    <View style={styles.contactRow}>
      <Icon color={iconColor} size={16} />
      <Text style={styles.contactLabel}>{label}</Text>
      {locked ? (
        <TouchableOpacity
          onPress={onLockedPress}
          style={styles.lockedInline}
          activeOpacity={0.6}>
          <Lock color="#D20236" size={12} />
          <View style={styles.blurBar} />
        </TouchableOpacity>
      ) : empty ? (
        <Text style={styles.notProvided}>Not provided</Text>
      ) : (
        <Text style={styles.contactValue}>{value}</Text>
      )}
    </View>
  );
}

// Collapsible section
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const toggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setOpen(!open);
  };
  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHead}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        {open ? (
          <ChevronUp color="#000" size={20} />
        ) : (
          <ChevronDown color="#000" size={20} />
        )}
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

export default function ProfileDetailScreen({ route, navigation }: any) {
  const { profileId } = route.params || {};
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showSentModal, setShowSentModal] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState(99);
  const [paying, setPaying] = useState(false);
  const [access, setAccess] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [canChat, setCanChat] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadSavedStatus = async () => {
        if (!profileId) {
          setSaved(false);
          return;
        }
        try {
          const nextSaved = await isProfileSaved(profileId);
          if (active) setSaved(nextSaved);
        } catch {
          if (active) setSaved(false);
        }
      };

      loadSavedStatus();

      return () => {
        active = false;
      };
    }, [profileId])
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await getPartnerProfile(profileId);
        setData(res);
        console.log('PROFILE ACCESS:', JSON.stringify(res?.access));
        console.log(
          'SAMPLE ADDR:',
          JSON.stringify(res?.profile?.address?.current),
        );

        // load unlock price + access status
        try {
          const [price, acc] = await Promise.all([
            getUnlockPrice(),
            getProfileAccess(profileId),
          ]);
          setUnlockPrice(price.amount || 99);
          setAccess(acc);
          const summary = await getAccessSummary();
          setCanChat(summary?.canUseChat === true);
          if (acc && acc.shouldBlurSensitiveFields === false) {
            const c = await revealContact(profileId);
            setContact(c);
          }
        } catch {}

        // check if a request was already sent to this profile
        try {
          const [chk, connChk] = await Promise.all([
            apiClient.get('/relationship/requests/sent', {
              params: { limit: 50 },
            }),
            apiClient.get('/relationship/connections/me', {
              params: { limit: 50 },
            }),
          ]);
          const sent = chk.data?.data?.requests || [];
          const conns =
            connChk.data?.data?.connections || connChk.data?.data?.items || [];
          const connected = conns.some(
            (c: any) =>
              String(c.profile?._id || c.profileId) === String(profileId),
          );
          if (connected) {
            setRequestStatus('ACCEPTED');
          } else {
            const match = sent.find(
              (r: any) =>
                (String(r.profile?._id) === String(profileId) ||
                  String(r.toProfileId) === String(profileId)) &&
                (r.status === 'PENDING' || r.status === 'ACCEPTED'),
            );
            setRequestStatus(match ? match.status : null);
          }
        } catch {}
      } catch (err: any) {
        Alert.alert(
          'Error',
          err?.response?.data?.message || 'Could not load profile',
        );
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation, profileId]);

  const sendRequest = async () => {
    try {
      await apiClient.post(`/relationship/requests/${profileId}`, {});
      setShowSentModal(true);
      setRequestStatus('PENDING');
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not send request',
      );
    }
  };

  const toggleSavedProfile = async () => {
    if (savingProfile || !profileId) return;

    try {
      setSavingProfile(true);
      const nextSaved = !saved;
      if (nextSaved) {
        await saveProfile(profileId);
      } else {
        await removeSavedProfile(profileId);
      }

      setSaved(nextSaved);
      Alert.alert(
        nextSaved ? 'Saved' : 'Removed',
        nextSaved ? 'Profile saved' : 'Profile removed from saved',
      );
    } catch {
      Alert.alert('Error', 'Could not update saved profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const openChat = async () => {
    if (!canChat) {
      navigation.navigate('Plans', { profileId });
      return;
    }
    const otherUserId = data?.profile?.userId;
    if (!otherUserId) {
      Alert.alert('Error', 'Could not identify user');
      return;
    }
    try {
      const { chat, profileId: otherProfileId } = await startChat(otherUserId);
      console.log('STARTED CHAT ID:', chat._id, 'for user:', otherUserId);
      navigation.navigate('Conversation', {
        chatId: chat._id,
        name,
        photo,
        receiverId: otherUserId,
        profileId: otherProfileId,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not start chat');
    }
  };
  const handleUnlock = async () => {
    setPaying(true);
    const result = await payToUnlockProfile(profileId, { name });
    setPaying(false);
    if (result.success) {
      setShowUnlock(false);
      // refetch everything in parallel so all sections update together
      try {
        const [fresh, acc, c] = await Promise.all([
          getPartnerProfile(profileId),
          getProfileAccess(profileId),
          revealContact(profileId),
        ]);
        setData(fresh);
        setAccess(acc);
        setContact(c);
      } catch {}
      Alert.alert('Unlocked', 'Profile access unlocked successfully');
    } else {
      Alert.alert('Payment', result.message || 'Payment failed');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#D20236" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }
  if (!data) return null;

  const user = data.user || {};
  const profile = data.profile || {};
  const basic = profile.basicInfo || {};
  const emp = profile.employment || {};
  const edu = profile.education || {};
  const fam = profile.family || {};
  const horo = profile.horoscopeDetail || {};
  const life = profile.lifestyle || {};
  const addr = profile.address || {};
  const pref = data.partnerPreference || {};
  const hobbies = profile.hobbiesAndInterests || [];

  const name = [
    basic.firstName || user.firstName,
    basic.lastName || user.lastName,
  ]
    .filter(Boolean)
    .join(' ');
  const age = getAge(basic.dob);
  const photo =
    profile.photos?.find((p: any) => p.isProfilePhoto)?.url ||
    profile.photos?.[0]?.url ||
    '';
  const verified = profile.documents?.verificationStatus === 'VERIFIED';
  const caste = basic.caste?.casteName || basic.caste?.name || '';
  const location = [addr.current?.city, addr.current?.state]
    .filter(x => x && !isBlur(x))
    .join(', ');

  const heightStr = basic.height
    ? `${basic.height.feet}'${basic.height.inches}"`
    : '';
  const weightStr = basic.weight
    ? `${basic.weight.value} ${basic.weight.units?.toLowerCase() || 'kg'}`
    : '';

  const fmtAddr = (a: any) => {
    if (!a || isBlur(a)) return 'blur';
    const parts = [
      a.addressLine1,
      a.taluka,
      a.district || a.city,
      a.state || a.stateOrProvince,
      a.pincode || a.postalCode,
    ].filter(x => x && !isBlur(x));
    return parts.length ? parts.join(', ') : 'blur';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RequestSentModal
        visible={showSentModal}
        name={name}
        onClose={() => setShowSentModal(false)}
        onContinueBrowsing={() => {
          setShowSentModal(false);
          navigation.navigate('MainTabs');
        }}
        onViewSentRequests={() => {
          setShowSentModal(false);
          navigation.navigate('SentRequests');
        }}
      />
      <UnlockAccessModal
        visible={showUnlock}
        name={name}
        price={unlockPrice}
        loading={paying}
        onClose={() => setShowUnlock(false)}
        onUnlock={handleUnlock}
        onUpgrade={() => {
          setShowUnlock(false);
          navigation.navigate('Plans');
        }}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Details</Text>
        <TouchableOpacity
          onPress={toggleSavedProfile}
          disabled={savingProfile}
        >
          <Bookmark
            color="#D20236"
            size={24}
            fill={saved ? '#D20236' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Cover photo */}
        <View style={styles.coverWrap}>
          {photo ? (
            <Image
              source={{ uri: resolveImageUrl(photo) }}
              style={styles.cover}
            />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
          )}
          {verified && (
            <View style={styles.verifiedBadge}>
              <BadgeCheck color="#fff" size={16} fill="#1a7f37" />
              <Text style={styles.verifiedText}>Verified Profile</Text>
            </View>
          )}
          <View style={styles.coverInfo}>
            <Text style={styles.coverName}>
              {name}
              {age ? `, ${age}` : ''}
            </Text>
            <Text style={styles.coverMeta}>
              {[basic.religion, caste, basic.maritalStatus?.replace(/_/g, ' ')]
                .filter(Boolean)
                .join('  •  ')}
            </Text>
            <View style={styles.coverIconRow}>
              <Briefcase color="#fff" size={13} />
              <Text style={styles.coverIconText}>
                {emp.designation || 'Not specified'}
              </Text>
              <GraduationCap
                color="#fff"
                size={13}
                style={{ marginLeft: 12 }}
              />
              <Text style={styles.coverIconText}>
                {[edu.highestQualification, edu.college]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
            {!!location && (
              <View style={styles.coverIconRow}>
                <MapPin color="#fff" size={13} />
                <Text style={styles.coverIconText}>{location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionWrap}>
          {requestStatus === 'ACCEPTED' ? (
            <TouchableOpacity
              style={[styles.sendBtn, !canChat && styles.sendBtnDisabled]}
              onPress={openChat}
            >
              <Text style={styles.sendText}>Chat Now</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, requestStatus && styles.sendBtnDisabled]}
              onPress={sendRequest}
              disabled={!!requestStatus}
            >
              <Text style={styles.sendText}>
                {requestStatus === 'PENDING' ? 'Request Sent' : 'Send Request'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={toggleSavedProfile}
            disabled={savingProfile}
          >
            <Text style={styles.saveText}>
              {saved ? 'Remove Saved Profile' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Details */}
        <Section title="Contact Details">
          <ContactRow
            Icon={MessageCircle}
            iconColor="#1a7f37"
            label="Whatsapp"
            value={contact?.mobile}
            isPremiumLocked={access?.shouldBlurSensitiveFields !== false}
            onLockedPress={() => setShowUnlock(true)}
          />
          <ContactRow
            Icon={Phone}
            iconColor="#333"
            label="Phone Number"
            value={contact?.mobile}
            isPremiumLocked={access?.shouldBlurSensitiveFields !== false}
            onLockedPress={() => setShowUnlock(true)}
          />
          <ContactRow
            Icon={Mail}
            iconColor="#333"
            label="Email ID"
            value={contact?.email}
            isPremiumLocked={access?.shouldBlurSensitiveFields !== false}
            onLockedPress={() => setShowUnlock(true)}
          />
        </Section>

        {/* Personal Details */}
        <Section title="Personal Details">
          <Row
            label="Date of Birth"
            value={
              basic.dob ? new Date(basic.dob).toLocaleDateString('en-GB') : ''
            }
          />
          <Row label="Height" value={heightStr} />
          <Row label="Weight" value={weightStr} />
          <Row label="Diet" value={life.diet || basic.diet} />
          <Row label="Rashi" value={horo.rashi} />
          <Row label="Nakshatra" value={horo.nakshatra} />
        </Section>

        {/* Hobbies */}
        {hobbies.length > 0 && (
          <Section title="Hobbies & Interests">
            <View style={styles.hobbyWrap}>
              {hobbies.map((h: string, i: number) => (
                <View key={i} style={styles.hobbyChip}>
                  <Text style={styles.hobbyText}>{h}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Location */}
        <Section title="Location">
          <Row
            label="Present Address"
            value={fmtAddr(addr.current)}
            onLockedPress={() => setShowUnlock(true)}
          />
          <Row
            label="Permanent Address"
            value={fmtAddr(addr.permanent)}
            onLockedPress={() => setShowUnlock(true)}
          />
        </Section>

        {/* Employment */}
        <Section title="Employment Details">
          <Row label="Profession" value={emp.designation} />
          <Row label="Company Name" value={emp.companyName} onLockedPress={() => setShowUnlock(true)} />
          <Row label="Company Type" value={emp.employedType?.replace(/_/g, ' ')} />
          <Row label="Annual Income" value={emp.annualIncome ? `₹${emp.annualIncome.toLocaleString('en-IN')}` : ''} />
          <Row label="Experience" value={emp.totalExperience ? `${emp.totalExperience} Years` : ''} />
          <Row label="Work Location" value={emp.companyLocation} onLockedPress={() => setShowUnlock(true)} />
          <Row label="LinkedIn Link" value={emp.linkedInProfile} onLockedPress={() => setShowUnlock(true)} />
        </Section>

        {/* Education */}
        <Section title="Education Details">
          <Row label="Highest Qualification" value={edu.highestQualification} />
          <Row label="College / University" value={edu.college} />
        </Section>

        {/* Family */}
        <Section title="Family Details">
          <Row
            label="Father"
            value={
              fam.fatherName
                ? `${fam.fatherName}${
                    fam.fatherOccupation ? ` - ${fam.fatherOccupation}` : ''
                  }`
                : ''
            }
          />
          <Row
            label="Mother"
            value={
              fam.motherName
                ? `${fam.motherName}${
                    fam.motherOccupation ? ` - ${fam.motherOccupation}` : ''
                  }`
                : ''
            }
          />
          <Row
            label="Siblings"
            value={
              fam.brothers || fam.sisters
                ? [
                    fam.brothers ? `${fam.brothers} Brother(s)` : '',
                    fam.sisters ? `${fam.sisters} Sister(s)` : '',
                  ]
                    .filter(Boolean)
                    .join(', ')
                : ''
            }
          />
        </Section>

        {/* Partner Preferences */}
        <Section title="Partner Preferences">
          <Row
            label="Preferred Age Range"
            value={
              pref.ageRange
                ? `${pref.ageRange.min}-${pref.ageRange.max} years`
                : ''
            }
          />
          <Row
            label="Preferred Education"
            value={pref.education?.join?.(', ')}
          />
          <Row
            label="Preferred Profession"
            value={pref.profession?.join?.(', ')}
          />
          <Row
            label="Preferred Resident"
            value={pref.ressident?.join?.(', ')}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  coverWrap: { height: 320, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#ccc' },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a7f37',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
  },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  coverInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  coverName: { color: '#fff', fontSize: 24, fontWeight: '700' },
  coverMeta: { color: '#fff', fontSize: 13, marginTop: 4 },
  coverIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  coverIconText: { color: '#fff', fontSize: 12 },
  actionWrap: { backgroundColor: '#fff', padding: 16 },
  sendBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginTop: 10,
  },
  saveText: { color: '#333', fontSize: 15, fontWeight: '600' },
  section: { backgroundColor: '#fff', marginTop: 10, paddingHorizontal: 16 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  sectionBody: { paddingBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
  },
  rowLabel: { fontSize: 14, color: '#888', flex: 1 },
  rowValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  lockedVal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 6,
  },
  blurBar: {
    width: 90,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  contactLabel: { fontSize: 14, color: '#333', flex: 1 },
  hobbyWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  hobbyChip: {
    borderWidth: 1,
    borderColor: '#f0d0d8',
    backgroundColor: '#fdf2f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  hobbyText: { fontSize: 13, color: '#D20236', fontWeight: '500' },
  sendBtnDisabled: { backgroundColor: '#e69aab' },
  lockedInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactValue: { fontSize: 14, color: '#000', fontWeight: '500' },
  notProvided: { fontSize: 14, color: '#bbb', fontStyle: 'italic', flex: 1, textAlign: 'right' },
});
