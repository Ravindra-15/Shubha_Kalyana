import apiClient from './client';

export const getPartnerProfile = async (id: string) => {
  const res = await apiClient.get(`/user/access-profile/${id}`);
  return res.data?.data || null;
};

export const getProfileViewersSummary = async () => {
  const res = await apiClient.get('/relationship/profile-viewers/me/summary');
  return res.data?.data || { profileViewersCount: 0, totalProfileViews: 0 };
};

export const getProfileViewers = async (params?: { page?: number; limit?: number }) => {
  const res = await apiClient.get('/relationship/profile-viewers/me', {
    params,
  });

  return res.data?.data || {
    viewers: [],
    pagination: null,
    profileViewersCount: 0,
    totalProfileViews: 0,
  };
};

export const getMyFullProfile = async () => {
  const res = await apiClient.get('/user/me/profile');
  return res.data?.data || null; // { user, profile, partnerPreference }
};

export const updateMyProfile = async (payload: any) => {
  const res = await apiClient.patch('/user/me/profile', payload);
  return res.data?.data || null;
};

export const updateMyPartnerPreference = async (payload: any) => {
  const res = await apiClient.put('/user/me/partner-preference', payload);
  return res.data?.data || null;
};

export const uploadMyProfilePhoto = async (photo: { uri: string; type: string; name: string }) => {
  const formData = new FormData();
  formData.append('profilePhoto', photo as any);
  const res = await apiClient.post('/user/me/profile-photo', formData);
  return res.data?.data || null;
};

export const getCurrentProfilePhoto = (profile: any) => {
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];
  return photos.find((photo: any) => photo?.isProfilePhoto) || photos[0] || null;
};

export const isProfilePictureVerified = (profile: any) => {
  const profilePhoto = getCurrentProfilePhoto(profile);
  const profilePhotoId = profilePhoto?.publicId || profilePhoto?.url || '';
  const verification = profile?.profilePictureVerification || {};

  return Boolean(
    profilePhotoId &&
      verification.isVerified &&
      verification.profilePicturePublicId === profilePhotoId,
  );
};

export const isAadhaarNumberVerified = (profile: any) => {
  const aadhaarStatus = String(profile?.aadhaarVerification?.status || '').toUpperCase();
  const documentStatus = String(profile?.documents?.verificationStatus || '').toUpperCase();
  return aadhaarStatus === 'VERIFIED' || documentStatus === 'VERIFIED';
};

export const createProfilePictureVerificationSession = async () => {
  const res = await apiClient.post('/facetec/profile-picture/start');
  return res.data?.data || null;
};

export const completeProfilePictureVerification = async (externalDatabaseRefID: string) => {
  const res = await apiClient.post('/facetec/profile-picture/complete', {
    externalDatabaseRefID,
  });
  return res.data?.data || null;
};
