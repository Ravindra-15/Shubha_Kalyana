/**
 * Matrimony App
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SignupProvider } from './src/context/SignupContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ChatProvider } from './src/context/ChatContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <SignupProvider>
        <ChatProvider>
          <SafeAreaProvider>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <RootNavigator />
          </SafeAreaProvider>
        </ChatProvider>
      </SignupProvider>
    </AuthProvider>
  );
}

export default App;