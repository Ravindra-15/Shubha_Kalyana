/**
 * Matrimony App
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/utils/setupDefaultFont';
import './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { SignupProvider } from './src/context/SignupContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ChatProvider } from './src/context/ChatContext';
import { InterestBadgeProvider } from './src/context/InterestBadgeContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <SignupProvider>
        <ChatProvider>
          <InterestBadgeProvider>
            <SafeAreaProvider>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <RootNavigator />
            </SafeAreaProvider>
          </InterestBadgeProvider>
        </ChatProvider>
      </SignupProvider>
    </AuthProvider>
  );
}

export default App;