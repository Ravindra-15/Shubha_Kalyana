import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';

export type CameraPermissionStatus = 'granted' | 'denied' | 'blocked';

/**
 * Checks/requests the Android CAMERA runtime permission. react-native-image-picker
 * throws a native error if the manifest declares CAMERA but the app calls
 * launchCamera() without this permission already being obtained.
 */
export const requestCameraPermission = async (): Promise<CameraPermissionStatus> => {
  if (Platform.OS !== 'android') return 'granted';

  const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) return 'granted';

  const result = await PermissionsAndroid.request(permission, {
    title: 'Camera Permission',
    message: 'Allow Shubha Kalyana to use your camera to take a profile photo.',
    buttonPositive: 'Allow',
    buttonNegative: 'Cancel',
  });

  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
  return 'denied';
};

// When camera access is blocked ("Don't ask again" / disabled in Settings),
// Android won't show the system prompt again — offer a shortcut to Settings.
export const showCameraPermissionAlert = (status: CameraPermissionStatus) => {
  if (status === 'blocked') {
    Alert.alert(
      'Camera Access Needed',
      'Camera access is blocked for this app. Please enable it from Settings to take a photo.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  } else {
    Alert.alert('Permission Required', 'Please allow camera access to take a profile photo.');
  }
};
