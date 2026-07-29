const toArray = (value: any) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const getProfile = (value: any) => value?.raw?.profile || value?.profile || value || {};

const getCurrentProfilePhoto = (profile: any) => {
  const photos = toArray(profile?.photos);
  return photos.find((photo: any) => photo?.isProfilePhoto) || photos[0] || null;
};

export type VerificationPromptStatus = {
  profilePhotoVerified: boolean;
  aadhaarNumberVerified: boolean;
  shouldShow: boolean;
};

export const isProfilePictureVerifiedForPrompt = (value: any) => {
  if (typeof value?.profilePictureVerified === 'boolean') {
    return value.profilePictureVerified;
  }

  const profile = getProfile(value);
  const profilePhoto = getCurrentProfilePhoto(profile);
  const profilePhotoId = profilePhoto?.publicId || profilePhoto?.url || '';
  const verification = profile?.profilePictureVerification || {};

  return Boolean(
    profilePhotoId &&
      verification.isVerified &&
      verification.profilePicturePublicId === profilePhotoId,
  );
};

export const isAadhaarNumberVerifiedForPrompt = (value: any) => {
  if (typeof value?.aadhaarNumberVerified === 'boolean') {
    return value.aadhaarNumberVerified;
  }

  const profile = getProfile(value);
  const aadhaarStatus = String(profile?.aadhaarVerification?.status || '').toUpperCase();
  const documentStatus = String(profile?.documents?.verificationStatus || '').toUpperCase();

  return aadhaarStatus === 'VERIFIED' || documentStatus === 'VERIFIED';
};

export const getVerificationPromptStatus = (value: any): VerificationPromptStatus => {
  const profilePhotoVerified = isProfilePictureVerifiedForPrompt(value);
  const aadhaarNumberVerified = isAadhaarNumberVerifiedForPrompt(value);

  return {
    profilePhotoVerified,
    aadhaarNumberVerified,
    shouldShow: !(profilePhotoVerified && aadhaarNumberVerified),
  };
};
