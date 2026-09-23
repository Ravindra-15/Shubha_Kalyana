import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// The slide text sits straight on the photo now. Each line is drawn four
// times in black, one pixel around the real text, which gives a crisp outline
// that stays readable over both the bright and the red parts of the images.
const OUTLINE_OFFSETS = [
  { x: -1.6, y: 0 },
  { x: 1.6, y: 0 },
  { x: 0, y: -1.6 },
  { x: 0, y: 1.6 },
];

const GET_STARTED_SIZE = 80;

const RING_RADIUS = 35;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function OnboardingScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { markOnboardingSeen } = useAuth();
  const [index, setIndex] = useState(0);

  const slides = [
    {
      id: '1',
      image: require('../../assets/images/onboarding1.png'),
      line1: t('onboarding.slide1Line1'),
      highlight: t('onboarding.slide1Highlight'),
      line2: t('onboarding.slide1Line2'),
    },
    {
      id: '2',
      image: require('../../assets/images/onboarding2.png'),
      line1: t('onboarding.slide2Line1'),
      highlight: t('onboarding.slide2Highlight'),
      line2: '',
    },
    {
      id: '3',
      image: require('../../assets/images/onboarding3.png'),
      line1: t('onboarding.slide3Line1'),
      highlight: t('onboarding.slide3Highlight'),
      line2: t('onboarding.slide3Line2'),
    },
  ];
  const listRef = useRef<FlatList>(null);
  const isLast = index === slides.length - 1;

  // Get Started button: the red fills up once when this screen appears, then
  // stays full. Tapping it gives a small bump.
  const fill = useRef(new Animated.Value(0)).current;
  const bump = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLast) return undefined;

    fill.setValue(0);
    const fillUp = Animated.timing(fill, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    fillUp.start();
    return () => fillUp.stop();
  }, [isLast, fill]);

const handlePress = () => {
  if (!isLast) {
    goNext();
    return;
  }

  // Small bump, then continue. The delay is short enough not to feel slow.
  Animated.sequence([
    Animated.timing(bump, {
      toValue: 0.9,
      duration: 90,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.spring(bump, {
      toValue: 1,
      friction: 3,
      tension: 140,
      useNativeDriver: true,
    }),
  ]).start();

  setTimeout(goNext, 160);
};

const goNext = () => {
  if (isLast) {
    markOnboardingSeen();
    navigation.replace('SelectLanguage');
  } else {
    listRef.current?.scrollToIndex({ index: index + 1 });
  }
};
  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <ImageBackground source={item.image} style={styles.slide}>
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.bottom}>
                <View style={styles.textWrap}>
                  {OUTLINE_OFFSETS.map((offset) => (
                    <Text
                      key={`${offset.x}-${offset.y}`}
                      pointerEvents="none"
                      style={[
                        styles.heading,
                        styles.headingOutline,
                        { transform: [{ translateX: offset.x }, { translateY: offset.y }] },
                      ]}
                    >
                      {item.line1}{'\n'}
                      <Text style={styles.highlightOutline}>{item.highlight}</Text>
                      {item.line2 ? `\n${item.line2}` : ''}
                    </Text>
                  ))}

                  <Text style={styles.heading}>
                    {item.line1}{'\n'}
                    <Text style={styles.highlight}>{item.highlight}</Text>
                    {item.line2 ? `\n${item.line2}` : ''}
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          </ImageBackground>
        )}
      />

      <TouchableOpacity style={styles.arrowWrap} onPress={handlePress} activeOpacity={0.85}>
        {isLast ? (
          <Animated.View style={[styles.getStartedBtn, { transform: [{ scale: bump }] }]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.getStartedFill,
                {
                  transform: [
                    {
                      translateY: fill.interpolate({
                        inputRange: [0, 1],
                        outputRange: [GET_STARTED_SIZE, 0],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Text style={styles.getStartedText}>{t('onboarding.getStarted')}</Text>
          </Animated.View>
        ) : (
          <View style={styles.arrowRingWrap}>
            <Svg width={76} height={76} style={StyleSheet.absoluteFill}>
              <Circle
                cx={38}
                cy={38}
                r={35}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={2}
                fill="none"
              />
              <Circle
                cx={38}
                cy={38}
                r={35}
                stroke="#D20236"
                strokeWidth={2}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - (index + 1) / slides.length)}
                strokeLinecap="round"
                rotation="-90"
                origin="38, 38"
              />
            </Svg>
            <View style={styles.arrowInner}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  slide: { width, height, justifyContent: 'flex-start' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  safe: { flex: 1, paddingHorizontal: 24 },
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginTop: 16,
  },
  textWrap: {
    alignSelf: 'stretch',
  },
  bottom: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heading: {
    fontSize: 40,
    fontFamily: 'Outfit-SemiBold',
    color: '#fff',
    lineHeight: 48,
    textAlign: 'center',
  },
  // The four black copies behind the real text; everything else about them
  // matches, so the outline lines up exactly.
  headingOutline: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#000',
  },
  // The highlighted word uses Yeseva One (400), the same typeface as the
  // SHUBHA KALYANA wordmark in the logo, per Figma.
  highlight: { color: '#D20236', fontFamily: 'YesevaOne-Regular' },
  highlightOutline: { color: '#000', fontFamily: 'YesevaOne-Regular' },
  arrowWrap: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  arrowRingWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedBtn: {
    width: GET_STARTED_SIZE,
    height: GET_STARTED_SIZE,
    borderRadius: GET_STARTED_SIZE / 2,
    backgroundColor: '#7A0016',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  getStartedFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: GET_STARTED_SIZE,
    backgroundColor: '#FF0000',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
  },
  arrowText: { fontSize: 26, color: '#000', fontFamily: 'Outfit-SemiBold' },
});