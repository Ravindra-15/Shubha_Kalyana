import apiClient from './client';

export type Caste = {
  _id: string;
  religion?: string;
  casteName: string;
  subCastes: string[];
};

export const getCastes = async (): Promise<Caste[]> => {
  const res = await apiClient.get('/caste', { params: { limit: 200 } });
  return res.data?.data?.castes || [];
};

export const getCasteOptions = async (): Promise<Caste[]> => {
  const res = await apiClient.get('/caste/options');
  return res.data?.data?.castes || [];
};

export const getReligionOptions = async (): Promise<string[]> => {
  const res = await apiClient.get('/caste/religions');
  return res.data?.data?.religions || [];
};
