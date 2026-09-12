import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldAlert, ChevronRight } from 'lucide-react-native';

type Section = {
  heading: string;
  bullets?: string[];
  paragraphs?: string[];
};

const sections: Section[] = [
  {
    heading: 'Reportable Violations',
    bullets: [
      'Obscene or inappropriate emails sent by a member',
      'Fraudulent or obscene profiles suspected to contain false information',
      'Harassing emails or repeated unwanted communication',
      'Fake or misleading photographs used in a profile',
      'Solicitation attempts from businesses or individuals (ads, promotions, unrelated material)',
    ],
  },
  {
    heading: 'Disclaimer',
    paragraphs: [
      'All reports are treated confidentially and handled promptly. Our moderation team will review the complaint and take necessary action.',
    ],
  },
  {
    heading: '1. Obscene / Fake / Misleading Profile',
    bullets: [
      'Incorrect profile information',
      'Phone number is incorrect or unreachable',
      'More than one profile on Shubhakalyana.com',
      'Photo belongs to someone else',
      'Not responding',
    ],
  },
  {
    heading: '2. Inappropriate / Unacceptable Behaviour',
    bullets: [
      'Member uses abusive or indecent language',
      'Member calls or texts me repeatedly',
      'Looking for dating or casual relationship',
      'Asking for money / scammer',
    ],
  },
  {
    heading: '3. I Know This Person',
    bullets: [
      'Member is already married or engaged',
      'Told by member over chat or phone',
      'Found through social media or acquaintance',
      'Duplicate / fraud profile',
    ],
  },
  {
    heading: '4. Photo Related',
    bullets: ['Irrelevant photo', 'Inappropriate or indecent photo', 'Photo belongs to someone else'],
  },
  {
    heading: '5. Other Reason',
    paragraphs: [
      'If none of the above apply, describe your issue in your own words and our team will review it.',
    ],
  },
];

export default function ReportUserScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report User</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <ShieldAlert color="#D20236" size={22} />
          <Text style={styles.introText}>
            Your safety matters to us. If you experience any of the issues below, let us know and our
            moderation team will review it promptly.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>How to Report</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:+918012345678')}>
            <Text style={styles.sectionParagraph}>
              Call us at <Text style={styles.link}>+91 80 1234 5678</Text> (10 AM – 7 PM)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@shubhakalyana.com')}>
            <Text style={styles.sectionParagraph}>
              Email us at <Text style={styles.link}>support@shubhakalyana.com</Text> with details of the
              violation.
            </Text>
          </TouchableOpacity>
        </View>

        {sections.map((section) => (
          <View key={section.heading} style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            {section.paragraphs?.map((p, i) => (
              <Text key={i} style={styles.sectionParagraph}>
                {p}
              </Text>
            ))}
            {section.bullets?.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={styles.helpLinkCard}
          onPress={() => navigation.navigate('ContactSupport')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.helpLinkTitle}>Need help with something else?</Text>
            <Text style={styles.helpLinkDesc}>Reach out to our support team directly</Text>
          </View>
          <ChevronRight color="#D20236" size={18} />
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
  headerTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  scroll: { padding: 20, paddingBottom: 40 },
  introCard: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fdf2f5',
    borderRadius: 14, padding: 16, marginBottom: 16, alignItems: 'flex-start',
  },
  introText: { flex: 1, fontSize: 13, color: '#333', lineHeight: 19 },
  sectionCard: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 14,
    padding: 16, marginBottom: 12,
  },
  sectionHeading: { fontSize: 14, fontFamily: 'Outfit-Bold', color: '#000', marginBottom: 8 },
  sectionParagraph: { fontSize: 12.5, color: '#555', lineHeight: 19, marginBottom: 6 },
  link: { color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  bulletDot: { fontSize: 13, color: '#D20236', lineHeight: 19 },
  bulletText: { flex: 1, fontSize: 12.5, color: '#555', lineHeight: 19 },
  helpLinkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f7f7f7', borderRadius: 14, padding: 16, marginTop: 8,
  },
  helpLinkTitle: { fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#000' },
  helpLinkDesc: { fontSize: 12, color: '#888', marginTop: 2 },
});
