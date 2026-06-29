import apiClient from './client';

export type Caste = {
  _id: string;
  casteName: string;
  subCastes: string[];
};

export const getCastes = async (): Promise<Caste[]> => {
  const res = await apiClient.get('/caste', { params: { limit: 200 } });
  return res.data?.data?.castes || [];
};