import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/onboarding/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import LoginOtpScreen from '../screens/auth/LoginOtpScreen';
import MainTabs from './MainTabs';
import SignupProfileForScreen from '../screens/auth/signup/SignupProfileForScreen';
import SignupAboutScreen from '../screens/auth/signup/SignupAboutScreen';
import SignupCasteScreen from '../screens/auth/signup/SignupCasteScreen';
import SignupContactScreen from '../screens/auth/signup/SignupContactScreen';
import QualificationScreen from '../screens/auth/signup/QualificationScreen';
import EmploymentScreen from '../screens/auth/signup/EmploymentScreen';
import FamilyDetailsScreen from '../screens/auth/signup/FamilyDetailsScreen';
import BasicLifestyleScreen from '../screens/auth/signup/BasicLifestyleScreen';
import PartnerPreferenceScreen from '../screens/auth/signup/PartnerPreferenceScreen';
import HoroscopeScreen from '../screens/auth/signup/HoroscopeScreen';
import AddressDetailsScreen from '../screens/auth/signup/AddressDetailsScreen';
import AboutYouScreen from '../screens/auth/signup/AboutYouScreen';
import VerifyMobileScreen from '../screens/auth/signup/VerifyMobileScreen';
import SetupMpinScreen from '../screens/auth/signup/SetupMpinScreen';
import ProfilePhotoScreen from '../screens/auth/signup/ProfilePhotoScreen';
import HobbiesScreen from '../screens/auth/signup/HobbiesScreen';
import UploadAadhaarScreen from '../screens/auth/signup/UploadAadhaarScreen';
import ReviewProfileScreen from '../screens/auth/signup/ReviewProfileScreen';
import AllMatchesScreen from '../screens/matches/AllMatchesScreen';
import ProfileDetailScreen from '../screens/profile-detail/ProfileDetailScreen';
import RequestsScreen from '../screens/requests/RequestsScreen';
import AllInterestedScreen from '../screens/interested/AllInterestedScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import PlansScreen from '../screens/plans/PlansScreen';
import ConversationScreen from '../screens/chat/ConversationScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AccountSettingsScreen from '../screens/profile/AccountSettingsScreen';
import ChangeMobileNumberScreen from '../screens/profile/ChangeMobileNumberScreen';
import ChangeMpinScreen from '../screens/profile/ChangeMpinScreen';
import PaymentHistoryScreen from '../screens/profile/PaymentHistoryScreen';
import DeleteAccountScreen from '../screens/profile/DeleteAccountScreen';
import ChangeEmailScreen from '../screens/profile/ChangeEmailScreen';
import HelpSupportScreen from '../screens/profile/HelpSupportScreen';
import FaqsScreen from '../screens/profile/FaqsScreen';
import ContactSupportScreen from '../screens/profile/ContactSupportScreen';
// import ReportUserScreen from '../screens/profile/ReportUserScreen';
// import TermsAndConditionsScreen from '../screens/profile/TermsAndConditionsScreen';
// import PrivacyPolicyScreen from '../screens/profile/PrivacyPolicyScreen';
// import EditProfileScreen from '../screens/profile/EditProfileScreen';
// import ChooseLanguageScreen from '../screens/profile/ChooseLanguageScreen';
import PrivacySettingsScreen from '../screens/profile/PrivacySettingsScreen';
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D20236" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Logged in
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="AllMatches" component={AllMatchesScreen} />
            <Stack.Screen
              name="ProfileDetail"
              component={ProfileDetailScreen}
            />
            <Stack.Screen name="SentRequests" component={RequestsScreen} />
            <Stack.Screen name="Requests" component={RequestsScreen} />
            <Stack.Screen name="AllInterested" component={AllInterestedScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="Plans" component={PlansScreen} />
            <Stack.Screen name="Conversation" component={ConversationScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="ChangeMobileNumber" component={ChangeMobileNumberScreen} />
            <Stack.Screen name="ChangeMpin" component={ChangeMpinScreen} />
            <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
            <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="Faqs" component={FaqsScreen} />
            <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
            {/* <Stack.Screen name="ReportUser" component={ReportUserScreen} /> */}
            {/* <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} /> */}
            {/* <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} /> */}
            {/* <Stack.Screen name="EditProfile" component={EditProfileScreen} /> */}
            {/* <Stack.Screen name="ChooseLanguage" component={ChooseLanguageScreen} /> */}
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="LoginOtp" component={LoginOtpScreen} />
            <Stack.Screen
              name="SignupProfileFor"
              component={SignupProfileForScreen}
            />
            <Stack.Screen name="SignupAbout" component={SignupAboutScreen} />
            <Stack.Screen name="SignupCaste" component={SignupCasteScreen} />
            <Stack.Screen
              name="SignupContact"
              component={SignupContactScreen}
            />
            <Stack.Screen
              name="Qualification"
              component={QualificationScreen}
            />
            <Stack.Screen name="Employment" component={EmploymentScreen} />
            <Stack.Screen
              name="FamilyDetails"
              component={FamilyDetailsScreen}
            />
            <Stack.Screen
              name="BasicLifestyle"
              component={BasicLifestyleScreen}
            />
            <Stack.Screen name="Horoscope" component={HoroscopeScreen} />
            <Stack.Screen
              name="AddressDetails"
              component={AddressDetailsScreen}
            />
            <Stack.Screen name="AboutYou" component={AboutYouScreen} />
            <Stack.Screen
              name="PartnerPreference"
              component={PartnerPreferenceScreen}
            />
            <Stack.Screen name="VerifyMobile" component={VerifyMobileScreen} />
            <Stack.Screen name="SetupMpin" component={SetupMpinScreen} />
            <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
            <Stack.Screen name="Hobbies" component={HobbiesScreen} />
            <Stack.Screen
              name="UploadAadhaar"
              component={UploadAadhaarScreen}
            />
            <Stack.Screen
              name="ReviewProfile"
              component={ReviewProfileScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
