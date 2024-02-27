import React, { FunctionComponent, ReactElement } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { check, unfollow } from '../../assets/svgs';
import type { ISvg } from '../../entity/ISvg';

export interface IMenuOption {
  text: string;
  icon: (param: ISvg) => ReactElement;
  action: () => void;
}

interface IHeaderOptionsModal {
  optionsVisible: boolean;
  setOptionsVisible: (visible: boolean) => void;
  followStateVisible: boolean;
  isFollowed: boolean;
  menuOptions: { [key: string]: IMenuOption };
  isDark: boolean;
}

const HeaderOptionsModal: FunctionComponent<IHeaderOptionsModal> = props => {
  const { optionsVisible, setOptionsVisible, followStateVisible, isFollowed, menuOptions, isDark } =
    props;
  const styles = localStyles(isDark);

  return (
    <Modal
      animationType='slide'
      onRequestClose={() => setOptionsVisible(false)}
      supportedOrientations={['portrait', 'landscape']}
      transparent={true}
      visible={optionsVisible || followStateVisible}
    >
      <LinearGradient
        style={styles.lgradient}
        colors={['rgba(0, 12, 23, 0.69)', 'rgba(0, 12, 23, 1)']}
      />
      <TouchableOpacity
        activeOpacity={1}
        style={styles.optionsContainer}
        onPress={() => setOptionsVisible(false)}
      >
        {followStateVisible ? (
          <View
            style={{
              ...styles.followStateContainer,
              borderTopColor: isFollowed ? '#34D399' : '#FFAE00',
            }}
          >
            {(isFollowed ? check : unfollow)({
              height: 25,
              width: 25,
              fill: isFollowed ? '#34D399' : '#FFAE00',
            })}
            <Text style={styles.followStateTitle}>
              {isFollowed ? 'Follow' : 'Unfollow'} Thread{'\n'}
              <Text
                style={{
                  color: isDark ? 'white' : '#000000',
                  fontFamily: 'OpenSans',
                }}
              >
                {`You've ${isFollowed ? 'started following' : 'unfollowed'} this thread.`}
              </Text>
            </Text>
          </View>
        ) : (
          <SafeAreaView style={styles.options}>
            {Object.values(menuOptions).map(({ text, icon, action }) => (
              <TouchableOpacity key={text} onPress={action} style={styles.optionBtn}>
                {icon({ width: 20, fill: '#FFFFFF' })}
                <Text style={styles.optionText}>{text}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setOptionsVisible(false)}>
              <Text style={styles.closeText}>{'Close'}</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}
      </TouchableOpacity>
    </Modal>
  );
};

const localStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 10,
    },
    lgradient: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      zIndex: 0,
    },
    optionsContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 10,
    },
    followStateContainer: {
      margin: 5,
      padding: 15,
      borderTopWidth: 6,
      borderRadius: 8,
      flexDirection: 'row',
    },
    followStateTitle: {
      paddingLeft: 15,
      color: isDark ? 'white' : '#000000',
      fontFamily: 'OpenSans-Bold',
    },
    options: {
      padding: 20,
      borderTopEndRadius: 20,
      borderTopStartRadius: 20,
    },
    optionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      paddingVertical: 13,
      color: 'white',
      fontFamily: 'OpenSans',
      fontSize: 16,
      marginLeft: 15,
    },
    closeText: {
      fontSize: 18,
      color: '#FFFFFF',
      padding: 10,
      alignSelf: 'center',
      textAlign: 'center',
      fontFamily: 'OpenSans-Bold',
    },
  });

export default HeaderOptionsModal;
