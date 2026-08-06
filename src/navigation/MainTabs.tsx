import React, { useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react-native';
import HomeScreen from '../screens/home/HomeScreen';
import AllMatchesScreen from '../screens/matches/AllMatchesScreen';
import AllInterestedScreen from '../screens/interested/AllInterestedScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import { useChat } from '../context/ChatContext';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { getMyFullProfile } from '../api/profile';
import { getActiveMembership } from '../api/membership';
import VerificationPromptModal from '../components/VerificationPromptModal';
import { getVerificationPromptStatus } from '../utils/verificationPrompt';
import type { VerificationPromptStatus } from '../utils/verificationPrompt';

const Tab = createBottomTabNavigator();

type TabIconProps = {
  color: string;
  size: number;
};

const HomeTabIcon = ({ color, size }: TabIconProps) => <Home color={color} size={size} />;
const SearchTabIcon = ({ color, size }: TabIconProps) => <Search color={color} size={size} />;
const InterestsTabIcon = ({ color, size }: TabIconProps) => <Heart color={color} size={size} />;
const ChatTabIcon = ({ color, size }: TabIconProps) => <MessageCircle color={color} size={size} />;
const ProfileTabIcon = ({ color, size }: TabIconProps) => <User color={color} size={size} />;

export default function MainTabs({ navigation }: any) {
  const { unreadCount } = useChat();
  const [verificationPrompt, setVerificationPrompt] =
    useState<VerificationPromptStatus | null>(null);

  const showVerificationPrompt = useCallback(async () => {
    try {
      const [profile, activeMembership] = await Promise.all([
        getMyFullProfile(),
        getActiveMembership(),
      ]);
      const status = getVerificationPromptStatus(profile, activeMembership);
      if (status.shouldShow) {
        setVerificationPrompt(status);
      } else {
        setVerificationPrompt(null);
      }
    } catch {
      setVerificationPrompt(null);
    }
  }, []);

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
          listeners={{
            focus: () => {
              showVerificationPrompt().catch(() => {});
            },
          }}
          options={{
            title: 'Home',
            tabBarIcon: HomeTabIcon,
          }}
        />

        <Tab.Screen
          name="SearchTab"
          component={AllMatchesScreen}
          options={{
            title: 'Search',
            tabBarIcon: SearchTabIcon,
          }}
        />
        <Tab.Screen
          name="InterestsTab"
          component={AllInterestedScreen}
          options={{
            title: 'Interests',
            tabBarIcon: InterestsTabIcon,
          }}
        />
        <Tab.Screen
          name="ChatTab"
          component={ChatListScreen}
          options={{
            title: 'Chat',
            tabBarIcon: ChatTabIcon,
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            title: 'Profile',
            tabBarIcon: ProfileTabIcon,
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
