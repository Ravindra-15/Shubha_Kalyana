import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome 🎉</Text>
      <Text style={styles.sub}>
        {user?.firstName ? `Hello ${user.firstName}` : 'You are logged in'}
      </Text>
      <Text style={styles.mobile}>{user?.mobile}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#D20236', marginBottom: 10 },
  sub: { fontSize: 18, color: '#333' },
  mobile: { fontSize: 15, color: '#666', marginTop: 4, marginBottom: 40 },
  logoutBtn: {
    backgroundColor: '#D20236',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});