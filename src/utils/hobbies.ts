// Canonical hobby sections (same as the server, web app and admin panel).
// "Others" appears in every section but is stored once as plain "Others".
export const HOBBY_GROUPS = [
  {
    title: 'Entertainment',
    items: ['Music', 'Movies', 'Web Series', 'Reading', 'Podcasts', 'Others'],
  },
  {
    title: 'Lifestyle & Activities',
    items: ['Traveling', 'Cooking', 'Gardening', 'Shopping', 'Driving', 'Smoking', 'Drinking', 'Others'],
  },
  {
    title: 'Fitness & Health',
    items: ['Gym', 'Yoga', 'Running', 'Meditation', 'Sports', 'Cycling', 'Others'],
  },
];

export type HobbyGroup = (typeof HOBBY_GROUPS)[number];

// Client rule: at most 3 picks per section (its "Others" chip included).
export const HOBBY_GROUP_LIMIT = 3;

export const hobbyLimitMessage = (groupTitle: string) =>
  `You can select only ${HOBBY_GROUP_LIMIT} hobbies from ${groupTitle}.`;

export const groupOfHobby = (hobby: string) =>
  HOBBY_GROUPS.find((group) => hobby !== 'Others' && group.items.includes(hobby));

const namedCount = (selected: string[], group: HobbyGroup) =>
  selected.filter((hobby) => hobby !== 'Others' && group.items.includes(hobby)).length;

export const countInGroup = (
  selected: string[],
  othersActiveGroups: Set<string>,
  group: HobbyGroup,
) => namedCount(selected, group) + (othersActiveGroups.has(group.title) ? 1 : 0);

// A saved "Others" never recorded which section it came from. Show it in
// the first section that still has room, so it takes one slot -- not one
// slot in every section, which would wrongly block picks elsewhere.
export const initialOthersGroups = (selected: string[]): Set<string> => {
  if (!selected.includes('Others')) return new Set();
  const withRoom = HOBBY_GROUPS.find((group) => namedCount(selected, group) < HOBBY_GROUP_LIMIT);
  return new Set([(withRoom || HOBBY_GROUPS[0]).title]);
};
