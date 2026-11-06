import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCheck, MapPin, Briefcase, Phone, Mail, Globe, Star } from 'lucide-react-native';
import { resolveImageUrl } from '../../utils/imageUrl';
import BackArrowIcon from '../../components/BackArrowIcon';

// A vendor's own page, opened by tapping a vendor on Home or in the Vendor
// Directory -- like opening a member's profile. The vendor comes in the route
// params (the list screens already loaded it), so nothing is fetched here.
export default function VendorDetailScreen({ navigation, route }: any) {
  const vendor = route?.params?.vendor || {};
  const imageUrl = vendor.image?.url ? resolveImageUrl(vendor.image.url) : '';
  const experience = Number(vendor.experience) || 0;

  const call = () => {
    if (vendor.contactNumber) Linking.openURL(`tel:${vendor.contactNumber}`);
  };
  const mail = () => {
    if (vendor.email) Linking.openURL(`mailto:${vendor.email}`);
  };
  const openWebsite = () => {
    if (!vendor.portfolioLink) return;
    const url = /^https?:\/\//i.test(vendor.portfolioLink)
      ? vendor.portfolioLink
      : `https://${vendor.portfolioLink}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]} />
        )}

        <View style={styles.nameRow}>
          <Text style={styles.name}>{vendor.vendorName || 'Vendor'}</Text>
          <View style={styles.verifiedBadge}>
            <BadgeCheck color="#fff" size={13} />
          </View>
        </View>

        {!!vendor.serviceCategory && (
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{vendor.serviceCategory}</Text>
          </View>
        )}

        <View style={styles.card}>
          <InfoRow Icon={Briefcase} label="Service" value={vendor.serviceCategory} />
          <InfoRow Icon={MapPin} label="Location" value={vendor.location} />
          <InfoRow
            Icon={Star}
            label="Experience"
            value={experience > 0 ? `${experience}+ Years` : ''}
          />
          <InfoRow
            Icon={Phone}
            label="Phone"
            value={vendor.contactNumber ? `+91 ${vendor.contactNumber}` : ''}
            onPress={call}
          />
          <InfoRow Icon={Mail} label="Email" value={vendor.email} onPress={mail} />
          <InfoRow Icon={Globe} label="Website" value={vendor.portfolioLink} onPress={openWebsite} last />
        </View>

        {!!vendor.about && (
          <View style={styles.card}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.about}>{vendor.about}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.contactBtn, !vendor.contactNumber && styles.btnDisabled]}
          onPress={call}
          disabled={!vendor.contactNumber}
        >
          <Phone color="#fff" size={16} />
          <Text style={styles.contactBtnText}>Contact Vendor</Text>
        </TouchableOpacity>
        {!!vendor.portfolioLink && (
          <TouchableOpacity style={styles.websiteBtn} onPress={openWebsite}>
            <Globe color="#333" size={16} />
            <Text style={styles.websiteBtnText}>Website</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({
  Icon, label, value, onPress, last,
}: {
  Icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  if (!value) return null;
  const content = (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.iconCircle}>
        <Icon color="#D20236" size={15} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, onPress && styles.rowValueLink]}>{value}</Text>
    </View>
  );
  return onPress ? (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{content}</TouchableOpacity>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  hero: { width: '100%', height: 230, borderRadius: 16, backgroundColor: '#eee' },
  heroPlaceholder: { backgroundColor: '#ddd' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  name: { fontSize: 22, fontFamily: 'Outfit-Bold', color: '#000', flexShrink: 1 },
  verifiedBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#D20236',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryChip: {
    alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#fdf2f5',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  categoryText: { fontSize: 13, color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  card: {
    marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f0f0f0',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f4f4f4',
  },
  rowLast: { borderBottomWidth: 0 },
  iconCircle: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#fdf2f5',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, color: '#888', minWidth: 80 },
  rowValue: {
    flex: 1, fontSize: 14, color: '#000', fontFamily: 'Outfit-Medium', textAlign: 'right',
  },
  rowValueLink: { color: '#D20236' },
  aboutTitle: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000', marginTop: 10 },
  about: { fontSize: 14, color: '#555', lineHeight: 20, marginTop: 6, marginBottom: 12 },
  footer: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff',
  },
  contactBtn: {
    flex: 1, flexDirection: 'row', gap: 8, backgroundColor: '#D20236', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  contactBtnText: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#fff' },
  websiteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 18,
  },
  websiteBtnText: { fontSize: 16, fontFamily: 'Outfit-SemiBold', color: '#333' },
});
