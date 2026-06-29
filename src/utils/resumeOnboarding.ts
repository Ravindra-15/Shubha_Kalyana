import apiClient from '../api/client';

const STEP_TO_SCREEN: Record<string, string> = {
  BASIC_DONE: 'Qualification',
  DETAILS_DONE: 'PartnerPreference',
  PARTNER_PREFERENCE_DONE: 'VerifyMobile',
  OTP_SENT: 'VerifyMobile',
  OTP_VERIFIED: 'SetupMpin',
  MPIN_CREATED: 'ProfilePhoto',
  PROFILE_PHOTO_UPLOADED: 'UploadAadhaar',
  IN_REVIEW: 'ReviewProfile',
  REJECTED: 'ReviewProfile',
};

export async function getResumeScreen(): Promise<string | null> {
  try {
    const res = await apiClient.get('/onboarding/status');
    const step = res.data?.data?.onboardingStep;
    if (!step) return null;
    return STEP_TO_SCREEN[step] || null;
  } catch {
    return null;
  }
}