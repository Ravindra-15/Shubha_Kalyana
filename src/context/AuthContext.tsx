import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = any;

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  hasSeenOnboarding: boolean;
  loginPromptVersion: number | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  markOnboardingSeen: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [loginPromptVersion, setLoginPromptVersion] = useState<number | null>(null);

  // On app start, check if a token is already saved
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        let seenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (savedToken) {
          setToken(savedToken);
          if (savedUser) setUser(JSON.parse(savedUser));

          // A device with an already-saved session logged in before this
          // flag existed (or before it was ever set). Either way, it has
          // definitely been through onboarding, so backfill the flag now
          // rather than showing Splash/Onboarding again after a logout.
          if (seenOnboarding !== 'true') {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            seenOnboarding = 'true';
          }
        }
        if (seenOnboarding === 'true') setHasSeenOnboarding(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markOnboardingSeen = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
  };

  const login = async (newToken: string, newUser: User) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setToken(newToken);
    setUser(newUser);
    setHasSeenOnboarding(true);
    setLoginPromptVersion(Date.now());
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setLoginPromptVersion(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        hasSeenOnboarding,
        loginPromptVersion,
        login,
        logout,
        markOnboardingSeen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
