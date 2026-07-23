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

export const getSavedProfiles = async (params?: SavedProfilesParams) => {
  const res = await apiClient.get('/relationship/saved-profiles/me', {
    params,
  });

  return res.data?.data || { savedProfiles: [], pagination: null };
};

export const isProfileSaved = async (profileId: string): Promise<boolean> => {
  const res = await apiClient.get(`/relationship/saved-profiles/check/${profileId}`);
  return res.data?.data?.isSaved === true;
};

export const saveProfile = async (profile: Pick<SavedProfile, 'profileId'> | string) => {
  const profileId = typeof profile === 'string' ? profile : profile.profileId;
  const res = await apiClient.post(`/relationship/saved-profiles/${profileId}`, {});
  return res.data?.data || null;
};

export const removeSavedProfile = async (profileId: string) => {
  const res = await apiClient.delete(`/relationship/saved-profiles/${profileId}`);
  return res.data?.data || null;
};
