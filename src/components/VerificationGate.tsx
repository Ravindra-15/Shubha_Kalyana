import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { getMyFullProfile } from '../api/profile';
import { getActiveMembership } from '../api/membership';
import VerificationPromptModal from './VerificationPromptModal';
import AadhaarVerificationModal from './AadhaarVerificationModal';
import { getVerificationPromptStatus } from '../utils/verificationPrompt';
import type { VerificationPromptStatus } from '../utils/verificationPrompt';

// Fire this to make the gate check again right away (e.g. after a plan is bought).
export const VERIFICATION_CHECK_EVENT = 'verificationCheck';

// Screens a member still has to reach while the gate is up: the selfie
// check, and Edit Profile in case the profile photo has to be changed
// before the selfie can match it. Every other screen is covered.
const ALLOWED_WHILE_GATED = ['PhotoCompare', 'EditProfile'];

type Props = {
  navigationRef: NavigationContainerRefWithCurrent<any>;
  currentRoute: string | undefined;
};

/**
 * A member with a paid plan must verify their photo AND Aadhaar before
 * using the app. This sits above every screen and cannot be dismissed;
 * it goes away only when the server says both are verified.
 */
export default function VerificationGate({ navigationRef, currentRoute }: Props) {
  const [status, setStatus] = useState<VerificationPromptStatus | null>(null);
  const [aadhaarVisible, setAadhaarVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const [profile, activeMembership] = await Promise.all([
        getMyFullProfile(),
        getActiveMembership(),
      ]);
      setUserName(profile?.profile?.basicInfo?.firstName || profile?.user?.firstName || '');
      const next = getVerificationPromptStatus(profile, activeMembership);
      setStatus(next.shouldShow ? next : null);
    } catch {
      // Network trouble: keep whatever we showed last, so a bad connection
      // can neither open nor close the gate by itself.
    } finally {
      checking.current = false;
    }
  }, []);

  // On login / app start, when the app comes back to the front (e.g. after
  // a relative finished the shared link, or a plan was bought on the web),
  // and when another screen asks for it.
  useEffect(() => {
    check();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    const event = DeviceEventEmitter.addListener(VERIFICATION_CHECK_EVENT, check);
    return () => {
      appState.remove();
      event.remove();
    };
  }, [check]);

  // Coming back from the selfie / edit screens: see whether that finished it.
  const gated = Boolean(status);
  useEffect(() => {
    if (gated) check();
  }, [gated, currentRoute, check]);

  const verifyPhoto = () => {
    setAadhaarVisible(false);
    if (navigationRef.isReady()) navigationRef.navigate('PhotoCompare' as never);
  };

  const onAadhaarClosed = () => {
    setAadhaarVisible(false);
    check();
  };

  const onAllowedScreen = Boolean(currentRoute && ALLOWED_WHILE_GATED.includes(currentRoute));

  if (!status) return null;

  return (
    <>
      <VerificationPromptModal
        visible={!aadhaarVisible && !onAllowedScreen}
        status={status}
        onVerifyPhoto={verifyPhoto}
        onVerifyAadhaar={() => setAadhaarVisible(true)}
      />
      {/* Its close / Done button goes back to the gate, which re-checks. */}
      <AadhaarVerificationModal
        visible={aadhaarVisible && !onAllowedScreen}
        photoVerified={status.profilePhotoVerified}
        userName={userName}
        onClose={onAadhaarClosed}
        onVerifyPhoto={verifyPhoto}
      />
    </>
  );
}
