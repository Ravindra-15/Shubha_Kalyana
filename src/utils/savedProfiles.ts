import apiClient from '../api/client';

export type SavedProfile = {
  profileId: string;
  name: string;
  age?: number | null;
  profession?: string;
  location?: string;
  image?: string;
  verified?: boolean;
  matchPercentage?: number;
  matchPercent?: number;
  savedAt: string;
};

type SavedProfilesParams = {
  page?: number;
  limit?: number;
};

// "Save Profile" reuses the same Interest system the app already uses
// elsewhere (the heart icon on profile cards, and web's own Save Profile
// button) — there is no separate saved-profiles module on the backend.
export const getSavedProfiles = async (params?: SavedProfilesParams) => {
  const res = await apiClient.get('/relationship/interests/me', {
    params,
  });
  const data = res.data?.data || {};

  return {
    savedProfiles: data.interests || [],
    pagination: data.pagination || null,
  };
};

export const isProfileSaved = async (profileId: string): Promise<boolean> => {
  const res = await apiClient.get(`/relationship/interests/check/${profileId}`);
  return res.data?.data?.isInterested === true;
};

export const saveProfile = async (profile: Pick<SavedProfile, 'profileId'> | string) => {
  const profileId = typeof profile === 'string' ? profile : profile.profileId;
  const res = await apiClient.post(`/relationship/interests/${profileId}`, {});
  return res.data?.data || null;
};

export const removeSavedProfile = async (profileId: string) => {
  const res = await apiClient.delete(`/relationship/interests/${profileId}`);
  return res.data?.data || null;
};
