import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqSection = {
  heading: string;
  points: string[];
};

type FaqItem = {
  q: string;
  a: string;
  sections?: FaqSection[];
};

const FAQS: FaqItem[] = [
  {
    q: 'Why to register on Shubhakalyana Matrimony?',
    a: "Shubhakalyana Matrimony is Karnataka's leading matchmaking platform, committed to understanding the unique needs and challenges faced by individuals in their search for a life partner.",
  },
  {
    q: 'Is Shubhakalyana Matrimony is a trustworthy matchmaking platform?',
    a: 'YES, Shubhakalyana Matrimony is a highly trustworthy matchmaking platform with a profile verification process. Shubhakalyana.com ensures a safe and reliable experience and it offers a modern and personalized approach to finding a life partner.',
  },
  {
    q: 'How to register on Shubhakalyana Matrimony?',
    a: 'To register, simply log in at Shubhakalyana.com or download the Shubha Kalyana app from the Play Store or App Store, and complete your profile by filling in the required details.',
  },
  {
    q: 'Does Shubhakalyana Matrimony offer free registration?',
    a: 'YES. Registration on Shubhakalyana matrimony is absolutely FREE.',
  },
  {
    q: 'What is the difference between free membership vs paid membership?',
    a: '',
    sections: [
      {
        heading: '"Free Membership" allows you to..',
        points: [
          'Create a profile',
          'Can browse and view the basic information of other profiles.',
        ],
      },
      {
        heading: '"Paid membership" offers you a lot more...',
        points: [
          'Can view complete profile details, including contact information, address, and photos.',
          'Can chat with an interested profile once the request has been accepted by that profile.',
          'Can send messages to interested profiles and respond to messages they receive.',
          'Search for matches by religion, city, community, education and many other specific parameters.',
          'Priority customer support.',
        ],
      },
    ],
  },
  {
    q: 'How does a profile have the "Verified" tag on Shubhakalyana Matrimony?',
    a: "A profile is awarded the 'Verified' tag only after completing Aadhaar and selfie video authentication, followed by verification of government-issued documents by our dedicated verification team.",
  },
];

export default function FaqsScreen({ navigation }: any) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <TouchableOpacity
              key={i}
              style={styles.card}
              onPress={() => toggle(i)}
              activeOpacity={0.7}
            >
              <View style={styles.qRow}>
                <Text style={styles.question}>{item.q}</Text>
                {open ? (
                  <ChevronUp color="#D20236" size={18} />
                ) : (
                  <ChevronDown color="#999" size={18} />
                )}
              </View>
              {open ? (
                <View>
                  {item.a ? <Text style={styles.answer}>{item.a}</Text> : null}

                  {item.sections?.map((section, sectionIndex) => (
                    <View
                      key={sectionIndex}
                      style={[styles.section, sectionIndex > 0 && styles.sectionSpacing]}
                    >
                      <Text style={styles.sectionHeading}>{section.heading}</Text>
                      {section.points.map((point, pointIndex) => (
                        <View key={pointIndex} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>{'•'}</Text>
                          <Text style={styles.bulletText}>{point}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
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
  scroll: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f0f0f0',
    padding: 16, marginBottom: 12,
  },
  qRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { flex: 1, fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#000', marginRight: 10 },
  answer: { fontSize: 13, color: '#666', marginTop: 12, lineHeight: 19 },
  section: { marginTop: 12 },
  sectionSpacing: { marginTop: 10 },
  sectionHeading: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#333' },
  bulletRow: { flexDirection: 'row', marginTop: 6, paddingRight: 4 },
  bulletDot: { fontSize: 13, color: '#666', width: 14 },
  bulletText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 19 },
});