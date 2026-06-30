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

export default function HomeScreen() {
  const [firstName, setFirstName] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

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
});