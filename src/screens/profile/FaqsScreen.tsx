import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    q: 'How do I create a profile on Shubhakalyanam?',
    a: 'Download the app, tap Sign Up, and follow the step-by-step onboarding process including basic details, preferences, and document verification.',
  },
  {
    q: 'Is my Aadhaar information safe?',
    a: 'Yes, your Aadhaar details are encrypted and used only for identity verification. We never share this information with other users.',
  },
  {
    q: 'How do I send an interest or connection request?',
    a: 'Open any profile you like and tap "Send Request". You can track all your sent requests from the Interests section.',
  },
  {
    q: 'What is the difference between Free and Premium plans?',
    a: 'Free accounts have limited profile views and no chat access. Premium plans unlock more profile views, chat, and priority support.',
  },
  {
    q: 'How do I unlock a profile\'s contact details?',
    a: 'You can unlock a profile individually for a small fee, or subscribe to a membership plan which includes multiple unlocks.',
  },
  {
    q: 'How do I report or block a user?',
    a: 'Open the chat with the user, tap the menu icon in the top right, and choose "Block and Report User".',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile > Settings > Account Settings > Delete Account, select a reason, and submit your request. Our team will process it shortly.',
  },
  {
    q: 'I forgot my MPIN. What do I do?',
    a: 'On the login screen, tap "Forgot MPIN" and follow the OTP verification steps to reset it.',
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
              {open && <Text style={styles.answer}>{item.a}</Text>}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  scroll: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f0f0f0',
    padding: 16, marginBottom: 12,
  },
  qRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { flex: 1, fontSize: 14, fontWeight: '600', color: '#000', marginRight: 10 },
  answer: { fontSize: 13, color: '#666', marginTop: 12, lineHeight: 19 },
});