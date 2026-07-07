import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Globe, CreditCard, HelpCircle, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen({ navigation }: any) {
  const sections = [
    {
      title: 'ACCOUNT',
      items: [{ label: 'Account Settings', Icon: User, onPress: () => navigation.navigate('AccountSettings') }],
    },
    {
      title: 'PREFERENCES',
      items: [{ label: 'Language', Icon: Globe, onPress: () => navigation.navigate('ChooseLanguage') }],
    },
    {
      title: 'MEMBERSHIP',
      items: [{ label: 'Membership & Billing', Icon: CreditCard, onPress: () => navigation.navigate('Plans') }],
    },
    {
      title: 'SUPPORT',
      items: [{ label: 'Help & Support', Icon: HelpCircle, onPress: () => navigation.navigate('HelpSupport') }],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} style={{ marginBottom: 22 }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.box}>
              {section.items.map(({ label, Icon, onPress }, i) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.row, i === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={onPress}
                >
                  <Icon color="#333" size={18} />
                  <Text style={styles.rowLabel}>{label}</Text>
                  <ChevronRight color="#ccc" size={18} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>App Version 1.0.0</Text>
        <Text style={styles.footer}>© 2026 shubhakalyana. All rights reserved.</Text>
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
  sectionTitle: { fontSize: 12, color: '#999', fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  box: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f0f0f0' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rowLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 4 },
});