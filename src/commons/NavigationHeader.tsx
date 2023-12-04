import React, {
  FunctionComponent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Modal, StyleProp } from 'react-native';
import { batch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
  hideSignSvg,
  showSignSvg,
  unlock,
  lockOutline,
  unpin,
  pinOutline,
  pencil,
  unfollowThreadSvg,
  followThreadSvg,
  forumRulesSvg,
  lock,
  pin,
  arrowLeft,
  moderate,
  check,
  unfollow,
} from '../assets/svgs';
import { updateThreads, toggleSignShown } from '../redux/threads/ThreadActions';
import {
  getThread,
  updateThread,
  unfollowThread,
  followThread,
  connection,
} from '../services/forum.service';
import { useDispatch } from 'react-redux';
import type { IThread } from '../entity/IForum';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector } from '../redux/Store';
import { selectThread } from '../redux/threads/ThreadSelectors';
import type { ForumRootStackParamList, IForumParams } from '../entity/IRouteParams';
import type { ISvg } from '../entity/ISvg';

interface INavigationHeader {
  title: string;
  isForumRules?: boolean;
}

const NavigationHeader: FunctionComponent<INavigationHeader> = props => {
  const { title, isForumRules } = props;
  const route: RouteProp<{ params: IForumParams }, 'params'> = useRoute();
  const {
    name,
    params: { isDark, postId, user, threadId },
  } = route;
  const styles = setStyles(isDark);
  const { navigate, goBack, push } = useNavigation<StackNavigationProp<ForumRootStackParamList>>();
  const dispatch = useDispatch();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [followStateVisible, setFollowStateVisible] = useState(false);
  const [thread, setThread] = useState<IThread>();

  const signShown = useAppSelector(({ threadsState }) =>
    name.match(/^(Thread)$/) ? threadsState.signShown : undefined
  );
  const threadFromState = useAppSelector(state => selectThread(state, threadId, name));

  useEffect(() => {
    const threadPropIsEmpty = threadFromState && Object.keys(threadFromState).length === 0;
    if (threadId && threadPropIsEmpty && !isForumRules && !postId) {
      const { request, controller } = getThread(threadId, 1, isForumRules, postId);
      request.then((t: { data: IThread }) => {
        setThread(t.data);
      });
      return () => controller.abort();
    } else {
      setThread(threadFromState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('signShown').then(ss => {
      if (!!ss !== signShown) {
        dispatch(toggleSignShown());
      }
    });
  }, [signShown, dispatch]);

  const toggleSign = useCallback(() => {
    batch(() => {
      dispatch(toggleSignShown());
      setOptionsVisible(false);
    });
  }, [dispatch]);

  const toggleLock = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (thread) {
      updateThread(thread?.id, { locked: !thread?.locked });
      batch(() => {
        dispatch(updateThreads({ ...thread, locked: !thread?.locked }));
        setOptionsVisible(false);
      });
    }
  }, [dispatch, thread]);

  const togglePin = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (thread) {
      updateThread(thread?.id, { pinned: !thread?.pinned });
      batch(() => {
        dispatch(updateThreads({ ...thread, pinned: !thread?.pinned }));
        setOptionsVisible(false);
      });
    }
  }, [dispatch, thread]);

  const toggleFollow = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (thread) {
      const followAction = thread?.is_followed ? unfollowThread : followThread;
      followAction(thread?.id);
      batch(() => {
        dispatch(updateThreads({ ...thread, is_followed: !thread?.is_followed }));
        setOptionsVisible(false);
        setFollowStateVisible(true);
        setThread({ ...thread, is_followed: !thread?.is_followed });
        setTimeout(() => setFollowStateVisible(false), 3000);
      });
    }
  }, [dispatch, thread]);

  const onEdit = useCallback(() => {
    if (connection(true)) {
      setOptionsVisible(false);
      navigate('CRUD', {
        type: 'thread',
        action: 'edit',
        threadId: threadId,
      });
    }
  }, [navigate, threadId]);

  const menuOptions = useMemo(() => {
    const options: {
      [key: string]: { text: string; icon: (param: ISvg) => ReactElement; action: () => void };
    } = {};
    if (name.match(/^(Thread)$/)) {
      options.toggleSign = {
        text: `${signShown ? 'Hide' : 'Show'} All Signatures`,
        icon: signShown ? hideSignSvg : showSignSvg,
        action: toggleSign,
      };
      if (user?.permission_level === 'administrator') {
        options.toggleLock = {
          text: thread?.locked ? 'Unlock' : 'Lock',
          icon: thread?.locked ? unlock : lockOutline,
          action: toggleLock,
        };
        options.togglePin = {
          text: thread?.pinned ? 'Unpin' : 'Pin',
          icon: thread?.pinned ? unpin : pinOutline,
          action: togglePin,
        };
      }
      if (user?.permission_level === 'administrator' || user?.id === thread?.author_id) {
        options.edit = { text: 'Edit', icon: pencil, action: onEdit };
      }
      options.toggleFollow = {
        text: `${thread?.is_followed ? 'Unfollow' : 'Follow'} Thread`,
        icon: thread?.is_followed ? unfollowThreadSvg : followThreadSvg,
        action: toggleFollow,
      };
    }
    options.forumRules = {
      text: 'Musora Community Guidelines',
      icon: forumRulesSvg,
      action: () => {
        setOptionsVisible(false);
        push('Thread', {
          title: 'Musora Community Guidelines',
          isForumRules: true,
        });
      },
    };

    return options;
  }, [
    onEdit,
    push,
    signShown,
    thread?.is_followed,
    thread?.locked,
    thread?.pinned,
    toggleFollow,
    toggleLock,
    togglePin,
    toggleSign,
    name,
    thread?.author_id,
    user?.id,
    user?.permission_level,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <View style={styles.subContainer}>
        <View style={styles.titleContainer}>
          {!!thread?.locked && (
            <View style={styles.iconContainer}>
              {lock({ width: 10, fill: isDark ? 'white' : 'black' })}
            </View>
          )}
          {!!thread?.pinned && (
            <View style={styles.iconContainer}>
              {pin({ width: 10, fill: isDark ? 'white' : 'black' })}
            </View>
          )}
          <Text style={styles.titleText} numberOfLines={2} ellipsizeMode='tail'>
            {(!!title ? title : thread?.title)?.replace(/-/g, ' ')}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={goBack}>
          {arrowLeft({
            height: 20,
            fill: isDark ? 'white' : 'black',
          })}
        </TouchableOpacity>
        {name?.match(/^(Forums|Threads|Thread)$/) && !isForumRules && (
          <>
            <TouchableOpacity style={styles.headerButton} onPress={() => setOptionsVisible(true)}>
              {moderate({ width: 20, fill: isDark ? 'white' : 'black' })}
            </TouchableOpacity>
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
                      borderTopColor: thread?.is_followed ? '#34D399' : '#FFAE00',
                    }}
                  >
                    {(thread?.is_followed ? check : unfollow)({
                      height: 25,
                      width: 25,
                      fill: thread?.is_followed ? '#34D399' : '#FFAE00',
                    })}
                    <Text style={styles.followStateTitle}>
                      {thread?.is_followed ? 'Follow' : 'Unfollow'} Thread{'\n'}
                      <Text
                        style={{
                          color: isDark ? 'white' : '#000000',
                          fontFamily: 'OpenSans',
                        }}
                      >
                        {`You've ${
                          thread?.is_followed ? 'started following' : 'unfollowed'
                        } this thread.`}
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
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#081825' : 'white',
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
    iconContainer: {
      marginRight: 5,
    },
    titleText: {
      fontFamily: 'OpenSans-ExtraBold',
      fontSize: 20,
      color: isDark ? 'white' : 'black',
      textAlign: 'center',
      textTransform: 'capitalize',
      marginBottom: 2,
    },
    headerButton: {
      padding: 15,
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

export default NavigationHeader;
