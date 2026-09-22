import { Alert } from 'react-native';

/**
 * Turns a failed "send login OTP" response into the right message for the
 * user. Returns true when an OTP was already sent a moment ago (the server
 * asks to wait), in which case the caller can still move to the OTP boxes.
 */
export const handleLoginOtpError = (
  err: any,
  { onSignup }: { onSignup?: () => void } = {},
): boolean => {
  const status = err?.response?.status;
  const body = err?.response?.data || {};

  if (status === 404) {
    Alert.alert(
      'User not found',
      'Kindly Sign Up.',
      onSignup
        ? [
            { text: 'OK', style: 'cancel' },
            { text: 'Sign Up', onPress: onSignup },
          ]
        : undefined,
    );
    return false;
  }

  if (body.action === 'REVIEW_PENDING') {
    Alert.alert(
      'Profile under review',
      'Your profile is in pending review. Once it is approved, you can login.',
    );
    return false;
  }

  // An OTP was sent less than a minute ago and is still valid.
  if (status === 429) return true;

  Alert.alert('Login failed', body.message || 'Could not send OTP. Please try again.');
  return false;
};
