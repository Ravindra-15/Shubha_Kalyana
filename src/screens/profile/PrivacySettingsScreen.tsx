import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldOff } from 'lucide-react-native';
import BottomNav from '../../components/BottomNav';

export default function PrivacySettingsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <ShieldOff color="#D20236" size={28} />
          </View>
          <Text style={styles.title}>Coming Soon</Text>
          <Text style={styles.subtitle}>
            We're working on giving you more control over your privacy and visibility settings.
            This feature will be available in an upcoming update.
          </Text>
        </View>
      </ScrollView>

      <BottomNav active="ProfileTab" />
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
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 40 },
  card: {
    backgroundColor: '#fdf2f5', borderRadius: 18, padding: 28,
    alignItems: 'center', width: '100%',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 10 },
  subtitle: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 20 },
});