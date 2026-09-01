import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

type Section = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  additionalParagraphs?: string[];
};

// Kept in sync with the web app's Privacy Policy content
// (matrimony-user/src/features/static/StaticInfoPage.jsx -> pageContent.privacy).
const SECTIONS: Section[] = [
  {
    heading: '1. Introduction',
    paragraphs: [
      'Shubhakalyana.com is an online matrimonial portal dedicated to providing matchmaking services. This Privacy Policy applies to all websites and mobile applications operated under Shubhakalyana.com.',
      'By accessing or using our platform, you consent to the collection, use, storage, and processing of your information in accordance with this Privacy Policy. If you do not agree, please refrain from using our website or apps.',
    ],
  },
  {
    heading: '2. Information We Collect',
    paragraphs: ['We may collect the following information from members and visitors:'],
    bullets: [
      'Personal details: name, date of birth, email, phone number, mailing address, zip/pin code.',
      'Profile content: photos, videos, educational qualifications.',
      'Identity proof documents (with explicit consent) for verification purposes.',
      'Login credentials: user-specified password.',
      'Payment details: billing address, credit/debit card information, cheque/demand draft tracking.',
      'Device and technical data: device ID, log files, geographic location, specifications.',
      'Social login data: information shared via Facebook, Google, LinkedIn, or other platforms.',
      'Cookies: used to store login information and enhance user experience.',
    ],
  },
  {
    heading: '3. Use of Information',
    paragraphs: ['Your information may be used for:'],
    bullets: [
      'Authentication and account access.',
      'Verification and fraud prevention.',
      'Data analysis, usage trends, and marketing research.',
      'Improving services and personalization.',
      'Communication and customer support.',
    ],
  },
  {
    heading: '4. Sharing of Information',
    paragraphs: ['We may share your information with:'],
    bullets: [
      'Affiliates, associates, and subsidiaries for service delivery.',
      'Regulators and law enforcement agencies when required by law.',
      'Verification agencies, gateway service providers, and anti-fraud partners.',
      'Third parties during corporate transactions such as merger, acquisition, reorganization, or asset sale.',
    ],
    additionalParagraphs: [
      'We are not responsible for the privacy practices of linked third-party websites or apps.',
    ],
  },
  {
    heading: '5. Data Retention',
    paragraphs: ['We retain user information:'],
    bullets: [
      'For as long as you subscribe to our services.',
      'To enforce agreements, perform audits, resolve disputes, establish legal defenses, and comply with applicable laws.',
    ],
  },
  {
    heading: '6. Security Measures',
    paragraphs: [
      'We implement organizational and technical safeguards to protect your personal information.',
      'While we strive to ensure security, please note that no system can guarantee 100% protection over the internet.',
    ],
  },
  {
    heading: '7. Changes to Privacy Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time without prior notice. All changes will be reflected on the Privacy Policy page.',
    ],
  },
  {
    heading: '8. Grievance Redressal',
    paragraphs: [
      'For any concerns, please contact our Grievance Officer:',
      'grievanceofficer@shubhakalyana.com',
      'Available: Monday to Saturday, 10 AM – 6 PM IST (excluding Sundays and public holidays).',
      'The Grievance Officer is appointed as per Section 5(9) of the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.',
    ],
  },
];

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
        {SECTIONS.map((section, index) => (
          <View key={index}>
            <Text style={styles.heading}>{section.heading}</Text>

            {section.paragraphs?.map((paragraph, i) => (
              <Text key={i} style={styles.body}>
                {paragraph}
              </Text>
            ))}

            {section.bullets?.map((bullet, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>{'•'}</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}

            {section.additionalParagraphs?.map((paragraph, i) => (
              <Text key={`extra-${i}`} style={styles.body}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
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
  headerTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  scroll: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#000', marginTop: 18, marginBottom: 8 },
  body: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', marginBottom: 6, paddingRight: 4 },
  bulletDot: { fontSize: 13, color: '#555', lineHeight: 20, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
});
