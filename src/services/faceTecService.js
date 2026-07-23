import {NativeModules, Platform} from 'react-native';

const {FaceTecModule} = NativeModules;

const getFaceTecModule = () => {
  if (Platform.OS !== 'android') {
    throw new Error('FaceTec is currently configured only for Android.');
  }

  if (!FaceTecModule) {
    throw new Error(
      'FaceTec native module is unavailable. Rebuild the Android app.',
    );
  }

  return FaceTecModule;
};

export const initializeFaceTec = async ({
  backendProcessSessionUrl,
  authToken = '',
}) => {
  if (!backendProcessSessionUrl?.trim()) {
    throw new Error('FaceTec backend process-session URL is required.');
  }

  return getFaceTecModule().initialize(
    backendProcessSessionUrl.trim(),
    authToken,
  );
};

export const startFaceTecEnrollment = async externalDatabaseRefID => {
  if (!externalDatabaseRefID?.trim()) {
    throw new Error('FaceTec externalDatabaseRefID is required.');
  }

  return getFaceTecModule().startEnrollment(
    externalDatabaseRefID.trim(),
  );
};