import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const TABS = [
  { name: 'HomeTab', label: 'Home', Icon: Home },
  { name: 'SearchTab', label: 'Search', Icon: Search },
  { name: 'InterestsTab', label: 'Interests', Icon: Heart },
  { name: 'ChatTab', label: 'Chat', Icon: MessageCircle },
  { name: 'ProfileTab', label: 'Profile', Icon: User },
];

export default function BottomNav({ active }: { active?: string }) {
  const navigation = useNavigation<any>();

  const go = (tab: string) => {
    navigation.navigate('MainTabs', { screen: tab });
  };

  return (
    <View style={styles.bar}>
      {TABS.map(({ name, label, Icon }) => {
        const isActive = active === name;
        const color = isActive ? '#D20236' : '#999';
        return (
          <TouchableOpacity key={name} style={styles.item} onPress={() => go(name)}>
            <Icon color={color} size={22} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 10,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 11, fontWeight: '600' },
});