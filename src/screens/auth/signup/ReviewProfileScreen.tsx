import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ProgressBar from '../../../components/ProgressBar';
import { useSignup } from '../../../context/SignupContext';
import { useTranslation } from 'react-i18next';
import SplitTitle from '../../../components/SplitTitle';

export default function ReviewProfileScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { reset } = useSignup();

  // Onboarding is complete on this screen, so going back is not allowed.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const goToLogin = () => {
    reset(); // clear signup data
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <ProgressBar step={16} total={16} />

        <View style={styles.content}>
          <SplitTitle
            style={styles.title}
            highlightStyle={styles.titleRed}
            pre={t('signup.review.titlePre')}
            highlight={t('signup.review.titleHighlight')}
            post={t('signup.review.titlePost')}
          />

          <Text style={styles.subtitle}>{t('signup.review.subtitle')}</Text>

          <Image
            source={require('../../../assets/images/review-profile.png')}
            style={styles.reviewImage}
            resizeMode="contain"
          />

          <Text style={styles.note}>{t('signup.review.note')}</Text>

          <Text style={[styles.note, styles.noteNotification]}>
            {t('signup.review.notification')}
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={goToLogin}>
          <Text style={styles.btnText}>{t('signup.review.goToLogin')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 30 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit-Regular',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
  },
  reviewImage: {
    // Keeps the artwork's own 1672x941 proportions.
    width: 300,
    height: 169,
    marginBottom: 30,
  },
  icon: { fontSize: 60 },
  note: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  noteNotification: { marginTop: 12 },
  btn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});
