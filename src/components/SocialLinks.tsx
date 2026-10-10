import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

type IconProps = { color: string; size: number };

const FacebookIcon = ({ color, size }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <Path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
  </Svg>
);

const InstagramIcon = ({ color, size }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <Path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.15-1.77a4.9 4.9 0 0 1 1.77-1.15c.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.17 1.17 0 1 1 0-2.34 1.17 1.17 0 0 1 0 2.34z" />
  </Svg>
);

const XIcon = ({ color, size }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <Path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.9L4.8 22H1.7l8.1-9.3L1 2h7.1l4.9 6.3L18.9 2zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20z" />
  </Svg>
);

const YouTubeIcon = ({ color, size }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <Path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.5v-7l6.3 3.5-6.3 3.5z" />
  </Svg>
);

// Same 4 platforms, URLs and brand colors as the web app's footer
// (matrimony-user/src/components/sections/FooterSection.jsx) -- kept in
// sync with that list rather than inventing new links.
const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61594512581744',
    Icon: FacebookIcon,
    iconColor: '#1877F2',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/shubhakalyana_matrimony',
    Icon: InstagramIcon,
    iconColor: '#fff',
    gradient: true,
  },
  {
    label: 'X',
    href: 'https://x.com/shubhakalyana',
    Icon: XIcon,
    iconColor: '#000',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/channel/UCFs2a43fIYqwFGdW93Kq1Qw',
    Icon: YouTubeIcon,
    iconColor: '#FF0000',
  },
];

export default function SocialLinks() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Follow us on</Text>
      <View style={styles.row}>
        {SOCIAL_LINKS.map(({ label, href, Icon, iconColor, gradient }) => (
          <TouchableOpacity
            key={label}
            activeOpacity={0.8}
            onPress={() => openLink(href)}
            accessibilityLabel={label}
            style={styles.circleWrap}
          >
            {gradient ? (
              <LinearGradient
                colors={['#fdf497', '#fd5949', '#d6249f', '#285aeb']}
                start={{ x: 0.3, y: 1 }}
                end={{ x: 0.9, y: 0 }}
                style={styles.circle}
              >
                <Icon color={iconColor} size={18} />
              </LinearGradient>
            ) : (
              <View style={styles.circle}>
                <Icon color={iconColor} size={18} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start', marginTop: 16, marginBottom: 0 },
  // Matches the other section headings on Home (e.g. "Vendors") --
  // styles.sectionTitle there.
  heading: { fontSize: 18, color: '#000', fontFamily: 'Outfit-Bold', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 14 },
  circleWrap: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderRadius: 20,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
