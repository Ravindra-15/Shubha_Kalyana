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

// Religions left out of the partner-preference lists only (a user can still
// pick them as their own religion).
const HIDDEN_PREFERRED_RELIGION_PATTERN = /jew|bah[aá]|sarna|tribal|indigenous/i;

export const isShownAsPreferredReligion = (religion: string) =>
  !HIDDEN_PREFERRED_RELIGION_PATTERN.test(religion || '');
