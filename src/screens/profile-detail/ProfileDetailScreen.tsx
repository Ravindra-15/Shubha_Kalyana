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
  Dimensions,
  Animated,
  Share,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronUp,
  ChevronDown,
  Lock,
  Briefcase,
  GraduationCap,
  MapPin,
  MapPinned,
  Phone,
  Mail,
  MessageCircle,
  MoreVertical,
  Heart,
  Cigarette,
  Wine,
  Share2,
  Ban,
  Flag,
  Send,
  MailCheck,
  Contact,
  UserCheck,
  Calendar,
  Landmark,
  Users,
  UsersRound,
  Ruler,
  Weight,
  Utensils,
  HeartPulse,
  Moon,
  Star,
  School,
  IdCard,
  Building2,
  Store,
  ClipboardList,
  IndianRupee,
  Link,
  Clock,
  User,
  UserRound,
} from 'lucide-react-native';
import { getPartnerProfile } from '../../api/profile';
import { resolveImageUrl } from '../../utils/imageUrl';
import apiClient from '../../api/client';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import RequestSentModal from '../../components/RequestSentModal';
import UnlockAccessModal from '../../components/UnlockAccessModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ReportUserModal from '../../components/ReportUserModal';
import ReportSubmittedModal from '../../components/ReportSubmittedModal';
import GalleryPreviewGrid from '../../components/GalleryPreviewGrid';
import LockedGalleryPreview from '../../components/LockedGalleryPreview';
import GalleryLightboxModal from '../../components/GalleryLightboxModal';
import MatchBreakdownSection from '../../components/MatchBreakdownSection';
import {
  unlockProfileWithMembership,
  getProfileAccess,
  revealContact,
} from '../../api/membershipPayment';
import { startChat, blockChatUser } from '../../api/chat';
import { useFocusEffect } from '@react-navigation/native';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useInterestBadge } from '../../context/InterestBadgeContext';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const SCREEN_HEIGHT = Dimensions.get('window').height;
// Header height below the status-bar inset: paddingTop 10 + 38 button + 10.
const HEADER_BAR_HEIGHT = 58;
const SECTION_ORDER = [
  'personal', 'hobbies', 'contact', 'education', 'employment',
  'family', 'location', 'preferences', 'match',
];
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

// Client spec: show the exact annual income as a range bucket rather than
// the raw figure, using these specific bucket boundaries (lakhs).
const INCOME_BUCKETS = [
  [5, 7], [7, 9], [9, 11], [12, 15], [15, 20], [20, 25],
];
const formatIncomeBucket = (amount?: number) => {
  if (!amount) return '';
  const lakhs = amount / 100000;
  if (lakhs < INCOME_BUCKETS[0][0]) return 'Below 5 Lakh';
  const last = INCOME_BUCKETS[INCOME_BUCKETS.length - 1];
  if (lakhs > last[1]) return `${last[1]} Lakh and above`;
  const bucket =
    INCOME_BUCKETS.find(([min, max]) => lakhs >= min && lakhs <= max) ||
    INCOME_BUCKETS.reduce((closest, b) => {
      const dist = Math.min(Math.abs(lakhs - b[0]), Math.abs(lakhs - b[1]));
      const closestDist = Math.min(Math.abs(lakhs - closest[0]), Math.abs(lakhs - closest[1]));
      return dist < closestDist ? b : closest;
    });
  return `${bucket[0]} Lakh to ${bucket[1]} Lakh`;
};

// A row that shows value OR a lock if blurred
function Row({
  label,
  value,
  onLockedPress,
  Icon,
}: {
  label: string;
  value: any;
  onLockedPress?: () => void;
  Icon?: any;
}) {
  const locked = isLocked(value);
  const empty = isEmpty(value);
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelWrap}>
        {Icon && (
          <View style={styles.rowIconCircle}>
            <Icon color="#D20236" size={14} />
          </View>
        )}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
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
      <View style={styles.rowIconCircle}>
        <Icon color={iconColor} size={16} />
      </View>
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
  onLayout,
}: {
  title: string;
  children: React.ReactNode;
  onLayout?: (e: any) => void;
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
    <View style={styles.section} onLayout={onLayout}>
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
  // The header is absolutely positioned (floats over the cover photo), so
  // it no longer sits inside SafeAreaView's own top padding -- it needs
  // its own explicit offset for the status bar / notch, or it overlaps it.
  const insets = useSafeAreaInsets();
  // paddingTop (insets.top + 10) + circle button height (38) + paddingBottom (10).
  const headerHeight = insets.top + 58;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSentModal, setShowSentModal] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  // 'accept' = the same "Oops !" upgrade prompt used everywhere else in the
  // app for send/accept request (Home, AllMatches, Requests, etc.); 'profile'
  // = the "Unlock Full Profile Access" benefits list, kept only for the
  // view-contact flow below where listing what you'll unlock still makes sense.
  const [unlockVariant, setUnlockVariant] = useState<'profile' | 'accept'>('profile');
  const [access, setAccess] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [canChat, setCanChat] = useState(false);
  const [unlockingContact, setUnlockingContact] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportSubmitted, setShowReportSubmitted] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportChatId, setReportChatId] = useState('');
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const [interested, setInterested] = useState(false);
  const [togglingInterest, setTogglingInterest] = useState(false);
  const [showCoverLightbox, setShowCoverLightbox] = useState(false);
  const { bumpInterestCount } = useInterestBadge();

  // Quick-links row (Shaadi.com reference): tapping a chip scrolls the page
  // to that section's measured position. Showing the name/age/verified
  // badge in the header once the cover photo scrolls out of view is the
  // same reference's "collapsing title" behaviour.
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const [showHeaderIdentity, setShowHeaderIdentity] = useState(false);
  // The floating header (minus the status-bar inset the ScrollView already
  // sits below) and the docked quick-links bar both cover the top of the
  // scroll area, so scroll targets and the scroll-spy probe are offset by
  // that covered height -- otherwise a section's title lands under them.
  const quickLinksHeight = useRef(48);
  const coveredTop = () => HEADER_BAR_HEIGHT + quickLinksHeight.current;
  const scrollToSection = (key: string) => {
    const y = sectionY.current[key];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - coveredTop() - 8), animated: true });
    }
  };
  const [activeSection, setActiveSection] = useState('personal');
  const activeRef = useRef('personal');
  const underlineAnim = useRef(new Animated.Value(1)).current;
  const tabX = useRef<Record<string, number>>({});
  const dockedLinksRef = useRef<ScrollView>(null);
  const inlineLinksRef = useRef<ScrollView>(null);
  const spyLockUntil = useRef(0);
  const setActive = (key: string) => {
    if (activeRef.current === key) return;
    activeRef.current = key;
    setActiveSection(key);
    underlineAnim.setValue(0);
    Animated.timing(underlineAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    // Keep the active tab in view in the horizontal bar.
    const x = Math.max(0, (tabX.current[key] ?? 0) - 24);
    dockedLinksRef.current?.scrollTo({ x, animated: true });
    inlineLinksRef.current?.scrollTo({ x, animated: true });
  };
  const selectQuickLink = (key: string) => {
    // Stop the scroll-spy from fighting the programmatic scroll while it
    // animates through the sections in between.
    spyLockUntil.current = Date.now() + 700;
    setActive(key);
    scrollToSection(key);
  };
  // Replaces stickyHeaderIndices: that approach pins content to the
  // ScrollView's own literal top edge, which is now *behind* the floating
  // header (since the header overlays the ScrollView instead of taking
  // its own space) -- so the quick-links bar stuck right under the
  // header, overlapping it. A manually-docked duplicate bar, shown once
  // the real one reaches the header, docks correctly below it instead.
  const [stickyQuickLinks, setStickyQuickLinks] = useState(false);
  const handleScroll = (e: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const y = contentOffset.y;
    const next = y > SCREEN_HEIGHT * 0.45;
    setShowHeaderIdentity((prev) => (prev === next ? prev : next));
    const quickLinksY = sectionY.current.quickLinks;
    const nextSticky = quickLinksY != null && y > quickLinksY - HEADER_BAR_HEIGHT;
    setStickyQuickLinks((prev) => (prev === nextSticky ? prev : nextSticky));

    // Scroll-spy: highlight the last section whose top has reached the
    // area just below the docked bar; at the very bottom, the last one.
    if (Date.now() < spyLockUntil.current) return;
    const present = SECTION_ORDER.filter((k) => sectionY.current[k] != null);
    if (!present.length) return;
    let current = present[0];
    if (y + layoutMeasurement.height >= contentSize.height - 4) {
      current = present[present.length - 1];
    } else {
      const probe = y + coveredTop() + 24;
      for (const k of present) {
        if (sectionY.current[k] <= probe) current = k;
      }
    }
    setActive(current);
  };

  const loadProfile = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await getPartnerProfile(profileId);
        setData(res);
        setInterested(Boolean(res?.isInterested));

        // load access status
        try {
          const acc = await getProfileAccess(profileId);
          setAccess(acc);
          // Mutual gate: both sides must have viewed each other's contact
          // before chat opens up -- one-sided unlocking is not enough.
          setCanChat(Boolean(acc?.canChatNow));
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

  const toggleInterestLocal = async () => {
    if (togglingInterest) return;
    setTogglingInterest(true);
    try {
      if (interested) {
        await apiClient.delete(`/relationship/interests/${profileId}`);
        setInterested(false);
        bumpInterestCount(-1);
      } else {
        await apiClient.post(`/relationship/interests/${profileId}`, {});
        setInterested(true);
        bumpInterestCount(1);
      }
    } catch (err: any) {
      if (err?.response?.status === 402) {
        setUnlockVariant('accept');
        setShowUnlock(true);
        return;
      }
      Alert.alert('Error', err?.response?.data?.message || 'Could not update interest');
    } finally {
      setTogglingInterest(false);
    }
  };

  const sendRequest = async () => {
    try {
      await apiClient.post(`/relationship/requests/${profileId}`, {});
      setShowSentModal(true);
      setRequestStatus('PENDING');
    } catch (err: any) {
      if (err?.response?.status === 402) {
        setUnlockVariant('accept');
        setShowUnlock(true);
        return;
      }
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not send request',
      );
    }
  };

  const acceptIncomingRequest = async () => {
    if (!access?.pendingRequestId) return;
    setAcceptingRequest(true);
    try {
      await apiClient.patch(`/relationship/requests/${access.pendingRequestId}/accept`);
      setRequestStatus('ACCEPTED');
      const acc = await getProfileAccess(profileId);
      setAccess(acc);
      // Mutual gate: both sides must have viewed each other's contact
      // before chat opens up -- one-sided unlocking is not enough.
      setCanChat(Boolean(acc?.canChatNow));
    } catch (err: any) {
      if (err?.response?.status === 402) {
        setUnlockVariant('accept');
        setShowUnlock(true);
        return;
      }
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept request');
    } finally {
      setAcceptingRequest(false);
    }
  };

  const handleViewContact = async () => {
    try {
      setUnlockingContact(true);
      await unlockProfileWithMembership(profileId);
      const [fresh, acc, c] = await Promise.all([
        getPartnerProfile(profileId),
        getProfileAccess(profileId),
        revealContact(profileId),
      ]);
      setData(fresh);
      setAccess(acc);
      setContact(c);
      // Mutual gate: both sides must have viewed each other's contact
      // before chat opens up -- one-sided unlocking is not enough.
      setCanChat(Boolean(acc?.canChatNow));
    } catch (err: any) {
      if (err?.response?.status === 402) {
        setUnlockVariant('profile');
        setShowUnlock(true);
        return;
      }
      Alert.alert('Error', err?.response?.data?.message || 'Could not view contact');
    } finally {
      setUnlockingContact(false);
    }
  };

  const openChat = async () => {
    if (!canChat) {
      await handleViewContact();
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

  // Share/Block/Report are now three independent menu actions (used to be
  // a single combined "Block & Report" flow that forced a report right
  // after blocking). Block and Report each close the profile and return
  // to the previous screen once done -- previously neither did, which is
  // the "have to press back manually" bug the client reported.
  const handleShareProfile = async () => {
    setOptionsMenuOpen(false);
    try {
      await Share.share({
        message: `Check out ${name}'s profile${user.profileCode ? ` (Profile ID: ${user.profileCode})` : ''} on Shubha Kalyana!`,
      });
    } catch {}
  };

  const handleBlockUser = () => {
    setOptionsMenuOpen(false);
    if (!data?.user?._id) {
      Alert.alert('Error', 'Could not identify user');
      return;
    }
    setShowBlockConfirm(true);
  };

  const confirmBlock = async () => {
    const otherUserId = data?.user?._id;
    try {
      setBlocking(true);
      let chatId = reportChatId;
      if (!chatId) {
        const { chat } = await startChat(otherUserId);
        chatId = chat._id;
        setReportChatId(chatId);
      }
      await blockChatUser(chatId);
      setShowBlockConfirm(false);
      Alert.alert(
        'User Blocked',
        'You will no longer receive messages or interactions from this profile.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not block user');
    } finally {
      setBlocking(false);
    }
  };

  const handleReportUser = () => {
    setOptionsMenuOpen(false);
    setShowReportModal(true);
  };

  const handleReportSubmitted = () => {
    setShowReportModal(false);
    setShowReportSubmitted(true);
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
  const isAgriculture = emp.employedType === 'AGRICULTURE';
  const isJob = ['PRIVATE', 'GOVERNMENT', 'SEMI_GOVERNMENT'].includes(emp.employedType);
  const isGovernment = ['GOVERNMENT', 'SEMI_GOVERNMENT'].includes(emp.employedType);
  const isBusiness = emp.employedType === 'BUSINESS';
  const edu = profile.education || {};
  const fam = profile.family || {};
  const horo = profile.horoscopeDetail || {};
  const life = profile.lifestyle || {};
  const healthDisclosure = profile.healthDisclosure || {};
  const addr = profile.address || {};
  const pref = data.partnerPreference || {};
  const hobbies = profile.hobbiesAndInterests || [];
  const quickLinkTabs = [
    { key: 'personal', label: 'Personal Details' },
    ...(hobbies.length > 0 || life.smoking || life.drinking
      ? [{ key: 'hobbies', label: 'Hobbies & Interests' }]
      : []),
    { key: 'contact', label: 'Contact Details' },
    { key: 'education', label: 'Education Details' },
    { key: 'employment', label: 'Employment Details' },
    { key: 'family', label: 'Family Details' },
    { key: 'location', label: 'Location' },
    { key: 'preferences', label: 'Partner Preferences' },
    { key: 'match', label: 'Compatibility' },
  ];
  const matchBreakdown = data.matchBreakdown || { fields: [], matchedCount: 0, totalCount: 0 };
  const myPhoto = data.myPhoto || '';

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
  const bothHaveActivePlans = Boolean(access?.bothHaveActivePlans);
  const myUnlockDone = Boolean(
    access?.isMembershipProfileUnlocked || access?.isProfileSingleUnlocked,
  );
  const primaryAction =
    requestStatus === 'ACCEPTED'
      ? canChat
        ? 'chat'
        : myUnlockDone
          ? 'waitingForChat'
          : 'viewContact'
      : matchStatus === 'received'
        ? 'acceptRequest'
        : requestStatus === 'PENDING'
          ? 'requestSent'
          : myUnlockDone
            ? 'waitingForChat'
            : bothHaveActivePlans
              ? 'viewContact'
              : 'sendRequest';
  const photo = profile.photos?.find((p: any) => p.isProfilePhoto)?.url || '';
  // `data.verified` comes from the backend (isProfileVerifiedForDisplay):
  // true when this profile's owner has an active plan. The nested `profile`
  // object has no such field of its own.
  const verified = Boolean(data.verified);
  const caste = basic.customCasteName || basic.caste?.casteName || basic.caste?.name || '';
  const location = [addr.current?.district, addr.current?.state]
    .filter(x => x && !isBlur(x))
    .join(', ');

  const heightStr = basic.height
    ? `${basic.height.feet} Ft ${basic.height.inches} Inch`
    : '';
  const weightStr = basic.weight
    ? `${basic.weight.value} ${basic.weight.units?.toLowerCase() || 'kg'}`
    : '';
  const formatChoice = (value: any) =>
    value && value !== 'blur'
      ? String(value).toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
      : value;
  const healthCondition =
    healthDisclosure.hasCondition === 'blur' || healthDisclosure.details === 'blur'
      ? 'blur'
      : healthDisclosure.hasCondition === true
        ? healthDisclosure.details
          ? `Yes - ${healthDisclosure.details}`
          : 'Yes'
        : healthDisclosure.hasCondition === false
          ? 'No'
          : '';
  const community = [caste, basic.subCaste].filter(Boolean).join(' - ');

  // Locked addresses now arrive with `district` real and every other key
  // blurred (client spec: show city plainly, mask the rest with stars) --
  // this is a plain display string now, not the lock-icon/blur-bar UI.
  const fmtAddr = (a: any) => {
    if (!a || a === 'blur') return '';
    const keys = Object.keys(a);
    const partiallyLocked = keys.some((k) => k !== 'district' && a[k] === 'blur');
    if (partiallyLocked) {
      return a.district ? `${a.district}, ★★★★★` : '★★★★★';
    }
    const parts = [
      a.addressLine1,
      a.addressLine2,
      a.district,
      a.state || a.stateOrProvince,
      a.postalCode,
    ].filter(x => x && !isBlur(x));
    return parts.length ? parts.join(', ') : '';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GalleryLightboxModal
        visible={showCoverLightbox}
        photos={photo ? [{ url: resolveImageUrl(photo) }] : []}
        onClose={() => setShowCoverLightbox(false)}
      />
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
        variant={unlockVariant}
        action={unlockVariant === 'accept' ? 'send' : undefined}
        name={name}
        access={access}
        onClose={() => setShowUnlock(false)}
        onUpgrade={() => {
          setShowUnlock(false);
          navigation.navigate('Plans', { profileId, profileName: name });
        }}
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
        targetUserId={data?.user?._id}
        onClose={() => setShowReportModal(false)}
        onSubmitted={handleReportSubmitted}
      />
      <ReportSubmittedModal
        visible={showReportSubmitted}
        buttonLabel="Done"
        onBackToChat={() => {
          setShowReportSubmitted(false);
          navigation.goBack();
        }}
      />
      {/* Header -- floats transparently over the cover photo (circular
          back + options buttons only, no title, so the photo itself gets
          the full space) until the user scrolls past it, at which point it
          becomes a solid bar showing name/age/verified (Shaadi.com
          reference for both states). */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10 },
          showHeaderIdentity && styles.headerSolid,
        ]}
      >
        <TouchableOpacity
          style={[styles.circleBtn, showHeaderIdentity && styles.circleBtnSolid]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={showHeaderIdentity ? '#000' : '#fff'} size={20} />
        </TouchableOpacity>

        {showHeaderIdentity && (
          <View style={styles.headerIdentityRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name}
              {age ? `, ${age}` : ''}
            </Text>
            {verified && <BadgeCheck color="#1a7f37" size={16} fill="#1a7f37" />}
          </View>
        )}

        <View style={styles.headerActions}>
          <View>
            <TouchableOpacity
              style={[styles.circleBtn, showHeaderIdentity && styles.circleBtnSolid]}
              onPress={openOptionsMenu}
              accessibilityLabel="Profile options"
            >
              <MoreVertical color={showHeaderIdentity ? '#000' : '#fff'} size={20} />
            </TouchableOpacity>

            {optionsMenuOpen ? (
              <>
                <TouchableOpacity
                  style={styles.menuBackdrop}
                  activeOpacity={1}
                  onPress={() => setOptionsMenuOpen(false)}
                />
                <View style={styles.optionsMenu}>
                  <TouchableOpacity style={styles.optionsMenuItem} onPress={handleShareProfile}>
                    <Share2 color="#333" size={17} />
                    <Text style={styles.optionsMenuText}>Share Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.optionsMenuItem} onPress={handleBlockUser}>
                    <Ban color="#D20236" size={17} />
                    <Text style={[styles.optionsMenuText, styles.optionsMenuTextDanger]}>Block User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.optionsMenuItem} onPress={handleReportUser}>
                    <Flag color="#D20236" size={17} />
                    <Text style={[styles.optionsMenuText, styles.optionsMenuTextDanger]}>Report User</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {stickyQuickLinks && (
        <View style={[styles.dockedQuickLinks, { top: headerHeight }]}>
          <ScrollView
            ref={dockedLinksRef}
            contentOffset={{ x: Math.max(0, (tabX.current[activeSection] ?? 0) - 24), y: 0 }}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickLinksRow}
            contentContainerStyle={styles.quickLinksContent}
          >
            {quickLinkTabs.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={styles.navTab}
                onPress={() => selectQuickLink(key)}
              >
                <Text style={[styles.navTabText, activeSection === key && styles.navTabTextActive]}>
                  {label}
                </Text>
                {activeSection === key && (
                  <Animated.View
                    style={[styles.navUnderline, { transform: [{ scaleX: underlineAnim }] }]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D20236']} tintColor="#D20236" />
        }
      >
        {/* Cover photo */}
        <View style={styles.coverWrap}>
          {photo ? (
            <TouchableOpacity
              style={styles.cover}
              activeOpacity={0.95}
              onPress={() => setShowCoverLightbox(true)}
            >
              <Image
                source={{ uri: resolveImageUrl(photo) }}
                style={styles.cover}
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.coverInfo}
          >
            <Text style={styles.coverName}>{name}</Text>
            {!!user.profileCode && (
              <Text style={styles.coverProfileCode}>Profile ID: {user.profileCode}</Text>
            )}
            <Text style={styles.coverMeta}>
              {[age ? `${age} yrs` : '', caste, basic.maritalStatus?.replace(/_/g, ' ')]
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
                {edu.highestQualification || 'Not specified'}
              </Text>
            </View>
            {!!location && (
              <View style={[styles.coverIconRow, verified && styles.coverRowBesideBadge]}>
                <MapPin color="#fff" size={13} />
                <Text style={[styles.coverIconText, styles.coverIconTextShrink]}>{location}</Text>
              </View>
            )}
          </LinearGradient>
          {verified && (
            <View style={styles.verifiedBadge} pointerEvents="none">
              <BadgeCheck color="#fff" size={16} fill="#1a7f37" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {Array.isArray(data?.galleryPhotos) && data.galleryPhotos.length > 0 && (
          data.galleryPhotos[0]?.locked ? (
            <LockedGalleryPreview count={data.galleryPhotos.length} onPress={handleViewContact} />
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              <GalleryPreviewGrid
                photos={data.galleryPhotos.map((p: any) => ({
                  publicId: p.publicId,
                  url: resolveImageUrl(p.url),
                }))}
              />
            </View>
          )
        )}

        {/* Action buttons -- side by side (client spec), Interest first */}
        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={[styles.interestBtn, togglingInterest && styles.interestBtnDisabled]}
            onPress={toggleInterestLocal}
            disabled={togglingInterest}
          >
            <Heart
              color="#D20236"
              fill={interested ? '#D20236' : 'transparent'}
              size={17}
            />
            <Text style={styles.interestText}>
              {interested ? 'Interested' : 'Interest'}
            </Text>
          </TouchableOpacity>

          {primaryAction === 'chat' ? (
            <TouchableOpacity style={styles.sendBtn} onPress={openChat}>
              <MessageCircle color="#fff" size={17} />
              <Text style={styles.sendText}>Chat Now</Text>
            </TouchableOpacity>
          ) : primaryAction === 'viewContact' ? (
            <TouchableOpacity
              style={[styles.sendBtn, unlockingContact && styles.sendBtnDisabled]}
              onPress={handleViewContact}
              disabled={unlockingContact}
            >
              <Contact color="#fff" size={17} />
              <Text style={styles.sendText}>
                {unlockingContact ? 'Unlocking...' : 'View Contact'}
              </Text>
            </TouchableOpacity>
          ) : primaryAction === 'waitingForChat' ? (
            <TouchableOpacity
              style={[styles.sendBtn, styles.sendBtnDisabled]}
              onPress={() =>
                Alert.alert(
                  'Almost there',
                  `Once ${name} also views your contact, you'll be able to chat.`,
                )
              }
            >
              <MessageCircle color="#fff" size={17} />
              <Text style={styles.sendText}>Chat Now</Text>
            </TouchableOpacity>
          ) : primaryAction === 'acceptRequest' ? (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={acceptIncomingRequest}
              disabled={acceptingRequest}
            >
              <UserCheck color="#fff" size={17} />
              <Text style={styles.sendText}>
                {acceptingRequest ? 'Accepting...' : 'Accept Request'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, requestStatus && styles.sendBtnDisabled]}
              onPress={sendRequest}
              disabled={!!requestStatus}
            >
              {requestStatus === 'PENDING' ? (
                <MailCheck color="#fff" size={17} />
              ) : (
                <Send color="#fff" size={17} />
              )}
              <Text style={styles.sendText}>
                {requestStatus === 'PENDING' ? 'Request Sent' : 'Send Request'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick links -- Shaadi.com reference: a plain scrollable tab
            navbar (not chips) that jumps to a section further down the
            page; the active tab turns red with an underline that animates
            in on select. A duplicate docks below the header (see above)
            once this one scrolls out of view. */}
        <View
          onLayout={(e: any) => {
            sectionY.current.quickLinks = e.nativeEvent.layout.y;
            quickLinksHeight.current = e.nativeEvent.layout.height;
          }}
        >
          <ScrollView
            ref={inlineLinksRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickLinksRow}
            contentContainerStyle={styles.quickLinksContent}
          >
            {quickLinkTabs.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={styles.navTab}
                onPress={() => selectQuickLink(key)}
                onLayout={(e: any) => { tabX.current[key] = e.nativeEvent.layout.x; }}
              >
                <Text style={[styles.navTabText, activeSection === key && styles.navTabTextActive]}>
                  {label}
                </Text>
                {activeSection === key && (
                  <Animated.View
                    style={[styles.navUnderline, { transform: [{ scaleX: underlineAnim }] }]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Personal Details */}
        <Section
          title="Personal Details"
          onLayout={(e: any) => { sectionY.current.personal = e.nativeEvent.layout.y; }}
        >
          <Row
            Icon={Calendar}
            label="Date of Birth"
            value={
              basic.dob ? new Date(basic.dob).toLocaleDateString('en-GB') : ''
            }
          />
          <Row Icon={Heart} label="Marital Status" value={formatChoice(basic.maritalStatus?.replace(/_/g, ' '))} />
          <Row Icon={Landmark} label="Religion" value={basic.religion} />
          <Row Icon={Users} label="Community" value={community} />
          <Row Icon={Ruler} label="Height" value={heightStr} />
          <Row Icon={Weight} label="Weight" value={weightStr} />
          <Row Icon={Utensils} label="Diet" value={life.diet || basic.diet} />
          <Row Icon={HeartPulse} label="Health Condition" value={healthCondition} />
          <Row Icon={Moon} label="Rashi" value={horo.rashi} />
          <Row Icon={Star} label="Nakshatra" value={horo.nakshatra} />
        </Section>

        {/* Hobbies */}
        {(hobbies.length > 0 || life.smoking || life.drinking) && (
          <Section
            title="Hobbies & Interests"
            onLayout={(e: any) => { sectionY.current.hobbies = e.nativeEvent.layout.y; }}
          >
            {hobbies.length > 0 && (
              <View style={styles.hobbyWrap}>
                {hobbies.slice(0, 9).map((h: string, i: number) => (
                  <View key={i} style={styles.hobbyChip}>
                    <Text style={styles.hobbyText}>{h}</Text>
                  </View>
                ))}
              </View>
            )}
            {(life.smoking || life.drinking) && (
              <View style={styles.lifestyleBadgeRow}>
                {!!life.smoking && (
                  <View style={styles.lifestyleBadge}>
                    <View style={styles.lifestyleBadgeIcon}>
                      <Cigarette color="#D20236" size={16} />
                    </View>
                    <Text style={styles.lifestyleBadgeText}>{formatChoice(life.smoking)}</Text>
                  </View>
                )}
                {!!life.drinking && (
                  <View style={styles.lifestyleBadge}>
                    <View style={styles.lifestyleBadgeIcon}>
                      <Wine color="#D20236" size={16} />
                    </View>
                    <Text style={styles.lifestyleBadgeText}>{formatChoice(life.drinking)}</Text>
                  </View>
                )}
              </View>
            )}
          </Section>
        )}

        {/* Contact Details */}
        <Section
          title="Contact Details"
          onLayout={(e: any) => { sectionY.current.contact = e.nativeEvent.layout.y; }}
        >
          <ContactRow
            Icon={MessageCircle}
            iconColor="#1a7f37"
            label="Whatsapp"
            value={contact?.mobile}
            isPremiumLocked={access?.shouldBlurSensitiveFields !== false}
            onLockedPress={handleViewContact}
          />
          <ContactRow
            Icon={Phone}
            iconColor="#333"
            label="Phone Number"
            value={contact?.mobile}
            isPremiumLocked={access?.shouldBlurSensitiveFields !== false}
            onLockedPress={handleViewContact}
          />
          <ContactRow
            Icon={Mail}
            iconColor="#333"
            label="Email ID"
            value={contact?.email}
            isPremiumLocked={access?.shouldBlurSensitiveFields !== false}
            onLockedPress={handleViewContact}
          />
        </Section>

        {/* Education */}
        <Section
          title="Education Details"
          onLayout={(e: any) => { sectionY.current.education = e.nativeEvent.layout.y; }}
        >
          <Row Icon={GraduationCap} label="Highest Qualification" value={edu.highestQualification} />
          <Row Icon={School} label="College / University" value={edu.college} />
        </Section>

        {/* Employment */}
        <Section
          title="Employment Details"
          onLayout={(e: any) => { sectionY.current.employment = e.nativeEvent.layout.y; }}
        >
          <Row Icon={Briefcase} label="Employment Type" value={emp.employedType?.replace(/_/g, ' ')} />
          {!isAgriculture && <>
          {(isJob || isBusiness) && <Row Icon={IdCard} label={isGovernment ? 'Name of the department' : isBusiness ? 'Designation' : 'Profession'} value={emp.designation} />}
          {isJob && <Row Icon={Building2} label={isGovernment ? 'Work as' : 'Company Name'} value={emp.companyName} onLockedPress={handleViewContact} />}
          {isBusiness && <>
            <Row Icon={Building2} label="Firm Name" value={emp.companyName} onLockedPress={handleViewContact} />
            <Row Icon={Store} label="Type of Business" value={emp.typeOfBusiness} />
          </>}
          {(isJob || isBusiness) && <Row Icon={MapPin} label={isBusiness ? 'Firm Location' : 'Work Location'} value={emp.companyLocation} onLockedPress={handleViewContact} />}
          {isGovernment && <Row Icon={ClipboardList} label="Job Type" value={emp.jobType?.replace(/_/g, ' ')} />}
          <Row Icon={IndianRupee} label="Annual Income" value={formatIncomeBucket(emp.annualIncome)} />
          {isJob && <Row Icon={Clock} label="Work Experience" value={emp.totalExperience ? `${emp.totalExperience} Years` : emp.totalExperienceYears || emp.totalExperienceMonths ? `${emp.totalExperienceYears || 0} Years ${emp.totalExperienceMonths || 0} Months` : ''} />}
          {isJob && <Row Icon={Link} label="LinkedIn Link" value={emp.linkedInProfile} onLockedPress={handleViewContact} />}
          </>}
          {isAgriculture && <Row Icon={IndianRupee} label="Annual Income" value={formatIncomeBucket(emp.annualIncome)} />}
        </Section>

        {/* Family */}
        <Section
          title="Family Details"
          onLayout={(e: any) => { sectionY.current.family = e.nativeEvent.layout.y; }}
        >
          <Row
            Icon={User}
            label="Father"
            value={
              fam.fatherName === 'blur' || fam.fatherOccupation === 'blur'
                ? 'blur'
                : fam.fatherName
                  ? `${fam.fatherName}${
                      fam.fatherOccupation ? ` - ${fam.fatherOccupation}` : ''
                    }`
                  : ''
            }
          />
          <Row
            Icon={UserRound}
            label="Mother"
            value={
              fam.motherName === 'blur' || fam.motherOccupation === 'blur'
                ? 'blur'
                : fam.motherName
                  ? `${fam.motherName}${
                      fam.motherOccupation ? ` - ${fam.motherOccupation}` : ''
                    }`
                  : ''
            }
          />
          <Row
            Icon={UsersRound}
            label="Siblings"
            value={
              fam.brothers === 'blur' || fam.sisters === 'blur'
                ? 'blur'
                : fam.brothers || fam.sisters
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

        {/* Location */}
        <Section
          title="Location"
          onLayout={(e: any) => { sectionY.current.location = e.nativeEvent.layout.y; }}
        >
          <Row
            Icon={MapPin}
            label="Present Address"
            value={fmtAddr(addr.current)}
            onLockedPress={handleViewContact}
          />
          <Row
            Icon={MapPinned}
            label="Permanent Address"
            value={fmtAddr(addr.permanent)}
            onLockedPress={handleViewContact}
          />
        </Section>

        {/* Partner Preferences */}
        <Section
          title="Partner Preferences"
          onLayout={(e: any) => { sectionY.current.preferences = e.nativeEvent.layout.y; }}
        >
          <Row
            Icon={Calendar}
            label="Preferred Age Range"
            value={
              pref.ageRange
                ? `${pref.ageRange.min} yrs to ${pref.ageRange.max} yrs`
                : ''
            }
          />
          <Row
            Icon={Users}
            label="Preferred Caste"
            value={pref.caste
              ?.map((c: any) => c?.casteName || c?.name)
              .filter(Boolean)
              .join(', ')}
          />
          <Row
            Icon={UsersRound}
            label="Preferred Sub Caste"
            value={pref.subCaste?.join?.(', ')}
          />
          <Row
            Icon={Heart}
            label="Preferred Marital Status"
            value={pref.maritalStatus
              ?.map((status: string) => status?.replace(/_/g, ' '))
              .join(', ')}
          />
          <Row
            Icon={GraduationCap}
            label="Preferred Education"
            value={pref.education?.join?.(', ')}
          />
          <Row
            Icon={MapPin}
            label="Preferred Resident"
            value={pref.ressident?.join?.(', ')}
          />
        </Section>

        <View onLayout={(e: any) => { sectionY.current.match = e.nativeEvent.layout.y; }}>
          <MatchBreakdownSection
            myPhoto={myPhoto}
            theirPhoto={photo}
            theirName={name}
            fields={matchBreakdown.fields}
            // Heading counts every point incl. the extra (unscored) ones;
            // the card percentage still uses matchedCount/totalCount.
            matchedCount={matchBreakdown.allMatchedCount ?? matchBreakdown.matchedCount}
            totalCount={matchBreakdown.allTotalCount ?? matchBreakdown.totalCount}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerSolid: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  circleBtnSolid: { backgroundColor: '#f5f5f5' },
  headerTitle: { fontSize: 17, fontFamily: 'Outfit-Bold', color: '#000', flexShrink: 1 },
  headerIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
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
    top: 44,
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
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionsMenuText: { fontSize: 14, fontFamily: 'Outfit-Medium', color: '#333' },
  optionsMenuTextDanger: { color: '#D20236' },
  coverWrap: { height: SCREEN_HEIGHT * 0.6, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#ccc' },
  // See-through green badge in the cover's bottom-right corner, level with
  // the location line (which leaves room for it via coverRowBesideBadge).
  verifiedBadge: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,127,55,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
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
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 70,
  },
  coverName: { color: '#fff', fontSize: 24, fontFamily: 'Outfit-Bold' },
  coverMeta: { color: '#fff', fontSize: 13, marginTop: 4 },
  coverProfileCode: { color: '#fff', fontSize: 13, fontFamily: 'Outfit-SemiBold', marginTop: 2 },
  coverIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  coverIconText: { color: '#fff', fontSize: 12 },
  coverIconTextShrink: { flexShrink: 1 },
  coverRowBesideBadge: { paddingRight: 100 },
  quickLinksRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dockedQuickLinks: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quickLinksContent: {
    paddingHorizontal: 16,
  },
  navTab: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  navTabText: { fontSize: 14, color: '#666', fontFamily: 'Outfit-SemiBold' },
  navTabTextActive: { color: '#D20236' },
  navUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D20236',
  },
  actionWrap: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    gap: 10,
  },
  sendBtn: {
    flex: 1,
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit-Bold' },
  interestBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  interestBtnDisabled: { opacity: 0.6 },
  interestText: { color: '#D20236', fontSize: 15, fontFamily: 'Outfit-Bold' },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
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
  rowLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fdf2f5',
    alignItems: 'center',
    justifyContent: 'center',
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
  lifestyleBadgeRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 10,
  },
  lifestyleBadge: { alignItems: 'center', gap: 6 },
  lifestyleBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f0d0d8',
    backgroundColor: '#fdf2f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifestyleBadgeText: { fontSize: 12, color: '#333', fontFamily: 'Outfit-Medium' },
  sendBtnDisabled: { backgroundColor: '#e69aab' },
  lockedInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactValue: { fontSize: 14, color: '#000', fontFamily: 'Outfit-Medium' },
  notProvided: { fontSize: 14, color: '#bbb', fontStyle: 'italic', flex: 1, textAlign: 'right' },
});
