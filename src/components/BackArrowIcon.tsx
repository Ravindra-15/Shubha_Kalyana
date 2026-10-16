import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

type Props = {
  color?: string;
};

// The grey-circle back arrow from the View Profile screen, used for every
// back button in the app. Only the icon is styled here -- each screen keeps
// its own TouchableOpacity and goBack handler.
export default function BackArrowIcon({ color = '#000' }: Props) {
  return (
    <View style={styles.circle}>
      <ArrowLeft color={color} size={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
