import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Modal } from 'react-native';

import { connect, batch } from 'react-redux';
import { bindActionCreators } from 'redux';

import AsyncStorage from '@react-native-community/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import { updateThreads, toggleSignShown } from '../redux/ThreadActions';

import {
  connection,
  followThread,
  unfollowThread,
  updateThread
} from '../services/forum.service';

import {
  arrowLeft,
  lock,
  moderate,
  pin,
  check,
  unfollow
} from '../assets/svgs';

let styles;
class NavigationHeader extends React.Component {
  state = { optionsVisible: false, followStateVisible: false };
  constructor(props) {
    super(props);
    let { isDark } = this.props;
    styles = setStyles(isDark);
  }

  componentDidMount() {
    AsyncStorage.getItem('signShown').then(
      ss => !!ss !== this.props.signShown && this.props.toggleSignShown()
    );
  }

  get options() {
    let options = {};
    if (this.props.route.name.match(/^(Thread)$/)) {
      let {
        signShown,
        thread: { locked, pinned, is_followed }
      } = this.props;
      options.toggleSign = {
        text: `${signShown ? 'Hide' : 'Show'} All Signatures`,
        action: this.toggleSign
      };
      if (this.props.route.params.user.permission_level === 'administrator') {
        options.toggleLock = {
          text: locked ? 'Unlock' : 'Lock',
          action: this.toggleLock
        };
        options.togglePin = {
          text: pinned ? 'Unpin' : 'Pin',
          action: this.togglePin
        };
      }
      if (
        this.props.route.params.user.permission_level === 'administrator' ||
        this.props.route.params.user.id === this.props.thread.author_id
      )
        options.edit = { text: 'Edit', action: this.onEdit };
      options.toggleFollow = {
        text: `${is_followed ? 'Unfollow' : 'Follow'} Thread`,
        action: this.toggleFollow
      };
    }
    options.forumRules = {
      text: 'Forum Rules',
      action: () =>
        this.setState({ optionsVisible: false }, () =>
          this.navigate('Thread', {
            threadId: 1,
            title: 'Forum Rules',
            isForumRules: true
          })
        )
    };
    return options;
  }

  navigate = (route, params) =>
    connection(true) && this.props.navigation.navigate(route, params);

  toggleSign = () =>
    batch(() => {
      this.props.toggleSignShown();
      this.setState({ optionsVisible: false });
    });

  toggleLock = () => {
    if (!connection(true)) return;
    let { thread } = this.props;
    updateThread(thread.id, { locked: !thread.locked });
    batch(() => {
      this.props.updateThreads({ ...thread, locked: !thread.locked });
      this.setState({ optionsVisible: false });
    });
  };

  togglePin = () => {
    if (!connection(true)) return;
    let { thread } = this.props;
    updateThread(thread.id, { pinned: !thread.pinned });
    batch(() => {
      this.props.updateThreads({ ...thread, pinned: !thread.pinned });
      this.setState({ optionsVisible: false });
    });
  };

  toggleFollow = () => {
    if (!connection(true)) return;
    let { thread } = this.props;
    (thread.is_followed ? unfollowThread : followThread)(thread.id);
    batch(() => {
      this.props.updateThreads({ ...thread, is_followed: !thread.is_followed });
      this.setState({ optionsVisible: false }, () =>
        this.setState({ followStateVisible: true }, () =>
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
          threadId: this.props.threadId
        })
    );

  render() {
    let {
      navigation,
      title,
      route: {
        name,
        params: { isForumRules }
      },
      isDark,
      thread: { locked, pinned, is_followed } = {}
    } = this.props;
    let { optionsVisible, followStateVisible } = this.state;
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
            <Text style={styles.titleText}>{title}</Text>
          </View>
          <TouchableOpacity
            style={{ paddingHorizontal: 15 }}
            onPress={navigation.goBack}
          >
            {arrowLeft({
              height: 20,
              fill: isDark ? 'white' : 'black'
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
                <TouchableOpacity
                  activeOpacity={1}
                  style={styles.optionsContainer}
                  onPress={() => this.setState({ optionsVisible: false })}
                >
                  {followStateVisible ? (
                    <View
                      style={{
                        ...styles.followStateContainer,
                        borderTopColor: is_followed ? '#34D399' : '#FFAE00'
                      }}
                    >
                      {(is_followed ? check : unfollow)({
                        height: 25,
                        width: 25,
                        fill: is_followed ? '#34D399' : '#FFAE00'
                      })}
                      <Text style={styles.followStateTitle}>
                        {is_followed ? 'Follow' : 'Unfollow'} Thread{'\n'}
                        <Text
                          style={{ color: 'white', fontFamily: 'OpenSans' }}
                        >
                          You've{' '}
                          {is_followed ? 'started following' : 'unfollowed'}{' '}
                          this thread.
                        </Text>
                      </Text>
                    </View>
                  ) : (
                    <SafeAreaView style={styles.options}>
                      <View style={styles.pill} />
                      {Object.values(this.options).map(({ text, action }) => (
                        <TouchableOpacity key={text} onPress={action}>
                          <Text style={styles.optionText}>{text}</Text>
                        </TouchableOpacity>
                      ))}
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
      backgroundColor: isDark ? '#00101d' : 'white',
      paddingVertical: 10
    },
    subContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      left: 50,
      right: 50
    },
    titleText: {
      fontFamily: 'OpenSans-ExtraBold',
      fontSize: 20,
      color: isDark ? 'white' : 'black',
      textAlign: 'center',
      textTransform: 'capitalize'
    },
    optionsContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,.5)'
    },
    options: {
      backgroundColor: '#081825',
      padding: 20,
      borderTopEndRadius: 20,
      borderTopStartRadius: 20
    },
    pill: {
      width: '20%',
      height: 2,
      backgroundColor: 'white',
      borderRadius: 1,
      alignSelf: 'center'
    },
    optionText: {
      paddingVertical: 10,
      color: 'white',
      fontFamily: 'OpenSans'
    },
    followStateContainer: {
      backgroundColor: '#081825',
      margin: 5,
      padding: 15,
      borderTopWidth: 6,
      borderRadius: 8,
      flexDirection: 'row'
    },
    followStateTitle: {
      paddingLeft: 15,
      color: 'white',
      fontFamily: 'OpenSans-Bold'
    }
  });
};
const mapStateToProps = (
  { threads, themeState },
  {
    title,
    route: {
      name,
      params: { threadId, isDark }
    }
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
    title: thread?.title || title
  };
};
const mapDispatchToProps = dispatch =>
  bindActionCreators({ updateThreads, toggleSignShown }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(NavigationHeader);
