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

/**
 * The profile screens, in the order the user walks through them. Registration
 * (profile-for / name / contact / caste) is already finished by the time we
 * resume, so it is deliberately not part of this list.
 */
export const PROFILE_FLOW = [
  'BasicLifestyle',
  'Qualification',
  'FamilyDetails',
  'Horoscope',
  'AddressDetails',
  'Employment',
  'AboutYou',
  'PartnerPreference',
  'ProfilePhoto',
  'Hobbies',
  'UploadAadhaar',
];

/** Which status flag tells us a given screen already holds data. */
const SCREEN_DONE_FLAG: Record<string, (status: any) => boolean> = {
  BasicLifestyle: (s) => Boolean(s?.detailsProgress?.basicLifestyle),
  Qualification: (s) => Boolean(s?.detailsProgress?.qualification),
  FamilyDetails: (s) => Boolean(s?.detailsProgress?.family),
  Horoscope: (s) => Boolean(s?.detailsProgress?.horoscope),
  AddressDetails: (s) => Boolean(s?.detailsProgress?.address),
  Employment: (s) => Boolean(s?.detailsProgress?.employment),
  AboutYou: (s) => Boolean(s?.detailsProgress?.about),
  PartnerPreference: (s) => Boolean(s?.partnerPreferenceCompleted),
  ProfilePhoto: (s) => Boolean(s?.profilePhotoUploaded),
  Hobbies: (s) => Boolean(s?.detailsProgress?.hobbies),
  UploadAadhaar: (s) => Boolean(s?.aadhaarUploaded),
};

/**
 * The first screen in the flow that has no data yet. The backend step alone is
 * too coarse -- it reads DETAILS_DONE after the very first save -- so this
 * checks what is actually filled and falls back to the step's own screen.
 */
export async function firstUnfinishedScreen(fallback: string): Promise<string> {
  try {
    const res = await apiClient.get('/onboarding/status');
    const status = res.data?.data;

    if (!status?.detailsProgress) return fallback;

    const pending = PROFILE_FLOW.find((screen) => {
      const isDone = SCREEN_DONE_FLAG[screen];
      return isDone ? !isDone(status) : false;
    });

    return pending || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Opens a resumed screen with the earlier screens behind it, so Back walks
 * through the flow instead of dropping the user on Login or Contact Details.
 */
export function resumeToScreen(navigation: any, screen: string) {
  const index = PROFILE_FLOW.indexOf(screen);

  if (index < 0) {
    navigation.navigate(screen);
    return;
  }

  const routes = [
    { name: 'Login' },
    ...PROFILE_FLOW.slice(0, index + 1).map((name) => ({ name })),
  ];

  navigation.reset({ index: routes.length - 1, routes });
}

/**
 * Resume from a backend step: works out the exact screen, then opens it with
 * the earlier screens behind it.
 */
export async function resumeFromStep(navigation: any, step?: string | null) {
  const mapped = screenForOnboardingStep(step);

  if (!mapped) return false;

  // Only the profile screens need the finer check; photo/Aadhaar/review are
  // already exact.
  const target = PROFILE_FLOW.includes(mapped)
    ? await firstUnfinishedScreen(mapped)
    : mapped;

  resumeToScreen(navigation, target);
  return true;
}

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