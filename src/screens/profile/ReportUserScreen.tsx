import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, MessageCircleWarning, Ban, Flag, ShieldAlert, ChevronRight,
} from 'lucide-react-native';

export default function ReportUserScreen({ navigation }: any) {
  const steps = [
    {
      Icon: MessageCircleWarning,
      title: 'Report from a Chat',
      desc: 'Open the conversation with the user, tap the menu icon in the top right corner, and select "Block and Report User".',
    },
    {
      Icon: Flag,
      title: 'Choose a Reason',
      desc: 'Select the reason that best describes the issue — such as fake profile, harassment, spam, or inappropriate messages.',
    },
    {
      Icon: Ban,
      title: 'Block if Needed',
      desc: 'Reporting a user also gives you the option to block them, so they can no longer message or contact you.',
    },
    {
      Icon: ShieldAlert,
      title: 'Our Team Reviews It',
      desc: 'Every report is reviewed by our support team. We take appropriate action, which may include warnings or account suspension.',
    },
  ];

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
            We take user safety seriously. Here's how to report someone who's violating our community guidelines.
          </Text>
        </View>

        {steps.map(({ Icon, title, desc }, i) => (
          <View key={title} style={styles.stepCard}>
            <View style={styles.stepIconWrap}>
              <Icon color="#D20236" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepDesc}>{desc}</Text>
            </View>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  scroll: { padding: 20, paddingBottom: 40 },
  introCard: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fdf2f5',
    borderRadius: 14, padding: 16, marginBottom: 20, alignItems: 'flex-start',
  },
  introText: { flex: 1, fontSize: 13, color: '#333', lineHeight: 19 },
  stepCard: {
    flexDirection: 'row', gap: 14, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 14,
    padding: 16, marginBottom: 12, alignItems: 'flex-start',
  },
  stepIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fdf2f5',
    alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 4 },
  stepDesc: { fontSize: 12, color: '#777', lineHeight: 18 },
  helpLinkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f7f7f7', borderRadius: 14, padding: 16, marginTop: 8,
  },
  helpLinkTitle: { fontSize: 14, fontWeight: '600', color: '#000' },
  helpLinkDesc: { fontSize: 12, color: '#888', marginTop: 2 },
});