import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: January 2026</Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.body}>
          We collect information you provide during signup and profile creation, including your name, contact
          details, photos, Aadhaar details, and preferences, to help you find suitable matches.
        </Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.body}>
          Your information is used to create your profile, verify your identity, match you with other users,
          process payments, and improve our services. We do not sell your personal data to third parties.
        </Text>

        <Text style={styles.heading}>3. Aadhaar & Identity Data</Text>
        <Text style={styles.body}>
          Aadhaar details are collected solely for identity verification purposes and are stored securely.
          This information is never shared publicly on your profile.
        </Text>

        <Text style={styles.heading}>4. Contact Information Sharing</Text>
        <Text style={styles.body}>
          Your mobile number and email are only revealed to other users after mutual connection or when a
          profile is unlocked, in accordance with your membership access level.
        </Text>

        <Text style={styles.heading}>5. Data Security</Text>
        <Text style={styles.body}>
          We use industry-standard security measures, including encrypted storage and secure payment processing,
          to protect your personal information.
        </Text>

        <Text style={styles.heading}>6. Your Rights</Text>
        <Text style={styles.body}>
          You can edit your profile information at any time. You may also request account deletion, after
          which your data will be handled according to our data retention policy.
        </Text>

        <Text style={styles.heading}>7. Cookies & Tracking</Text>
        <Text style={styles.body}>
          Our app may use device identifiers and analytics tools to improve performance and user experience.
        </Text>

        <Text style={styles.heading}>8. Third-Party Services</Text>
        <Text style={styles.body}>
          We use trusted third-party services for payments and cloud storage. These providers are bound by
          their own privacy and security obligations.
        </Text>

        <Text style={styles.heading}>9. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy periodically. Continued use of the app after changes constitutes
          acceptance of the updated policy.
        </Text>

        <Text style={styles.heading}>10. Contact Us</Text>
        <Text style={styles.body}>
          For privacy-related questions, reach out to us at support@shubhakalyanam.com.
        </Text>
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
  scroll: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: '#999', marginBottom: 20 },
  heading: { fontSize: 15, fontWeight: '700', color: '#000', marginTop: 18, marginBottom: 8 },
  body: { fontSize: 13, color: '#555', lineHeight: 20 },
});