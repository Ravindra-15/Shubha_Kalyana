import apiClient from './client';

export const INACTIVITY_FEEDBACK_REASONS = [
  'Found a match already',
  'Not satisfied with the matches shown',
  'Technical / portal issues',
  'Poor customer support experience',
  'Privacy or safety concerns',
  'Too busy / no time currently',
  'Planning to use it later',
  'Other',
] as const;

export type InactivityFeedbackReason = typeof INACTIVITY_FEEDBACK_REASONS[number];

export type InactivityPromptStatus = {
  shouldPrompt: boolean;
  daysInactive?: number;
  reasons?: InactivityFeedbackReason[];
};

export const getInactivityPromptStatus = async (): Promise<InactivityPromptStatus> => {
  const res = await apiClient.get('/inactivity-feedback/status');
  return res.data?.data;
};

export const submitInactivityFeedback = async (payload: {
  reasons: InactivityFeedbackReason[];
  description?: string;
}) => {
  const res = await apiClient.post('/inactivity-feedback', payload);
  return res.data?.data;
};
