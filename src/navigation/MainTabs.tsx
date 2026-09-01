import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react-native';
import HomeScreen from '../screens/home/HomeScreen';
import AllMatchesScreen from '../screens/matches/AllMatchesScreen';
import AllInterestedScreen from '../screens/interested/AllInterestedScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import { useChat } from '../context/ChatContext';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { getMyFullProfile, getNavbarCounts } from '../api/profile';
import { getActiveMembership } from '../api/membership';
import VerificationPromptModal from '../components/VerificationPromptModal';
import AadhaarVerificationModal from '../components/AadhaarVerificationModal';
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
  const [aadhaarPromptVisible, setAadhaarPromptVisible] = useState(false);
  const [aadhaarPhotoVerified, setAadhaarPhotoVerified] = useState(false);
  const [newInterestCount, setNewInterestCount] = useState(0);

  const INTEREST_SEEN_COUNT_KEY = 'lastSeenInterestCount';

  useEffect(() => {
    Promise.all([
      getNavbarCounts(),
      AsyncStorage.getItem(INTEREST_SEEN_COUNT_KEY),
    ])
      .then(([counts, storedSeenCount]) => {
        const seenCount = Number(storedSeenCount || 0);
        setNewInterestCount(Math.max(0, counts.interestCount - seenCount));
      })
      .catch(() => {});
  }, []);

  const markInterestsSeen = useCallback(async () => {
    try {
      const { interestCount } = await getNavbarCounts();
      await AsyncStorage.setItem(INTEREST_SEEN_COUNT_KEY, String(interestCount));
      setNewInterestCount(0);
    } catch {
      // If this fails, the badge simply stays as-is until the next successful check.
    }
  }, []);

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
    setAadhaarPromptVisible(false);
    navigation.navigate('PhotoCompare');
  };

  const verifyAadhaar = () => {
    setAadhaarPhotoVerified(Boolean(verificationPrompt?.profilePhotoVerified));
    setVerificationPrompt(null);
    setAadhaarPromptVisible(true);
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
          tabBarLabelStyle: { fontSize: 11, fontFamily: 'Outfit-SemiBold' },
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
          listeners={{
            focus: () => {
              markInterestsSeen().catch(() => {});
            },
          }}
          options={{
            title: 'Interests',
            tabBarIcon: InterestsTabIcon,
            tabBarBadge: newInterestCount > 0 ? newInterestCount : undefined,
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
        onVerifyAadhaar={verifyAadhaar}
      />
      <AadhaarVerificationModal
        visible={aadhaarPromptVisible}
        photoVerified={aadhaarPhotoVerified}
        onClose={() => setAadhaarPromptVisible(false)}
        onVerified={async () => {
          await getMyFullProfile().catch(() => null);
        }}
        onVerifyPhoto={verifyPhoto}
      />
    </>
  );
}
