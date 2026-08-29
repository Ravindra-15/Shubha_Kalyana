import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
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
  MoreVertical,
  Heart,
} from 'lucide-react-native';
import { getPartnerProfile, isProfileFullyVerified } from '../../api/profile';
import { resolveImageUrl } from '../../utils/imageUrl';
import apiClient from '../../api/client';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import RequestSentModal from '../../components/RequestSentModal';
import UnlockAccessModal from '../../components/UnlockAccessModal';
import PaymentBreakupModal from '../../components/PaymentBreakupModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ReportUserModal from '../../components/ReportUserModal';
import ReportSubmittedModal from '../../components/ReportSubmittedModal';
import { openRazorpayOrder } from '../../utils/razorpayCheckout';
import {
  createProfileUnlockOrder,
  getUnlockPrice,
  getProfileAccess,
  revealContact,
} from '../../api/membershipPayment';
import {
  getSingleProfileUnlockLimitMessage,
  isFreePlanSingleUnlockLimitReached,
} from '../../utils/singleProfileUnlockAccess';
import { startChat, blockChatUser } from '../../api/chat';
import type { PaymentOrderResult } from '../../utils/paymentBreakup';
import { isProfileSaved, removeSavedProfile, saveProfile } from '../../utils/savedProfiles';
import { useFocusEffect } from '@react-navigation/native';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

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

type PendingPayment = {
  orderResult: PaymentOrderResult;
  title: string;
  description: string;
  itemLabel: string;
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
        <View style={styles.lockedVal}>
          <Lock color="#D20236" size={12} />
          <View style={styles.blurBar} />
        </View>
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
        <View style={styles.lockedInline}>
          <Lock color="#D20236" size={12} />
          <View style={styles.blurBar} />
        </View>
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
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportSubmitted, setShowReportSubmitted] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportChatId, setReportChatId] = useState('');
  const [saveAnimVisible, setSaveAnimVisible] = useState(false);
  const saveAnimValue = useRef(new Animated.Value(0)).current;

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

  const loadProfile = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await getPartnerProfile(profileId);
        setData(res);

        // load unlock price + access status
        try {
          const [price, acc] = await Promise.all([
            getUnlockPrice(),
            getProfileAccess(profileId),
          ]);
          setUnlockPrice(price.amount || 99);
          setAccess(acc);
          setCanChat(
            Boolean(
              acc?.shouldBlurSensitiveFields === false ||
                acc?.canViewContactNumber ||
                acc?.isProfileSingleUnlocked ||
                acc?.isMembershipProfileUnlocked,
            ),
          );
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
        if (silent) {
          Alert.alert('Error', 'Could not refresh profile');
        } else {
          Alert.alert(
            'Error',
            err?.response?.data?.message || 'Could not load profile',
          );
          navigation.goBack();
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [navigation, profileId],
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const { refreshing, onRefresh } = usePullToRefresh(() => loadProfile(true));

  const sendRequest = async () => {
    try {
      await apiClient.post(`/relationship/requests/${profileId}`, {});
      setShowSentModal(true);
      setRequestStatus('PENDING');
    } catch (err: any) {
      if (err?.response?.status === 402) {
        setShowUnlock(true);
        return;
      }
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not send request',
      );
    }
  };

  const playSaveAnimation = () => {
    setSaveAnimVisible(true);
    saveAnimValue.setValue(0);
    Animated.sequence([
      Animated.spring(saveAnimValue, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.timing(saveAnimValue, { toValue: 0, duration: 350, delay: 350, useNativeDriver: true }),
    ]).start(() => setSaveAnimVisible(false));
  };

  const toggleSavedProfile = async () => {
    if (savingProfile || !profileId) return;

    try {
      setSavingProfile(true);
      const nextSaved = !saved;
      if (nextSaved) {
        await saveProfile(profileId);
        playSaveAnimation();
      } else {
        await removeSavedProfile(profileId);
      }

      setSaved(nextSaved);
    } catch {
      Alert.alert('Error', 'Could not update saved profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const openChat = async () => {
    if (!canChat) {
      setShowUnlock(true);
      return;
    }
    const otherUserId = data?.user?._id;
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

  const openOptionsMenu = () => setOptionsMenuOpen((open) => !open);

  const handleBlockAndReport = async () => {
    setOptionsMenuOpen(false);
    const otherUserId = data?.user?._id;
    if (!otherUserId) {
      Alert.alert('Error', 'Could not identify user');
      return;
    }
    try {
      let chatId = reportChatId;
      if (!chatId) {
        const { chat } = await startChat(otherUserId);
        chatId = chat._id;
        setReportChatId(chatId);
      }
      setShowBlockConfirm(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not start this action');
    }
  };

  const confirmBlock = async () => {
    try {
      setBlocking(true);
      await blockChatUser(reportChatId);
      setShowBlockConfirm(false);
      setShowReportModal(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not block user');
    } finally {
      setBlocking(false);
    }
  };

  const handleReportSubmitted = () => {
    setShowReportModal(false);
    setShowReportSubmitted(true);
  };

  const handleUnlock = async () => {
    if (isFreePlanSingleUnlockLimitReached(access)) {
      Alert.alert('Payment', getSingleProfileUnlockLimitMessage(access));
      return;
    }

    setPaying(true);
    try {
      const orderResult = await createProfileUnlockOrder(profileId);
      if (!orderResult?.order?.gatewayOrderId || !orderResult?.keyId) {
        Alert.alert('Payment', 'Could not create payment order');
        return;
      }

      setShowUnlock(false);
      setPendingPayment({
        orderResult,
        title: 'Profile Unlock',
        description: `Review the GST breakup before unlocking ${name || 'this profile'}.`,
        itemLabel: 'Profile unlock fee',
      });
    } catch (err: any) {
      const payload = err?.response?.data;
      Alert.alert(
        'Payment',
        payload?.code === 'SINGLE_PROFILE_UNLOCK_LIMIT_REACHED'
          ? getSingleProfileUnlockLimitMessage(payload)
          : payload?.message || 'Could not create payment order',
      );
    } finally {
      setPaying(false);
    }
  };

  const closePaymentBreakup = () => {
    if (confirmingPayment) return;
    setPendingPayment(null);
  };

  const confirmUnlockPayment = async () => {
    const payment = pendingPayment;
    if (!payment) return;

    setConfirmingPayment(true);
    const result = await openRazorpayOrder(payment.orderResult, 'Unlock Profile Access', { name });
    setConfirmingPayment(false);
    setPendingPayment(null);

    if (result.success) {
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
        setCanChat(true);
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
  const matchStatus = access?.isConnected
    ? 'connected'
    : access?.relationshipStatus === 'PENDING_SENT'
      ? 'sent'
      : access?.relationshipStatus === 'PENDING_RECEIVED'
        ? 'received'
        : null;
  const photo =
    profile.photos?.find((p: any) => p.isProfilePhoto)?.url ||
    profile.photos?.[0]?.url ||
    '';
  const verified = Boolean(profile.verified || isProfileFullyVerified(profile));
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
          navigation.navigate('SentRequests', { initialTab: 'Sent' });
        }}
      />
      <UnlockAccessModal
        visible={showUnlock}
        name={name}
        access={access}
        onClose={() => setShowUnlock(false)}
        onUpgrade={() => {
          setShowUnlock(false);
          navigation.navigate('Plans', { profileId, profileName: name });
        }}
      />
      <PaymentBreakupModal
        visible={Boolean(pendingPayment)}
        payment={pendingPayment}
        loading={confirmingPayment}
        onClose={closePaymentBreakup}
        onPurchase={confirmUnlockPayment}
      />
      <ConfirmDialog
        visible={showBlockConfirm}
        title="Block This User?"
        message="You will no longer receive messages or interactions from this profile."
        confirmLabel="Block User"
        loading={blocking}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={confirmBlock}
      />
      <ReportUserModal
        visible={showReportModal}
        chatId={reportChatId}
        onClose={() => setShowReportModal(false)}
        onSubmitted={handleReportSubmitted}
      />
      <ReportSubmittedModal
        visible={showReportSubmitted}
        buttonLabel="Done"
        onBackToChat={() => setShowReportSubmitted(false)}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SavedProfiles')}
            accessibilityLabel="Saved Profiles"
          >
            <Bookmark
              color="#D20236"
              size={24}
              fill={saved ? '#D20236' : 'transparent'}
            />
          </TouchableOpacity>

          {matchStatus === 'connected' ? (
            <View>
              <TouchableOpacity onPress={openOptionsMenu} accessibilityLabel="Profile options">
                <MoreVertical color="#000" size={22} />
              </TouchableOpacity>

              {optionsMenuOpen ? (
                <>
                  <TouchableOpacity
                    style={styles.menuBackdrop}
                    activeOpacity={1}
                    onPress={() => setOptionsMenuOpen(false)}
                  />
                  <View style={styles.optionsMenu}>
                    <TouchableOpacity style={styles.optionsMenuItem} onPress={handleBlockAndReport}>
                      <Text style={styles.optionsMenuText}>Block & Report User</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D20236']} tintColor="#D20236" />
        }
      >
        {matchStatus ? (
          <View style={styles.matchBanner}>
            <Image
              source={require('../../assets/images/unlock-illustration.png')}
              style={styles.matchBannerImage}
              resizeMode="contain"
            />
            <View>
              {matchStatus === 'connected' ? (
                <>
                  <Text style={styles.matchBannerTitle}>It's a Match !</Text>
                  <Text style={styles.matchBannerText}>
                    {name} has accepted your interest. You can now start your conversation.
                  </Text>
                </>
              ) : matchStatus === 'sent' ? (
                <>
                  <Text style={styles.matchBannerTitle}>Request Sent</Text>
                  <Text style={styles.matchBannerText}>
                    Your request is waiting for {name}'s response. We'll let you know once they accept.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.matchBannerTitle}>New Request!</Text>
                  <Text style={styles.matchBannerText}>
                    {name} wants to connect with you. Review your requests to respond.
                  </Text>
                </>
              )}
            </View>
          </View>
        ) : null}

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
              <Heart color="#fff" size={17} />
              <Text style={styles.sendText}>{canChat ? 'Chat Now' : 'Unlock to Chat'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, requestStatus && styles.sendBtnDisabled]}
              onPress={sendRequest}
              disabled={!!requestStatus}
            >
              <Heart color="#fff" size={17} />
              <Text style={styles.sendText}>
                {requestStatus === 'PENDING' ? 'Request Sent' : 'Send Request'}
              </Text>
            </TouchableOpacity>
          )}
          <View>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={toggleSavedProfile}
              disabled={savingProfile}
            >
              <Text style={styles.saveText}>
                {saved ? 'Remove Saved Profile' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
            {saveAnimVisible ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.saveAnimHeart,
                  {
                    opacity: saveAnimValue,
                    transform: [
                      { scale: saveAnimValue.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.4] }) },
                      { translateY: saveAnimValue.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
                    ],
                  },
                ]}
              >
                <Heart color="#D20236" fill="#D20236" size={30} />
              </Animated.View>
            ) : null}
          </View>
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
  headerTitle: { fontSize: 17, fontFamily: 'Outfit-Bold', color: '#000' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  menuBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
  },
  optionsMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 190,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
  },
  optionsMenuItem: { paddingHorizontal: 16, paddingVertical: 12 },
  optionsMenuText: { fontSize: 14, fontFamily: 'Outfit-Medium', color: '#D20236' },
  matchBanner: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    backgroundColor: '#D9043D',
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  matchBannerImage: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -60,
    width: 160,
    height: 120,
    opacity: 0.15,
  },
  matchBannerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Outfit-Bold' },
  matchBannerText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, lineHeight: 19 },
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
  verifiedText: { color: '#fff', fontSize: 12, fontFamily: 'Outfit-SemiBold' },
  coverInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  coverName: { color: '#fff', fontSize: 24, fontFamily: 'Outfit-Bold' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginTop: 10,
  },
  saveText: { color: '#333', fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  saveAnimHeart: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
  },
  section: { backgroundColor: '#fff', marginTop: 10, paddingHorizontal: 16 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000' },
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
    fontFamily: 'Outfit-Medium',
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
  hobbyText: { fontSize: 13, color: '#D20236', fontFamily: 'Outfit-Medium' },
  sendBtnDisabled: { backgroundColor: '#e69aab' },
  lockedInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactValue: { fontSize: 14, color: '#000', fontFamily: 'Outfit-Medium' },
  notProvided: { fontSize: 14, color: '#bbb', fontStyle: 'italic', flex: 1, textAlign: 'right' },
});
