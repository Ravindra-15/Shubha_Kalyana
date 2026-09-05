import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

type Section = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

// Kept in sync with the web app's Terms & Conditions content
// (matrimony-user/src/features/static/StaticInfoPage.jsx -> pageContent.terms).
const SECTIONS: Section[] = [
  {
    heading: 'Welcome to Shubhakalyana.com',
    paragraphs: [
      'Welcome to Shubhakalyana.com, your trusted online matchmaking platform. These Terms of Use ("Agreement") outline the rules and conditions that govern your access to and use of the Shubhakalyana.com website ("Site"), mobile application ("Application"), and related services (collectively, the "Platform"). The Platform is owned and operated by Shubha Kalyana Matrimony Services Private Limited.',
      'This Agreement is published in accordance with Rule 3(1) of the Information Technology (Intermediaries Guidelines and Digital Media Ethics Code) Rules, 2021. By visiting, browsing, registering, or otherwise interacting with the Platform, you agree to be bound by these Terms of Use. If the terms are updated or modified, your continued use of the Platform will be treated as acceptance of the revised Agreement.',
    ],
  },
  {
    heading: 'Purpose of the Platform',
    paragraphs: [
      'Shubhakalyana.com is designed as a digital advertising and matchmaking facilitation service. It enables individuals to create and promote matrimonial profiles, connect with potential partners, and communicate through targeted tools and features. The Platform replaces traditional newspaper classifieds with modern, secure, and user-friendly digital outreach.',
    ],
  },
  {
    heading: 'Definitions',
    bullets: [
      'User: Any individual who accesses the Platform with the intention of registering, creating, or managing a matrimonial profile for genuine purposes.',
      'Member: A User who completes registration by submitting personal information. Membership may be free or paid, depending on the services chosen.',
    ],
  },
  {
    heading: 'Membership & Services',
    paragraphs: [
      'Access to the Platform is free of charge. However, Shubhakalyana.com also offers Premium Memberships that provide enhanced features such as:',
    ],
    bullets: [
      'Higher visibility in search results.',
      'Priority placement in inboxes.',
      'Profile promotion across the Platform.',
      'Access to advanced communication tools including messaging and chat.',
      'Shubha Kalyana Matrimony reserves the exclusive right to grant or deny membership to any individual.',
      'The company may, at its sole discretion, revise, update, or amend this Agreement at any time. Continued use of the Platform after such changes will be deemed as acceptance of the modified terms.',
    ],
  },
  {
    heading: 'Acceptance of Terms',
    bullets: [
      'Legal Status of the Platform: The Platform functions as an "intermediary" under Section 2(w) of the Information Technology Act, 2000. This Agreement constitutes an electronic record under the Act and applicable Rules. It is generated electronically and does not require physical or digital signatures.',
      'Consent to Data Collection & Processing: By registering and using the Services, you expressly consent to the collection, storage, processing, usage, and disclosure of your personal and sensitive personal information in accordance with applicable laws.',
      'Verification & Safety Measures: You further consent to Shubha Kalyana Matrimony engaging third-party tools, agencies, or subcontractors to verify the authenticity of information provided.',
      'Non-Consent: If you do not agree to the collection or processing of your personal or sensitive data as described above, you should refrain from registering or using the Platform.',
      'Withdrawal of Consent: If you wish to withdraw your consent or object to the continued collection, processing, or storage of your data, you must discontinue use of the Platform.',
    ],
  },
  {
    heading: 'Eligibility & Membership',
    bullets: [
      'Legal Competence: To register as a Member and access the Services, an individual must be legally competent to enter into a binding contract under the Indian Contract Act, 1872. In addition, the person must have attained the minimum marriageable age prescribed under Indian law—21 years or above for males and 18 years or above for females.',
      'Purpose of the Platform: The Platform is intended exclusively for individuals seeking a lawful matrimonial alliance.',
      'User Representations & Warranties: Users represent that they are natural persons, legally competent to enter into this Agreement, and that all information provided is accurate, lawful, and not misleading.',
      'Bona Fide Intention: Members must register with the genuine intention of entering into matrimony.',
      'Right to Terminate Membership: Shubha Kalyana Matrimony reserves the right to suspend or cancel membership where a Member is ineligible, provides false information, breaches this Agreement, or violates applicable law.',
      'Match Suggestions & Member Responsibility: Match suggestions are generated algorithmically based on partner preferences. Members should independently verify information shared by other Members.',
      'Promotional Communications & Privacy Safeguards: Personally identifiable information or sensitive personal data will not be shared with third parties for promotional purposes except as expressly permitted under this Agreement and applicable law.',
    ],
  },
  {
    heading: 'Account Security & Member Responsibilities',
    bullets: [
      'Members are solely responsible for maintaining the confidentiality of their login credentials, including their user ID and OTP.',
      'All activities carried out under a Member’s account shall be deemed to have been conducted by the Member.',
      'Members must promptly notify Shubha Kalyana Matrimony in writing of any actual or suspected unauthorized access to or use of their account.',
    ],
  },
  {
    heading: 'User Conduct & Responsibilities',
    bullets: [
      'Members are responsible for safeguarding the confidentiality of their login credentials.',
      'All actions carried out under a Member’s account will be deemed to have been performed by the Member.',
      'Members must promptly notify Shubha Kalyana Matrimony of unauthorized access or security breaches.',
    ],
  },
  {
    heading: 'Termination & Suspension',
    bullets: [
      'Shubha Kalyana Matrimony may suspend or terminate a Member’s account if the Member is ineligible, provides false or fraudulent information, or violates this Agreement or applicable law.',
      'Upon termination, access to the Platform will cease immediately and unused subscription fees will not be refunded.',
    ],
  },
  {
    heading: 'Limitation of Liability',
    bullets: [
      'The Platform serves solely as a facilitation service for matrimonial connections.',
      'Shubha Kalyana Matrimony does not guarantee the accuracy of Member information, the success of any match, or the outcome of any matrimonial alliance.',
      'The Platform and Services are provided on an "as is" and "as available" basis.',
      'Shubha Kalyana Matrimony shall not be liable for indirect, incidental, consequential, or punitive damages arising from use of the Platform.',
    ],
  },
  {
    heading: 'Monitoring, Communications & Member Conduct',
    bullets: [
      'Shubha Kalyana Matrimony reserves the right to monitor, audit, or review Member accounts.',
      'Members consent to receive communications via email, SMS, WhatsApp, and telephone calls for service-related, transactional, promotional, and matchmaking purposes, subject to applicable law.',
      'Each Member may maintain only one profile.',
      'Members must provide true, accurate, current, and complete information.',
      'Members may be required to complete identity or selfie verification.',
      'Automated programs, bots, scripts, spiders, and crawlers are prohibited.',
      'Members are expected to engage respectfully with other Members and employees.',
      'Chat communications may be automatically deleted after 90 days.',
    ],
  },
  {
    heading: 'Proprietary Rights',
    bullets: [
      'Shubha Kalyana Matrimony grants Members a limited, personal, non-transferable, non-exclusive, revocable, and non-sublicensable license to use the Platform solely for lawful matrimonial purposes.',
      'The Platform may not be used for commercial purposes, resale, redistribution, or unauthorized public display.',
      'All rights not expressly granted remain reserved by Shubha Kalyana Matrimony.',
      'The license automatically terminates upon breach of these Terms or termination of the account.',
    ],
  },
  {
    heading: 'Privacy Policy & Content Restrictions',
    bullets: [
      'Your use of the Platform is subject to the Privacy Policy, which is incorporated into these Terms by reference.',
      'Shubha Kalyana Matrimony owns and retains proprietary rights in the Platform.',
      'The company may review, monitor, screen, edit, or delete Content that violates these Terms or applicable law.',
      'Members are responsible for all Content they post, upload, share, or transmit.',
      'Members must independently verify information provided by other Members.',
      'Content promoting hatred, harassment, stalking, threats, spam, fraud, obscenity, pornography, exploitation of minors, impersonation, unauthorized commercial activity, or illegal activity is prohibited.',
      'Members may not include telephone numbers, residential addresses, personal email addresses, external URLs, or social media handles in publicly visible profiles.',
    ],
  },
  {
    heading: 'Disclaimers',
    bullets: [
      'Shubha Kalyana Matrimony disclaims responsibility for inaccurate, incomplete, false, misleading, unlawful, or objectionable content posted by Users or Members.',
      'The company assumes no liability for service disruptions, communication failures, unauthorized access, data breaches, or technical failures beyond its reasonable control.',
      'Members are advised not to share sensitive personal or financial information with other Members.',
      'Verification does not guarantee a Member’s genuineness, character, intent, or compatibility.',
    ],
  },
  {
    heading: 'Limitation on Liability',
    bullets: [
      'Shubha Kalyana Matrimony, its affiliates, officers, directors, employees, agents, licensors, and service providers shall not be liable for indirect, incidental, consequential, special, exemplary, or punitive damages.',
      'The total cumulative liability of Shubha Kalyana Matrimony shall not exceed the total amount actually paid by the Member for Services during the subsisting term of the paid membership immediately preceding the date on which the claim arose.',
    ],
  },
  {
    heading: 'Child Safety Policy',
    paragraphs: [
      'Shubha Kalyana Matrimony is committed to providing a safe and responsible platform for all users. The Platform maintains safeguards designed to prevent misuse involving minors.',
    ],
    bullets: [
      'Registration is strictly limited to individuals aged 21 years and above for males and 18 years and above for females.',
      'Members may be required to submit valid documents for age verification.',
      'Accounts found to belong to underage individuals may be suspended or terminated.',
      'Shubha Kalyana Matrimony maintains a zero-tolerance policy against child sexual abuse and exploitation.',
      'Content moderation and human review may be used to detect and remove prohibited content.',
      'Users are prohibited from soliciting or sharing child sexual abuse material, communicating with minors for inappropriate purposes, grooming, or exploitative behavior.',
      'Concerns regarding child safety should be reported immediately to support@shubhakalyanamatrimony.com.',
    ],
  },
  {
    heading: 'Others',
    bullets: [
      'Governing Law & Jurisdiction: These Terms are governed by the laws of India. Disputes shall fall under the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.',
      'Indemnification: Members agree to indemnify and hold harmless Shubha Kalyana Matrimony and its affiliates from claims arising from violation of these Terms, fraud, negligence, or willful misconduct.',
      'Consent to Communications: Members consent to receive emails, notifications, and promotional offers and may unsubscribe according to available opt-out mechanisms.',
      'Grievance Redressal: Complaints may be submitted to grievance@shubhakalyana.com.',
      'Entire Agreement & Severability: This Agreement constitutes the complete understanding between the Member and Shubha Kalyana Matrimony.',
      'Acknowledgement of Terms: By registering or using the Services, you acknowledge that you have read, understood, and agreed to these Terms.',
    ],
  },
  {
    heading: 'Trademark',
    paragraphs: [
      'Shubhakalyana.com is a registered trademark of Shubha Kalyana Matrimony Services Private Limited. All rights reserved.',
    ],
  },
];

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
