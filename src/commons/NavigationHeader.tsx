import React, {
  FunctionComponent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, TouchableOpacity, Text, View, StyleProp } from 'react-native';
import { batch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  menuCircle,
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
import { IS_TABLET } from '../services/helpers';
import HeaderOptionsModal from './modals/HeaderOptionsModal';

interface INavigationHeader {
  title: string;
  isForumRules?: boolean;
  prevScreen?: string;
}

const NavigationHeader: FunctionComponent<INavigationHeader> = props => {
  const { title, isForumRules, prevScreen = '' } = props;
  const route: RouteProp<{ params: IForumParams }> = useRoute();
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

  const isHome = useMemo(() => name?.match(/^(Forums)$/), [name]);

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

  const MenuButton = useMemo(
    () => (
      <TouchableOpacity onPress={() => setOptionsVisible(true)}>
        {menuCircle({ width: 39, height: 39, fill: isDark ? 'white' : '#081825' })}
      </TouchableOpacity>
    ),
    []
  );

  // TODO: This is a temporary fix for the back button text
  const prevScreenLabel = useMemo(() => prevScreen.toUpperCase(), []);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.subContainer}>
        {!isHome ? (
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            {arrowLeft({
              width: 20,
              height: 16,
              fill: isDark ? 'white' : 'black',
            })}
            <Text style={styles.backText}>{prevScreenLabel}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIconsContainer}>
              {!!thread?.locked && (
                <View style={styles.iconContainer}>
                  {lock({ height: 10, width: 10, fill: isDark ? 'white' : 'black' })}
                </View>
              )}
              {!!thread?.pinned && (
                <View style={styles.iconContainer}>
                  {pin({ height: 10, width: 10, fill: isDark ? 'white' : 'black' })}
                </View>
              )}
            </View>
            <Text
              style={isHome ? styles.forumTitle : styles.titleText}
              numberOfLines={2}
              ellipsizeMode='tail'
            >
              {(!!title ? title : thread?.title)?.replace(/-/g, ' ')}
            </Text>
          </View>
          {name?.match(/^(Forums|Threads|Thread)$/) && !isForumRules && MenuButton}
        </View>
      </View>
      <View style={styles.divider} />
      <HeaderOptionsModal
        optionsVisible={optionsVisible}
        setOptionsVisible={setOptionsVisible}
        followStateVisible={followStateVisible}
        isFollowed={thread?.is_followed || false}
        menuOptions={menuOptions}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 15,
    },
    subContainer: {
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    titleContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    titleIconsContainer: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
      marginTop: 10,
    },
    iconContainer: {
      marginRight: 5,
    },
    forumTitle: {
      fontFamily: 'OpenSans-Bold',
      fontSize: IS_TABLET ? 32 : 28,
      color: isDark ? '#FFFFFF' : '#00101D',
    },
    titleText: {
      fontFamily: 'OpenSans-ExtraBold',
      fontSize: 20,
      color: isDark ? 'white' : 'black',
      textAlign: 'left',
      textTransform: 'capitalize',
      marginBottom: 2,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backText: {
      color: isDark ? 'white' : 'black',
      fontSize: 12,
      paddingLeft: 4,
    },
    divider: {
      backgroundColor: '#223F57',
      height: 1,
      marginTop: 5,
    },
  });

export default NavigationHeader;
