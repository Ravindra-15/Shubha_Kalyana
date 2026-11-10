import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react-native';
import HomeScreen from '../screens/home/HomeScreen';
import AllMatchesScreen from '../screens/matches/AllMatchesScreen';
import AllInterestedScreen from '../screens/interested/AllInterestedScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import { useChat } from '../context/ChatContext';
import { useInterestBadge } from '../context/InterestBadgeContext';
import ProfileScreen from '../screens/profile/ProfileScreen';

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

export default function MainTabs() {
  const { unreadCount } = useChat();
  const { newInterestCount, markInterestsSeen } = useInterestBadge();
  // The photo / Aadhaar verification gate lives in RootNavigator now, so
  // it covers every screen, not just Home.

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
    </>
  );
}
