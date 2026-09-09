import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title?: string;
  message?: string;
  onRetry: () => void;
};

// Shown in place of a blank/broken screen whenever a screen fails to load
// its data because of a network problem (backend unreachable, no internet,
// timeout) -- not for normal API errors, which should keep showing their
// own inline messages/alerts as before.
export default function NetworkErrorScreen({
  title = 'Unable to Connect',
  message = "We couldn't reach the server. Please check your internet connection and try again.",
  onRetry,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Image
            source={require('../assets/images/logo-red.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.badge}>
            <WifiOff color="#D20236" size={16} />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: {
    width: 160,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fdf2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: { width: 128, height: 60 },
  badge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  title: { fontSize: 19, fontFamily: 'Outfit-Bold', color: '#000', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  retryBtn: {
    backgroundColor: '#D20236',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit-Bold' },
});
