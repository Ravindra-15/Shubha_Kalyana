import apiClient from '../api/client';

const STEP_TO_SCREEN: Record<string, string> = {
  // First screen after registration is Marital Status, not Qualification.
  BASIC_DONE: 'BasicLifestyle',
  DETAILS_DONE: 'PartnerPreference',
  // MPIN has been removed from onboarding; the backend now auto-advances
  // straight past it (see upsertPartnerPreference), but these are mapped
  // forward defensively in case a stale status is ever read mid-transition.
  PARTNER_PREFERENCE_DONE: 'ProfilePhoto',
  OTP_SENT: 'ProfilePhoto',
  OTP_VERIFIED: 'ProfilePhoto',
  MPIN_CREATED: 'ProfilePhoto',
  PROFILE_PHOTO_UPLOADED: 'UploadAadhaar',
  IN_REVIEW: 'ReviewProfile',
  REJECTED: 'ReviewProfile',
};

/** The screen a given backend step belongs to (null when unknown). */
export function screenForOnboardingStep(step?: string | null): string | null {
  if (!step) return null;
  return STEP_TO_SCREEN[step] || null;
}

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