import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import {
  X,
  UserCircle,
  Pencil,
  Users,
  Heart,
  MessageCircle,
  Eye,
  Crown,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react-native';
import { resolveImageUrl } from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  firstName?: string;
  profileCode?: string;
  profilePhoto?: string;
  planName?: string;
};

// Shaadi.com-style hamburger drawer (client reference) -- a left-sliding
// panel of navigation shortcuts into screens that already exist elsewhere
// in the app (bottom tabs / stack screens), nothing new is built here.
export default function HomeDrawerMenu({
  visible,
  onClose,
  navigation,
  firstName,
  profileCode,
  profilePhoto,
  planName,
}: Props) {
  const { logout } = useAuth();
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [copied, setCopied] = useState(false);

  const copyProfileId = () => {
    if (!profileCode) return;
    Clipboard.setString(profileCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -PANEL_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateX, backdropOpacity]);

  const go = (screen: string, params?: object) => {
    onClose();
    navigation.navigate(screen, params);
  };

  const handleLogout = () => {
    onClose();
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const items = [
    { Icon: Pencil, label: 'Edit Profile', onPress: () => go('EditProfile') },
    { Icon: UserCircle, label: 'My Profile', onPress: () => go('ProfileTab') },
    { Icon: Users, label: 'Matches', onPress: () => go('SearchTab') },
    { Icon: Heart, label: 'Interests', onPress: () => go('InterestsTab') },
    { Icon: MessageCircle, label: 'Chat', onPress: () => go('ChatTab') },
    { Icon: Eye, label: 'Profile Viewers', onPress: () => go('ProfileViewers') },
    { Icon: Crown, label: 'Membership Plans', onPress: () => go('Plans') },
    { Icon: SettingsIcon, label: 'Settings', onPress: () => go('Settings') },
    { Icon: HelpCircle, label: 'Help & Support', onPress: () => go('HelpSupport') },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <View style={styles.panelHeader}>
            <View style={styles.profileRow}>
              {profilePhoto ? (
                <Image source={{ uri: resolveImageUrl(profilePhoto) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <UserCircle color="#D20236" size={30} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name} numberOfLines={1}>{firstName || 'there'}</Text>
                {!!profileCode && (
                  <TouchableOpacity
                    style={styles.codeRow}
                    onPress={copyProfileId}
                    activeOpacity={0.6}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.code} numberOfLines={1}>{profileCode}</Text>
                    {copied ? (
                      <Check color="#1a7f37" size={13} />
                    ) : (
                      <Copy color="#888" size={13} />
                    )}
                  </TouchableOpacity>
                )}
                {!!planName && (
                  <View style={styles.planRow}>
                    <Crown color="#D20236" size={12} />
                    <Text style={styles.planText}>{planName}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color="#333" size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {items.map(({ Icon, label, onPress }) => (
              <TouchableOpacity key={label} style={styles.item} onPress={onPress} activeOpacity={0.7}>
                <Icon color="#555" size={19} />
                <Text style={styles.itemLabel}>{label}</Text>
                <ChevronRight color="#ccc" size={17} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut color="#D20236" size={18} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    backgroundColor: '#fff',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 2, height: 0 },
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  avatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: '#D20236' },
  avatarPlaceholder: { backgroundColor: '#fce4ec', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  code: { fontSize: 12, color: '#888', fontFamily: 'Outfit-Medium' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  planText: { fontSize: 11, color: '#666', fontFamily: 'Outfit-Medium' },
  list: { paddingVertical: 8, paddingBottom: 30 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  itemLabel: { flex: 1, fontSize: 14.5, color: '#333', fontFamily: 'Outfit-Medium' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 12,
    paddingVertical: 13,
    marginHorizontal: 18,
    marginTop: 16,
  },
  logoutText: { fontSize: 14.5, fontFamily: 'Outfit-Bold', color: '#D20236' },
});
