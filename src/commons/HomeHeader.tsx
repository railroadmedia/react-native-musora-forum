import React, { FunctionComponent } from 'react';
import { StyleProp, StyleSheet, Text, View } from 'react-native';
import { IS_TABLET } from '../services/helpers';
import { SafeAreaView } from 'react-native-safe-area-context';

interface IHomeHeader {
  isDark: boolean;
  appColor: string;
}

const HomeHeader: FunctionComponent<IHomeHeader> = props => {
  const { isDark, appColor } = props;
  const styles = setStyles(isDark, appColor);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <Text style={styles.sectionTitle}>Forums</Text>
      <View style={{ backgroundColor: '#223F57', height: 1, marginHorizontal: 10 }} />
    </SafeAreaView>
  );
};
const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    container: {},
    sectionTitle: {
      fontFamily: 'OpenSans-Bold',
      fontSize: IS_TABLET ? 32 : 28,
      color: isDark ? '#FFFFFF' : '#00101D',

      margin: 5,
      marginLeft: 15,
      marginVertical: 20,
      backgroundColor: isDark ? '#00101D' : '#f0f1f2',
    },
  });

export default HomeHeader;
