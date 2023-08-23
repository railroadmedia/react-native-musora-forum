/**
 * PROPS: post, onDelete, appColor, isDark
 * post: post to be displayed
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import AccessLevelAvatar from './AccessLevelAvatar';
import HTMLRenderer from './HTMLRenderer';

import { like, likeOn, menuHSvg, replies } from '../assets/svgs';

import { likePost, disLikePost, connection } from '../services/forum.service';
import { updatePosts } from '../redux/ThreadActions';
import { IS_TABLET } from '../index';

let styles;

class Post extends React.Component {
  constructor(props) {
    super(props);
    const { post, isDark, appColor } = props;

    this.state = {
      isLiked: post?.is_liked_by_viewer,
      likeCount: post?.like_count,
      isPostReported: post?.is_reported_by_viewer,
    };
    styles = setStyles(isDark, appColor);
  }

  toggleLike = () => {
    if (!connection(true)) return;
    let { id } = this.props.post;
    let { isLiked, likeCount } = this.state;
    this.props.updatePosts({
      ...this.props.post,
      is_liked_by_viewer: !isLiked,
      like_count: isLiked ? likeCount - 1 : likeCount + 1,
    });
    this.setState(({ isLiked, likeCount }) => {
      if (isLiked) {
        likeCount--;
        disLikePost(id);
      } else {
        likeCount++;
        likePost(id);
      }
      return { likeCount, isLiked: !isLiked };
    });
  };

  onNavigateToCoach = id => {
    this.props.navigation.navigate('CoachOverview', { id });
  };

  reply = () => {
    let { post, onPostCreated } = this.props;
    this.props.navigation.navigate('CRUD', {
      type: 'post',
      action: 'create',
      threadId: post?.thread_id,
      onPostCreated,
      quotes: [
        {
          ...post,
          content: `<blockquote><b>${post?.author?.display_name}</b>:<br>${post?.content}</blockquote>`,
        },
      ],
    });
  };

  render() {
    let { isLiked, likeCount } = this.state;
    let { post, appColor, index, isDark, signShown, locked, user, selected } = this.props;
    let baseColor = isDark ? '#081825' : '#FFFFFF';
    let selectedColor = isDark ? '#002039' : '#E1E6EB';
    if (
      post &&
      post?.content?.includes(`<p><img src="https://cdn.tiny.cloud`)
    ) {
      post.content = post?.content?.replace(
        `<p><img`,
        `<p style="flex-direction:row;"><img `
      );
    }
    return (
      <>
        {!!post && (
          <View
            disabled={!!locked}
            activeOpacity={1}
            style={{
              marginBottom: 40,
              backgroundColor: selected ? selectedColor : baseColor,
            }}
          >
            <View style={styles.header}>
              <Text style={styles.headerText}>#{index}</Text>
              <Text style={styles.headerText}>
                {post?.published_on_formatted}
              </Text>
            </View>
            <View style={styles.header}>
              <View style={styles.userDetails}>
                <AccessLevelAvatar
                  author={post?.author}
                  height={45}
                  appColor={appColor}
                  isDark={isDark}
                  tagHeight={4}
                  showUserInfo={true}
                  onNavigateToCoach={this.onNavigateToCoach}
                  onMenuPress={() => {
                    this.props.toggleMenu(post, 'user');
                  }}
                />
                <View style={{ marginLeft: 5 }}>
                  <Text
                    style={styles.name}
                    numberOfLines={2}
                    ellipsizeMode='tail'
                  >
                    {post?.author?.display_name}
                  </Text>
                  <Text style={styles.xp}>
                    {post?.author?.total_posts} Posts - {post?.author?.xp_rank}{' '}
                    - Level {post?.author?.level_rank}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 15 }}>
              <HTMLRenderer
                appColor={appColor}
                html={post?.content}
                tagsStyles={{
                  div: {
                    color: isDark ? 'white' : '#00101D',
                    fontFamily: 'OpenSans',
                    fontSize: 14,
                  },
                  blockquote: {
                    padding: 10,
                    borderRadius: 5,
                    fontFamily: 'OpenSans',
                  },
                }}
                olItemStyle={{
                  color: isDark ? 'white' : '#00101D',
                  fontFamily: 'OpenSans',
                }}
                ulItemStyle={{
                  color: isDark ? 'white' : '#00101D',
                  fontFamily: 'OpenSans',
                }}
                classesStyles={{
                  'blockquote-even': {
                    backgroundColor: isDark ? '#081825' : 'white',
                  },
                  'blockquote-odd': {
                    backgroundColor: isDark ? '#002039' : '#E1E6EB',
                  },
                  'shadow': {
                    elevation: 5,
                    shadowColor: 'black',
                    shadowOffset: { height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 2,
                    borderRadius: 5,
                  },
                }}
              />
            </View>
            <View style={styles.likeContainer}>
              <TouchableOpacity
                disabled={user.id === post?.author_id}
                onPress={this.toggleLike}
                disallowInterruption={true}
                style={styles.interactionBtn}
              >
                {(isLiked ? likeOn : like)({
                  height: 15,
                  width: 15,
                  fill: appColor,
                })}
                {likeCount > 0 && (
                  <Text style={styles.likesNoText}>{likeCount}</Text>
                )}
              </TouchableOpacity>
              {!locked && (
                <TouchableOpacity
                  onPress={this.reply}
                  disallowInterruption={true}
                  style={styles.interactionBtn}
                >
                  {replies({
                    height: 15,
                    width: 15,
                    fill: appColor,
                  })}
                  <Text style={styles.likesNoText}>REPLY</Text>
                </TouchableOpacity>
              )}
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  onPress={() => this.props.toggleMenu(post, 'post')}
                  disallowInterruption={true}
                >
                  {menuHSvg({
                    width: 23,
                    height: 20,
                    fill: isDark ? 'white' : 'black',
                  })}
                </TouchableOpacity>
              </View>
            </View>
            {signShown && !!post?.author?.signature && (
              <View style={styles.signatureContainer}>
                <HTMLRenderer
                  html={post?.author?.signature}
                  tagsStyles={{ div: styles.signature }}
                />
              </View>
            )}
          </View>
        )}
      </>
    );
  }
}

let setStyles = (isDark, appColor) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 10,
      paddingBottom: 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    userDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    xp: {
      fontSize: 16,
      fontFamily: 'BebasNeue-Regular',
      color: isDark ? '#FFFFFF' : '#00101D',
    },
    headerText: {
      fontSize: IS_TABLET ? 16 : 14,
      fontFamily: 'OpenSans',
      color: isDark ? '#9EC0DC' : '#3F3F46',
    },
    name: {
      fontSize: IS_TABLET ? 18 : 16,
      fontFamily: 'OpenSans-Bold',
      color: isDark ? '#FFFFFF' : '#00101D',
    },
    post: {
      fontSize: 14,
      fontFamily: 'OpenSans',
      color: isDark ? '#FFFFFF' : '#00101D',
    },
    likeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    likesNoContainer: {
      padding: 5,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: isDark ? '#001f38' : '#97AABE',
    },
    likesNoText: {
      fontSize: 16,
      fontFamily: 'BebasNeuePro-Bold',
      color: isDark ? '#FFFFFF' : '#00101D',
      paddingLeft: 5,
    },
    menuContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      flexDirection: 'row',
      padding: 15,
    },
    replyText: {
      color: isDark ? '#445F74' : '#00101D',
      fontSize: 10,
      fontFamily: 'BebasNeuePro-Bold',
    },
    signatureContainer: {
      borderTopColor: isDark ? '#445F74' : 'lightgrey',
      borderTopWidth: 1,
      padding: 15,
      paddingVertical: 5,
    },
    signature: {
      color: isDark ? '#9EC0DC' : '#00101D',
      fontFamily: 'OpenSans',
      fontSize: IS_TABLET ? 16 : 14,
    },
    triangle: {
      width: 0,
      height: 0,
      borderTopWidth: 5,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderColor: 'transparent',
      borderTopColor: appColor,
    },
    reportModalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    reportModalContainer: {
      backgroundColor: isDark ? '#002039' : '#E1E6EB',
      borderRadius: 10,
      maxWidth: 300,
    },
    reportTitle: {
      padding: 15,
      paddingBottom: 0,
      fontFamily: 'OpenSans-Bold',
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center',
    },
    reportMessage: {
      padding: 15,
      fontFamily: 'OpenSans',
      fontSize: 12,
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center',
    },
    reportBtnsContainer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#545458A6',
    },
    reportBtnText: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 12,
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center',
      paddingVertical: 15,
    },
    interactionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      paddingLeft: 7.5,
    },
  });
const mapStateToProps = ({ threads: { signShown, posts } }, { id }) => ({
  signShown,
  post: posts[id],
});
let NavigationWrapper = props => (
  <Post {...props} navigation={useNavigation()} />
);

const mapDispatchToProps = dispatch =>
  bindActionCreators({ updatePosts }, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(NavigationWrapper);
