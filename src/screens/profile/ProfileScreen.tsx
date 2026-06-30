import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { logout } = useAuth();
  return (
    <SafeAreaView style={styles.c}>
      <Text style={styles.t}>Profile</Text>
      <TouchableOpacity style={styles.btn} onPress={logout}>
        <Text style={styles.btnT}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  t: { fontSize: 22, fontWeight: '700', color: '#D20236', marginBottom: 20 },
  btn: { backgroundColor: '#D20236', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 8 },
  btnT: { color: '#fff', fontSize: 16, fontWeight: '700' },
});