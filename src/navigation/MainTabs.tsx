import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react-native';
import HomeScreen from '../screens/home/HomeScreen';
import AllMatchesScreen from '../screens/matches/AllMatchesScreen';
import AllInterestedScreen from '../screens/interested/AllInterestedScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import { useChat } from '../context/ChatContext';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useAuth } from '../context/AuthContext';
import { getMyFullProfile } from '../api/profile';
import VerificationPromptModal from '../components/VerificationPromptModal';
import { getVerificationPromptStatus } from '../utils/verificationPrompt';
import type { VerificationPromptStatus } from '../utils/verificationPrompt';

const Tab = createBottomTabNavigator();

export default function MainTabs({ navigation }: any) {
  const { unreadCount } = useChat();
  const { loginPromptVersion } = useAuth();
  const [verificationPrompt, setVerificationPrompt] =
    useState<VerificationPromptStatus | null>(null);

  const showVerificationPrompt = useCallback(async () => {
    try {
      const profile = await getMyFullProfile();
      const status = getVerificationPromptStatus(profile);
      if (status.shouldShow) {
        setVerificationPrompt(status);
      }
    } catch {
      setVerificationPrompt(null);
    }
  }, []);

  useEffect(() => {
    if (loginPromptVersion) {
      showVerificationPrompt();
    }
  }, [loginPromptVersion, showVerificationPrompt]);

  const closeVerificationPrompt = () => {
    setVerificationPrompt(null);
  };

  const verifyPhoto = () => {
    setVerificationPrompt(null);
    navigation.navigate('FaceTecTest');
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#D20236',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />

        <Tab.Screen
          name="SearchTab"
          component={AllMatchesScreen}
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="InterestsTab"
          component={AllInterestedScreen}
          options={{
            title: 'Interests',
            tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="ChatTab"
          component={ChatListScreen}
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
      <VerificationPromptModal
        visible={Boolean(verificationPrompt)}
        status={verificationPrompt}
        onClose={closeVerificationPrompt}
        onVerifyPhoto={verifyPhoto}
        onVerifyAadhaar={() => undefined}
      />
    </>
  );
}
