import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { coach, team, edge, lifetime } from '../assets/svgs';
import UserInfo from './UserInfo';

export default class AccessLevelAvatar extends React.Component {
  state = {
    showUserInfo: false,
  };

  get userBorderColor() {
    let borderColor, userTagIcon, userTagText;
    let { appColor, author } = this.props;

    switch (author.access_level) {
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
  }

  onAvatarPress = () => {
    let { author, showUserInfo, onNavigateToCoach } = this.props;
    if (showUserInfo) {
      if (
        (author.access_level === 'coach' || author.access_level === 'house-coach') &&
        author.associated_coach?.id
      ) {
        onNavigateToCoach?.(author.associated_coach?.id);
      } else {
        this.setState({ showUserInfo: true });
      }
    }
  };

  render() {
    let { author, height, tagHeight, isDark, appColor } = this.props;
    let { borderColor, userTagIcon, userTagText } = this.userBorderColor;
    return (
      <>
        <TouchableOpacity
          style={{ ...styles.imgContainer, borderColor }}
          onPress={this.onAvatarPress}
          disallowInterruption={true}
        >
          <Image
            source={{
              uri: `https://cdn.musora.com/image/fetch/w_200,fl_lossy,q_auto:eco,c_fill,g_face/${author.avatar_url}`,
            }}
            style={{ height, aspectRatio: 1 }}
          />
          {userTagText ? (
            <View
              style={{
                ...styles.userTagContainer,
                backgroundColor: borderColor,
                height: 10,
                lineHeight: 10,
              }}
            >
              <Text style={styles.userTagText}>{userTagText}</Text>
            </View>
          ) : (
            <View
              style={{
                ...styles.userTagContainer,
                backgroundColor: borderColor,
                height: tagHeight + 2,
                lineHeight: tagHeight + 2,
              }}
            >
              {userTagIcon?.({ height: tagHeight, fill: 'white' })}
            </View>
          )}
        </TouchableOpacity>
        <UserInfo
          isVisible={this.state.showUserInfo}
          onHideUserInfo={() => this.setState({ showUserInfo: false })}
          author={author}
          isDark={isDark}
          appColor={appColor}
        />
      </>
    );
  }
}
let styles = StyleSheet.create({
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
