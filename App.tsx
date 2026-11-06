/**
 * Matrimony App
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/utils/setupDefaultFont';
import './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { SignupProvider } from './src/context/SignupContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ChatProvider } from './src/context/ChatContext';
import { InterestBadgeProvider } from './src/context/InterestBadgeContext';
import { ViewedProfilesProvider } from './src/context/ViewedProfilesContext';

function App() {
  return (
    <AuthProvider>
      <SignupProvider>
        <ChatProvider>
          <InterestBadgeProvider>
            <ViewedProfilesProvider>
              <SafeAreaProvider>
                {/* White background + dark icons so the status bar blends into
                    the app's white screens instead of Android's default grey
                    band. The splash screen overrides this with its own red. */}
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <RootNavigator />
              </SafeAreaProvider>
            </ViewedProfilesProvider>
          </InterestBadgeProvider>
        </ChatProvider>
      </SignupProvider>
    </AuthProvider>
  );
}

export default App;