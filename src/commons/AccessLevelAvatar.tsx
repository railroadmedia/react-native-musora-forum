import React, { FunctionComponent, ReactElement, useCallback, useMemo, useState } from 'react';
import { Image, StyleSheet, View, Text, StyleProp } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { coach, team, edge, lifetime } from '../assets/svgs';
import UserInfo from './UserInfo';
import type { IAuthor } from '../entity/IForum';
import type { ISvg } from '../entity/ISvg';

interface IAccessLevelAvatar {
  appColor: string;
  author: IAuthor;
  height: number;
  tagHeight: number;
  isDark: boolean;
  onNavigateToCoach?: (id: number) => void;
  onMenuPress?: () => void;
  showUserInfo?: boolean;
}

const AccessLevelAvatar: FunctionComponent<IAccessLevelAvatar> = props => {
  const {
    author,
    height,
    tagHeight,
    isDark,
    appColor,
    onNavigateToCoach,
    showUserInfo: showUserInfoProp,
    onMenuPress: onMenuPressProp,
  } = props;
  const [showUserInfo, setShowUserInfo] = useState(false);

  const userBorderColor = useMemo(() => {
    let borderColor: string | undefined;
    let userTagIcon: ((_: ISvg) => ReactElement) | undefined;
    let userTagText: string | undefined;

    switch (author?.access_level) {
      case 'edge': {
        borderColor = appColor;
        userTagIcon = edge;
        break;
      }
      case 'team': {
        borderColor = 'black';
        userTagIcon = team;
        break;
      }
      case 'piano': {
        borderColor = appColor;
        break;
      }
      case 'lifetime': {
        borderColor = '#07B3FF';
        userTagIcon = lifetime;
        break;
      }
      case 'coach': {
        borderColor = '#FAA300';
        userTagIcon = coach;
        break;
      }
      case 'house-coach': {
        borderColor = '#FAA300';
        userTagText = 'HOUSE';
        break;
      }
    }

    return { borderColor, userTagIcon, userTagText };
  }, [author, appColor]);

  const onAvatarPress = useCallback(() => {
    if (showUserInfoProp) {
      if (
        (author?.access_level === 'coach' || author?.access_level === 'house-coach') &&
        author?.associated_coach?.id
      ) {
        onNavigateToCoach?.(author?.associated_coach?.id);
      } else {
        setShowUserInfo(true);
      }
    }
  }, [showUserInfoProp, author, onNavigateToCoach]);

  const onHideUserInfo = useCallback(() => {
    setShowUserInfo(false);
  }, []);

  const onMenuPress = useCallback(() => {
    onMenuPressProp?.();
    setShowUserInfo(false);
  }, [onMenuPressProp]);

  return (
    <>
      <TouchableOpacity
        style={[styles.imgContainer, { borderColor: userBorderColor?.borderColor }]}
        onPress={onAvatarPress}
        disallowInterruption={true}
      >
        <Image source={{ uri: author?.avatar_url }} style={{ height, aspectRatio: 1 }} />
        {userBorderColor?.userTagText ? (
          <View
            style={{
              ...styles.userTagContainer,
              backgroundColor: userBorderColor?.borderColor,
              height: 10,
            }}
          >
            <Text style={styles.userTagText}>{userBorderColor?.userTagText}</Text>
          </View>
        ) : (
          <View
            style={{
              ...styles.userTagContainer,
              backgroundColor: userBorderColor?.borderColor,
              height: tagHeight + 2,
            }}
          >
            {userBorderColor?.userTagIcon?.({
              height: tagHeight,
              fill: 'white',
            })}
          </View>
        )}
      </TouchableOpacity>
      <UserInfo
        isVisible={showUserInfo}
        onHideUserInfo={onHideUserInfo}
        author={author}
        isDark={isDark}
        appColor={appColor}
        onMenuPress={onMenuPress}
      />
    </>
  );
};

const styles: StyleProp<any> = StyleSheet.create({
  imgContainer: {
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 2,
  },
  userTagContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTagText: {
    fontFamily: 'BebasNeuePro-Bold',
    fontSize: 7,
    color: '#FFFFFF',
  },
});

export default AccessLevelAvatar;
