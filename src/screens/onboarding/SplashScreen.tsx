import React, { useEffect } from 'react';
import AppSplash from '../../components/AppSplash';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return <AppSplash />;
}
