import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';
import { useTranslation } from 'react-i18next';
import SplitTitle from '../../../components/SplitTitle';
import {
  HOBBY_GROUPS as GROUPS,
  HOBBY_GROUP_LIMIT,
  countInGroup,
  groupOfHobby,
  hobbyLimitMessage,
  initialOthersGroups,
} from '../../../utils/hobbies';

export default function HobbiesScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { data, setField } = useSignup();
  const [selected, setSelected] = useState<string[]>(data.hobbies || []);
  // Each group has its own "Others" chip, but they all share the literal
  // string "Others" in `selected` -- previously that meant clicking any one
  // of them lit up all three, since they were indistinguishable. Tracked
  // here separately, per group, so each toggles independently; `selected`
  // still only ever stores plain "Others" (once, if any group has it
  // active), so the saved data shape is completely unchanged.
  const [othersActiveGroups, setOthersActiveGroups] = useState<Set<string>>(
    () => initialOthersGroups(data.hobbies || []),
  );
  const [loading, setLoading] = useState(false);

  // Max 3 per section (its Others chip included); deselecting is always allowed.
  const isGroupFull = (groupTitle: string) => {
    const group = GROUPS.find((g) => g.title === groupTitle);
    return Boolean(group) && countInGroup(selected, othersActiveGroups, group!) >= HOBBY_GROUP_LIMIT;
  };

  const toggle = (item: string) => {
    const group = groupOfHobby(item);
    if (!selected.includes(item) && group && isGroupFull(group.title)) {
      Alert.alert('Limit reached', hobbyLimitMessage(group.title));
      return;
    }
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleOthers = (groupTitle: string) => {
    if (!othersActiveGroups.has(groupTitle) && isGroupFull(groupTitle)) {
      Alert.alert('Limit reached', hobbyLimitMessage(groupTitle));
      return;
    }
    setOthersActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupTitle)) next.delete(groupTitle);
      else next.add(groupTitle);

      setSelected((prevSelected) => {
        const hasOthers = prevSelected.includes('Others');
        if (next.size > 0 && !hasOthers) return [...prevSelected, 'Others'];
        if (next.size === 0 && hasOthers) return prevSelected.filter((x) => x !== 'Others');
        return prevSelected;
      });

      return next;
    });
  };

  const submit = async (skip = false) => {
    if (skip) {
      navigation.navigate('UploadAadhaar');
      return;
    }
    if (selected.length === 0) {
      return navigation.navigate('UploadAadhaar');
    }

    try {
      setLoading(true);
      await apiClient.patch('/onboarding/profile', { hobbiesAndInterests: selected });
      setField('hobbies', selected);
      navigation.navigate('UploadAadhaar');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper>
        <View style={styles.inner}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={14} total={16} />

          <SplitTitle
            style={styles.title}
            highlightStyle={styles.titleRed}
            newLine
            pre={t('signup.hobbies.titlePre')}
            highlight={t('signup.hobbies.titleHighlight')}
            post={t('signup.hobbies.titlePost')}
          />

          {GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.chipRow}>
                {group.items.map((item) => {
                  const isOthers = item === 'Others';
                  const active = isOthers
                    ? othersActiveGroups.has(group.title)
                    : selected.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => (isOthers ? toggleOthers(group.title) : toggle(item))}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.nextBtn} onPress={() => submit(false)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{t('signup.common.next')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => submit(true)}>
            <Text style={styles.skipText}>{t('signup.common.skip')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: { fontSize: 24, fontFamily: 'Outfit-Regular', color: '#000', textAlign: 'center', marginBottom: 24, marginTop: 6 },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#000', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 30,
    paddingVertical: 9,
    paddingHorizontal: 18,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  spacer: { minHeight: 20 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: { color: '#000', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
});