import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsAndConditionsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: January 2026</Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By creating an account on Shubhakalyanam, you agree to be bound by these Terms & Conditions.
          If you do not agree, please do not use the platform.
        </Text>

        <Text style={styles.heading}>2. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 18 years old and legally eligible to marry under applicable law to use this platform.
        </Text>

        <Text style={styles.heading}>3. Genuine Use Only</Text>
        <Text style={styles.body}>
          Shubhakalyanam is built for genuine matchmaking purposes only. Commercial use, marriage bureaus,
          or falsification of profile information are strictly prohibited and may be reported to law enforcement.
        </Text>

        <Text style={styles.heading}>4. Account Verification</Text>
        <Text style={styles.body}>
          You agree to provide accurate identity documents (such as Aadhaar) for verification. Profiles found
          to contain false information may be suspended or removed without notice.
        </Text>

        <Text style={styles.heading}>5. Membership & Payments</Text>
        <Text style={styles.body}>
          Membership plans and profile unlocks are billed as described at the time of purchase. All payments
          are processed securely through our payment partner and are subject to their terms as well.
        </Text>

        <Text style={styles.heading}>6. User Conduct</Text>
        <Text style={styles.body}>
          You agree not to harass, abuse, or send inappropriate content to other users. Violations may result
          in account suspension, blocking, or reporting to authorities.
        </Text>

        <Text style={styles.heading}>7. Account Termination</Text>
        <Text style={styles.body}>
          We reserve the right to suspend or delete accounts that violate these terms. You may also request
          deletion of your account at any time through Account Settings.
        </Text>

        <Text style={styles.heading}>8. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these Terms & Conditions from time to time. Continued use of the platform after changes
          constitutes acceptance of the updated terms.
        </Text>

        <Text style={styles.heading}>9. Contact</Text>
        <Text style={styles.body}>
          For questions about these terms, contact us at support@shubhakalyanam.com.
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