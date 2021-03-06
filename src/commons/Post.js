/**
 * PROPS: post, onDelete, appColor, isDark
 * post: post to be displayed
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

import { connect } from 'react-redux';

import AccessLevelAvatar from './AccessLevelAvatar';
import HTMLRenderer from './HTMLRenderer';

import { like, likeOn } from '../assets/svgs';

import { likePost, disLikePost, connection, reportPost } from '../services/forum.service';

let styles;
let multiQuotes = [];
let openedMenus = [];
const closeMenus = menu => {
  openedMenus.map(om => om.setState({ selected: false }));
  openedMenus = [];
  if (menu?.state?.selected) openedMenus.push(menu);
};
class Post extends React.Component {
  constructor(props) {
    super(props);
    const { post, isDark, appColor } = props;

    this.state = {
      isLiked: post?.is_liked_by_viewer,
      likeCount: post?.like_count,
      selected: false,
      menuTop: 0,
      reportModalVisible: false,
    };
    styles = setStyles(isDark, appColor);
  }

  toggleLike = () => {
    if (!connection(true)) return;
    let { id } = this.props.post;
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
    this.props.navigation.navigate(
      this.props.appColor === '#0b76db' ? 'coachOverview' : 'COACHOVERVIEW',
      { id }
    );
  };

  toggleMenu = () =>
    this.setState(
      ({ selected }) => ({ selected: !selected }),
      () => closeMenus(this)
    );

  report = () => this.setState({ reportModalVisible: true }, closeMenus);

  edit = () => {
    closeMenus();
    let { post, onDelete } = this.props;
    this.props.navigation.navigate('CRUD', {
      type: 'post',
      action: 'edit',
      postId: post.id,
      onDelete,
      quotes: [
        {
          content:
            post.content.split('</blockquote>').slice(0, -1).join('</blockquote>') +
            '</blockquote>',
        },
      ],
    });
  };

  multiQuote = () => {
    if (openedMenus.length) closeMenus();
    this.setState(({ selected }) => {
      if (selected)
        multiQuotes.splice(
          multiQuotes.findIndex(mq => mq.props.post.id === this.props.post.id),
          1
        );
      else multiQuotes.push(this);
      return { selected: !selected };
    }, this.props.onMultiQuote);
  };

  reply = () => {
    closeMenus();
    let { post, onPostCreated } = this.props;
    this.props.navigation.navigate('CRUD', {
      type: 'post',
      action: 'create',
      threadId: post.thread_id,
      onPostCreated,
      quotes: [
        {
          ...post,
          content: `<blockquote><b>${post.author.display_name}</b>:<br>${post.content}</blockquote>`,
        },
      ],
    });
  };

  render() {
    let { isLiked, likeCount, selected, menuTop, reportModalVisible } = this.state;
    let { post, appColor, index, isDark, signShown, locked, user } = this.props;
    let selectedColor = isDark ? '#002039' : '#E1E6EB';
    let baseColor = isDark ? '#081825' : '#E1E6EB4D';
    if (post && post.content.includes(`<p><img src="https://cdn.tiny.cloud`)) {
      post.content = post.content.replace(`<p><img`, `<p style="flex-direction:row;"><img `);
    }
    return (
      <>
        {post && (
          <View
            disabled={!!locked}
            activeOpacity={1}
            style={{
              marginBottom: 40,
              backgroundColor: selected ? selectedColor : baseColor,
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => false}
            onStartShouldSetResponderCapture={() => false}
            onMoveShouldSetResponderCapture={() => false}
            onResponderRelease={multiQuotes.length ? this.multiQuote : this.toggleMenu}
          >
            <View style={styles.header}>
              <Text style={styles.headerText}>#{index}</Text>
              <Text style={styles.headerText}>{post.published_on_formatted}</Text>
            </View>
            <View style={styles.header}>
              <View style={styles.userDetails}>
                <AccessLevelAvatar
                  author={post.author}
                  height={45}
                  appColor={appColor}
                  isDark={isDark}
                  tagHeight={4}
                  showUserInfo={true}
                  onNavigateToCoach={this.onNavigateToCoach}
                />
                <View style={{ marginLeft: 5 }}>
                  <Text style={styles.name} numberOfLines={2} ellipsizeMode='tail'>
                    {post.author.display_name}
                  </Text>
                  <Text style={styles.xp}>
                    {post.author.total_posts} Posts - {post.author.xp_rank} - Level{' '}
                    {post.author.level_rank}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 15 }}>
              <HTMLRenderer
                appColor={appColor}
                html={post.content}
                tagsStyles={{
                  div: {
                    color: isDark ? 'white' : '#00101D',
                    fontFamily: 'OpenSans',
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
                  shadow: {
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
                disabled={user.id === post.author_id}
                onPress={this.toggleLike}
                disallowInterruption={true}
                style={{
                  padding: 15,
                  paddingRight: 7.5,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {(isLiked ? likeOn : like)({
                  height: 15,
                  width: 15,
                  fill: appColor,
                })}
                {likeCount > 0 && <Text style={styles.likesNoText}>{likeCount}</Text>}
              </TouchableOpacity>
              {!locked && (
                <TouchableOpacity
                  onPress={this.reply}
                  disallowInterruption={true}
                  style={{ padding: 15, paddingLeft: 7.5 }}
                >
                  <Text style={styles.replyText}>REPLY</Text>
                </TouchableOpacity>
              )}
            </View>
            {signShown && !!post.author.signature && (
              <View style={styles.signatureContainer}>
                <HTMLRenderer html={post.author.signature} tagsStyles={{ div: styles.signature }} />
              </View>
            )}
          </View>
        )}
        {selected && !multiQuotes.length && (
          <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
              alignItems: 'center',
              top: menuTop,
              opacity: menuTop ? 1 : 0,
            }}
            onLayout={({
              nativeEvent: {
                layout: { height },
              },
            }) => !menuTop && this.setState({ menuTop: -height })}
          >
            <View style={styles.selectedMenuContainer}>
              {[
                'report',
                this.props.user.permission_level === 'administrator' ||
                this.props.user.id === this.props.post.author_id
                  ? 'edit'
                  : '',
                'multiQuote',
              ].map((action, i) =>
                action ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    key={i}
                    onPress={this[action]}
                    style={{
                      padding: 10,
                      paddingHorizontal: 15,
                      backgroundColor: appColor,
                      borderLeftWidth: i ? 0.5 : 0,
                    }}
                  >
                    <Text style={styles.selectedMenuActionText}>{action}</Text>
                  </TouchableOpacity>
                ) : null
              )}
            </View>
            <View style={styles.triangle} />
          </View>
        )}
        <Modal
          animationType={'slide'}
          onRequestClose={() => this.setState({ reportModalVisible: false })}
          supportedOrientations={['portrait', 'landscape']}
          transparent={true}
          visible={reportModalVisible /*|| post.id === 282358*/}
        >
          <Pressable
            style={styles.reportModalBackground}
            onPress={() => this.setState({ reportModalVisible: false })}
          >
            <View style={styles.reportModalContainer}>
              <Text style={styles.reportTitle}>Report Post</Text>
              <Text style={styles.reportMessage}>Are you sure you want to report this post?</Text>
              <View style={styles.reportBtnsContainer}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() =>
                    this.setState({ reportModalVisible: false }, () => reportPost(post.id))
                  }
                >
                  <Text style={styles.reportBtnText}>Report</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
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
      fontSize: 12,
      fontFamily: 'OpenSans',
      color: isDark ? '#445F74' : '#00101D',
    },
    headerText: {
      fontSize: 12,
      fontFamily: 'OpenSans-Italic',
      color: isDark ? '#445F74' : '#00101D',
    },
    name: {
      fontSize: 14,
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
      fontSize: 11,
      fontFamily: 'OpenSans',
      color: appColor,
      paddingLeft: 5,
    },
    replyText: {
      color: isDark ? '#445F74' : '#00101D',
      fontSize: 10,
      fontFamily: 'RobotoCondensed-Bold',
    },
    signatureContainer: {
      borderTopColor: isDark ? '#445F74' : 'lightgrey',
      borderTopWidth: 1,
      padding: 15,
      paddingVertical: 5,
    },
    signature: {
      color: isDark ? '#445F74' : '#00101D',
      fontFamily: 'OpenSans',
      fontSize: 10,
    },
    selectedMenuContainer: {
      flexDirection: 'row',
      borderRadius: 5,
      overflow: 'hidden',
    },
    selectedMenuActionText: {
      textTransform: 'capitalize',
      color: 'white',
      fontFamily: 'OpenSans-Bold',
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
  });
const mapStateToProps = ({ threads: { signShown, posts } }, { id }) => ({
  signShown,
  post: posts[id],
});
let NavigationWrapper = props => <Post {...props} navigation={useNavigation()} />;
NavigationWrapper.multiQuotes = multiQuotes;
NavigationWrapper.clearQuoting = () => {
  closeMenus();
  multiQuotes.map(mq => mq.setState({ selected: false }));
  multiQuotes.splice(0, multiQuotes.length);
};
export default connect(mapStateToProps)(NavigationWrapper);
