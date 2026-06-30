import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/client';
import WelcomePopup from './WelcomePopup';
import { Crown, ArrowRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getActiveMembership } from '../../api/membership';
import { ActivityIndicator } from 'react-native';
import ProfileCard from '../../components/ProfileCard';

export default function HomeScreen() {
  const [firstName, setFirstName] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [planName, setPlanName] = useState('Free Plan');
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    loadUser();
    loadPlan();
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const res = await apiClient.get('/user/search', { params: { limit: 5 } });
      setMatches(res.data?.data?.profiles || []);
    } catch (err) {
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const loadPlan = async () => {
    const membership = await getActiveMembership();
    // active paid membership has a plan name; otherwise Free
    const name = membership?.plan?.name || membership?.planName;
    setPlanName(name || 'Free Plan');
  };

  const loadUser = async () => {
    try {
      const res = await apiClient.get('/user/me/profile');
      const user = res.data?.data?.user;
      const name = user?.firstName || '';
      setFirstName(name);

      // show welcome popup once per user
      const userId = user?._id;
      if (userId) {
        const seen = await AsyncStorage.getItem(`welcomeSeen_${userId}`);
        if (!seen) {
          setShowWelcome(true);
          await AsyncStorage.setItem(`welcomeSeen_${userId}`, 'true');
        }
      }
    } catch (err) {
      // ignore — header still renders
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WelcomePopup
        visible={showWelcome}
        onClose={() => setShowWelcome(false)}
        userName={firstName}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcome}>
              Welcome <Text style={styles.name}>{firstName || 'there'} !</Text>
            </Text>
            <Text style={styles.subtitle}>New verified matches are waiting for you</Text>
          </View>
          <TouchableOpacity style={styles.bellWrap}>
            <Bell color="#333" size={24} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plan card */}
        <LinearGradient
          colors={['#D20236', '#8B0020']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <View style={styles.planRow}>
            <Crown color="#fff" size={20} />
            <Text style={styles.planTitle}>{planName}</Text>
          </View>
          <Text style={styles.planSubtitle}>
            Unlock full profile access and premium features
          </Text>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
            <Text style={styles.upgradeText}>Upgrade Now</Text>
            <ArrowRight color="#D20236" size={16} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Recommended Matches */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recommended Matches</Text>
            <Text style={styles.sectionSub}>Profiles matching your preferences</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loadingMatches ? (
          <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} />
        ) : matches.length === 0 ? (
          <Text style={styles.empty}>No matches found yet</Text>
        ) : (
          matches.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              actionLabel="Send Request"
              onAction={() => {}}
              onView={() => {}}
              onInterested={() => {}}
            />
          ))
        )}

        {/* Other sections will go here */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, marginBottom: 20 },
  welcome: { fontSize: 24, fontWeight: '700', color: '#000' },
  name: { color: '#D20236' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  bellWrap: { padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#D20236',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  planCard: { borderRadius: 16, padding: 18, marginBottom: 24 },
  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  planTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginLeft: 8 },
  planSubtitle: { color: '#ffe0e6', fontSize: 13, marginBottom: 16, lineHeight: 18 },
  upgradeBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  upgradeText: { color: '#D20236', fontSize: 14, fontWeight: '700', marginRight: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  sectionSub: { fontSize: 13, color: '#666', marginTop: 2 },
  viewAll: { fontSize: 14, color: '#D20236', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginVertical: 20 },
});