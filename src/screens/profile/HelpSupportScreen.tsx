import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, HelpCircle, Phone, AlertTriangle, FileText, Shield, Mail, ChevronRight,
} from 'lucide-react-native';

export default function HelpSupportScreen({ navigation }: any) {
  const supportSections = [
    { label: 'FAQs', Icon: HelpCircle, onPress: () => navigation.navigate('Faqs') },
    { label: 'Contact Support', Icon: Phone, onPress: () => navigation.navigate('ContactSupport') },
    { label: 'Report User', Icon: AlertTriangle, onPress: () => navigation.navigate('ReportUser'), danger: true },
  ];

  const legalSections = [
    { label: 'Terms & Conditions', Icon: FileText, onPress: () => navigation.navigate('TermsAndConditions') },
    { label: 'Privacy Policy', Icon: Shield, onPress: () => navigation.navigate('PrivacyPolicy') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.box}>
          {supportSections.map(({ label, Icon, onPress, danger }, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.row, i === supportSections.length - 1 && { borderBottomWidth: 0 }]}
              onPress={onPress}
            >
              <Icon color={danger ? '#D20236' : '#333'} size={18} />
              <Text style={[styles.rowLabel, danger && { color: '#D20236' }]}>{label}</Text>
              <ChevronRight color="#ccc" size={18} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 16 }} />

        <View style={styles.box}>
          {legalSections.map(({ label, Icon, onPress }, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.row, i === legalSections.length - 1 && { borderBottomWidth: 0 }]}
              onPress={onPress}
            >
              <Icon color="#333" size={18} />
              <Text style={styles.rowLabel}>{label}</Text>
              <ChevronRight color="#ccc" size={18} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Contact Information</Text>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('tel:+911800123456')}
          >
            <View style={styles.contactIconWrap}>
              <Phone color="#2b6cb0" size={16} />
            </View>
            <View>
              <Text style={styles.contactLabel}>Support Helpline</Text>
              <Text style={styles.contactValue}>+91 1800 123 4567</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:support@shubhakalyanam.com')}
          >
            <View style={styles.contactIconWrap}>
              <Mail color="#2b6cb0" size={16} />
            </View>
            <View>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>shubhakalyanam.com</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  scroll: { padding: 16, paddingBottom: 30 },
  box: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f0f0f0' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rowLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  contactCard: {
    backgroundColor: '#eef4fc', borderRadius: 14, padding: 18, marginTop: 20,
  },
  contactTitle: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 14 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  contactIconWrap: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: { fontSize: 12, color: '#666' },
  contactValue: { fontSize: 14, fontWeight: '600', color: '#000', marginTop: 2 },
});