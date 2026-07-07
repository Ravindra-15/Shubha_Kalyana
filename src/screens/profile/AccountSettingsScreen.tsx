import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Edit3, Phone, Mail, Lock, CreditCard, Trash2, LogOut, ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function AccountSettingsScreen({ navigation }: any) {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const sections = [
    {
      title: 'PROFILE',
      items: [
        { label: 'Edit Personal Information', Icon: Edit3, onPress: () => navigation.navigate('EditProfile') },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { label: 'Verify Mobile Number', Icon: Phone, onPress: () => navigation.navigate('VerifyMobileNumber') },
        { label: 'Change Email', Icon: Mail, onPress: () => navigation.navigate('ChangeEmail') },
        { label: 'Change MPIN', Icon: Lock, onPress: () => navigation.navigate('ChangeMpin') },
      ],
    },
    {
      title: 'PAYMENT',
      items: [
        { label: 'Payment History', Icon: CreditCard, onPress: () => navigation.navigate('PaymentHistory') },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
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

        <View style={{ marginBottom: 14 }}>
          <Text style={styles.sectionTitleDanger}>DANGER ZONE</Text>
          <View style={styles.box}>
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('DeleteAccount')}
            >
              <Trash2 color="#D20236" size={18} />
              <Text style={[styles.rowLabel, { color: '#D20236' }]}>Delete Account</Text>
              <ChevronRight color="#ccc" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#D20236" size={18} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  sectionTitleDanger: { fontSize: 12, color: '#D20236', fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  box: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f0f0f0' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rowLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: '#D20236', borderRadius: 14, paddingVertical: 15, marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#D20236' },
});