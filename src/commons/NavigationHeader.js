import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Modal } from 'react-native';

import { connect, batch } from 'react-redux';
import { bindActionCreators } from 'redux';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import { updateThreads, toggleSignShown } from '../redux/ThreadActions';

import { connection, followThread, unfollowThread, updateThread, getThread } from '../services/forum.service';

import { arrowLeft, lockOutline, unlock, lock, moderate, pin, check, unfollow, hideSignSvg, followThreadSvg, forumRulesSvg, pencil, showSignSvg, pinOutline, unpin, unfollowThreadSvg } from '../assets/svgs';

let styles;
class NavigationHeader extends React.Component {
  state = { optionsVisible: false, followStateVisible: false, thread: {} };
  constructor(props) {
    super(props);
    let { isDark } = this.props;
    styles = setStyles(isDark);
  }

  threadPropIsEmpty = this.props.thread && Object.keys(this.props.thread).length === 0;

  componentDidMount() {
    AsyncStorage.getItem('signShown').then(
      ss => !!ss !== this.props.signShown && this.props.toggleSignShown()
    );
    if (this.threadPropIsEmpty && !this.props.route.params?.isForumRules) {
      const { request, controller } = getThread(this.props.threadId);
      request.then(t => {
        this.setState({ thread: t.data });
      }).catch(err => { });
      return () => controller.abort();
    }
  }

  get options() {
    let options = {};
    if (this.props.route.name.match(/^(Thread)$/)) {
      let {
        signShown,
      } = this.props;
      let {
        thread
      } = this.threadPropIsEmpty ? this.state : this.props;
      options.toggleSign = {
        text: `${signShown ? 'Hide' : 'Show'} All Signatures`,
        icon: signShown ? hideSignSvg : showSignSvg,
        action: this.toggleSign,
      };
      if (this.props.user.permission_level === 'administrator') {
        options.toggleLock = {
          text: thread?.locked ? 'Unlock' : 'Lock',
          icon: thread?.locked ? unlock : lockOutline,
          action: this.toggleLock,
        };
        options.togglePin = {
          text: thread?.pinned ? 'Unpin' : 'Pin',
          icon: thread?.pinned ? unpin : pinOutline,
          action: this.togglePin,
        };
      }
      if (
        this.props.user.permission_level === 'administrator' ||
        this.props.user.id === thread?.author_id
      )
        options.edit = { text: 'Edit', icon: pencil, action: this.onEdit };
      options.toggleFollow = {
        text: `${thread?.is_followed ? 'Unfollow' : 'Follow'} Thread`,
        icon: thread?.is_followed ? unfollowThreadSvg : followThreadSvg,
        action: this.toggleFollow,
      };
    }
    options.forumRules = {
      text: 'Forum Rules',
      icon: forumRulesSvg,
      action: () =>
        this.setState({ optionsVisible: false }, () =>
          this.props.navigation.push('Thread', {
            title: 'Forum Rules',
            isForumRules: true,
          })
        ),
    };
    return options;
  }

  navigate = (route, params) => connection(true) && this.props.navigation.navigate(route, params);

  toggleSign = () =>
    batch(() => {
      this.props.toggleSignShown();
      this.setState({ optionsVisible: false });
    });

  toggleLock = () => {
    if (!connection(true)) return;
    let { thread } = this.threadPropIsEmpty ? this.state : this.props;
    updateThread(thread?.id, { locked: !thread?.locked });
    batch(() => {
      this.props.updateThreads({ ...thread, locked: !thread?.locked });
      this.setState({ optionsVisible: false });
    });
  };

  togglePin = () => {
    if (!connection(true)) return;
    let { thread } = this.threadPropIsEmpty ? this.state : this.props;
    updateThread(thread?.id, { pinned: !thread?.pinned });
    batch(() => {
      this.props.updateThreads({ ...thread, pinned: !thread?.pinned });
      this.setState({ optionsVisible: false });
    });
  };

  toggleFollow = () => {
    if (!connection(true)) return;
    let { thread } = this.threadPropIsEmpty ? this.state : this.props;
    (thread?.is_followed ? unfollowThread : followThread)(thread?.id);
    batch(() => {
      this.props.updateThreads({ ...thread, is_followed: !thread?.is_followed });
      this.setState({ optionsVisible: false }, () =>
        this.setState({ followStateVisible: true, thread: { ...thread, is_followed: !thread?.is_followed } }, () =>
          setTimeout(() => this.setState({ followStateVisible: false }), 3000)
        )
      );
    });
  };

  onEdit = () =>
    connection(true) &&
    this.setState(
      () => ({ optionsVisible: false }),
      () =>
        this.navigate('CRUD', {
          type: 'thread',
          action: 'edit',
          threadId: this.props.threadId,
        })
    );

  render() {
    let {
      navigation,
      title,
      route: {
        name,
        params: { isForumRules },
      },
      isDark,
    } = this.props;
    let { thread, thread: { locked, pinned, is_followed } = {} } = this.threadPropIsEmpty ? this.state : this.props;
    let { optionsVisible, followStateVisible } = this.state;
    return (
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
        <View style={styles.subContainer}>
          <View style={styles.titleContainer}>
            {!!locked && (
              <View style={{ marginRight: 5 }}>
                {lock({ width: 10, fill: isDark ? 'white' : 'black' })}
              </View>
            )}
            {!!pinned && (
              <View style={{ marginRight: 5 }}>
                {pin({ width: 10, fill: isDark ? 'white' : 'black' })}
              </View>
            )}
            <Text style={styles.titleText} numberOfLines={2} ellipsizeMode='tail'>
              {(title ? title : thread?.title)?.replace(/-/g, ' ')}
            </Text>
          </View>
          <TouchableOpacity style={{ paddingHorizontal: 15 }} onPress={navigation.goBack}>
            {arrowLeft({
              height: 20,
              fill: isDark ? 'white' : 'black',
            })}
          </TouchableOpacity>
          {name.match(/^(Forums|Threads|Thread)$/) && !isForumRules && (
            <>
              <TouchableOpacity
                style={{ padding: 15 }}
                onPress={() => this.setState({ optionsVisible: true })}
              >
                {moderate({ width: 20, fill: isDark ? 'white' : 'black' })}
              </TouchableOpacity>
              <Modal
                animationType={'slide'}
                onRequestClose={() => this.setState({ optionsVisible: false })}
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
                  onPress={() => this.setState({ optionsVisible: false })}
                >
                  {followStateVisible ? (
                    <View
                      style={{
                        ...styles.followStateContainer,
                        borderTopColor: is_followed ? '#34D399' : '#FFAE00',
                      }}
                    >
                      {(is_followed ? check : unfollow)({
                        height: 25,
                        width: 25,
                        fill: is_followed ? '#34D399' : '#FFAE00',
                      })}
                      <Text style={styles.followStateTitle}>
                        {is_followed ? 'Follow' : 'Unfollow'} Thread{'\n'}
                        <Text
                          style={{
                            color: isDark ? 'white' : '#000000',
                            fontFamily: 'OpenSans',
                          }}
                        >
                          You've {is_followed ? 'started following' : 'unfollowed'} this thread.
                        </Text>
                      </Text>
                    </View>
                  ) : (
                    <SafeAreaView style={styles.options}>
                      {Object.values(this.options).map(({ text, icon, action }) => (
                        <TouchableOpacity key={text} onPress={action} style={styles.optionBtn}>
                          {icon({ width: 20, fill: '#FFFFFF' })}
                          <Text style={styles.optionText}>{text}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity onPress={() => this.setState({ optionsVisible: false })}>
                        <Text style={styles.closeText}>Close</Text>
                      </TouchableOpacity>
                    </SafeAreaView>
                  )}
                </TouchableOpacity>
              </Modal>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }
}
let setStyles = isDark => {
  setStyles.isDark = isDark;
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#081825' : 'white',
      paddingVertical: 10,
    },
    subContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      left: 50,
      right: 50,
    },
    titleText: {
      fontFamily: 'OpenSans-ExtraBold',
      fontSize: 20,
      color: isDark ? 'white' : 'black',
      textAlign: 'center',
      textTransform: 'capitalize',
      padding: 2,
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
    followStateContainer: {
      backgroundColor: isDark ? '#081825' : '#F7F9FC',
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
    closeText: {
      fontSize: 18,
      color: '#FFFFFF',
      padding: 10,
      alignSelf: 'center',
      textAlign: 'center',
      fontFamily: 'OpenSans-Bold',
    },
  });
};
const mapStateToProps = (
  { threads, themeState, userState },
  {
    title,
    route: {
      name,
      params: { threadId, isDark, user },
    },
  }
) => {
  isDark = themeState ? themeState.theme === 'dark' : isDark;
  if (setStyles.isDark !== isDark) styles = setStyles(isDark);
  let thread;
  if (name.match(/^(Thread)$/))
    thread =
      threads?.forums?.[threadId] ||
      threads?.all?.[threadId] ||
      threads?.followed?.[threadId] ||
      threads?.search?.[threadId] ||
      {};
  return {
    thread,
    threadId,
    isDark,
    signShown: name.match(/^(Thread)$/) ? threads.signShown : undefined,
    title: thread?.title || title,
    user: userState?.user || user,
  };
};
const mapDispatchToProps = dispatch =>
  bindActionCreators({ updateThreads, toggleSignShown }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(NavigationHeader);
