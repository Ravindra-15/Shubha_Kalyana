import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: require('../../assets/images/onboarding1.png'),
    line1: 'Find',
    highlight: 'Meaningful',
    line2: 'Matches !',
  },
  {
    id: '2',
    image: require('../../assets/images/onboarding2.png'),
    line1: 'Connect with',
    highlight: 'Confidence',
    line2: '',
  },
  {
    id: '3',
    image: require('../../assets/images/onboarding3.png'),
    line1: 'Start Your',
    highlight: 'Journey',
    line2: 'Today',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLast = index === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      navigation.replace('Login');
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
                <Text style={styles.heading}>
                  {item.line1}{'\n'}
                  <Text style={styles.highlight}>{item.highlight}</Text>
                  {item.line2 ? `\n${item.line2}` : ''}
                </Text>
              </View>
            </SafeAreaView>
          </ImageBackground>
        )}
      />

      <TouchableOpacity style={styles.arrowWrap} onPress={goNext} activeOpacity={0.8}>
        {isLast ? (
          <View style={styles.getStartedBtn}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </View>
        ) : (
          <View style={styles.arrowRing}>
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
    width: 90,
    height: 90,
    alignSelf: 'center',
    marginTop: 20,
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
    fontWeight: '700',
    color: '#fff',
    lineHeight: 48,
    textAlign: 'center',
  },
  highlight: { color: '#D20236' },
  arrowWrap: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  arrowRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#D20236',
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
    width: 80,
    height: 80,
    borderRadius: 45,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  arrowText: { fontSize: 26, color: '#000', fontWeight: '600' },
});