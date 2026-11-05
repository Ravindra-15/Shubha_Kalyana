import { useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Blocks screenshots and screen recording / sharing while the calling
 * screen is focused (client request: another member's profile and photos).
 * Android only -- iOS has no way to block screenshots, so there this is a
 * no-op. A counter keeps the block on while one secure screen hands over to
 * another (e.g. opening a second profile from the first).
 */
const ScreenSecure = NativeModules.ScreenSecure as
  | { enable: () => void; disable: () => void }
  | undefined;

let secureScreens = 0;

export function useScreenSecure() {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android' || !ScreenSecure) return undefined;
      secureScreens += 1;
      if (secureScreens === 1) ScreenSecure.enable();
      return () => {
        secureScreens = Math.max(secureScreens - 1, 0);
        if (secureScreens === 0) ScreenSecure.disable();
      };
    }, []),
  );
}
