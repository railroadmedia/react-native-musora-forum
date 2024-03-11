import React, {
  FunctionComponent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  StyleProp,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
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
import { BlurView } from '@react-native-community/blur';

interface INavigationHeader {
  title: string;
  isForumRules?: boolean;
  prevScreen?: string;
  scrollOffset?: Animated.Value;

  onLayout?: (e: LayoutChangeEvent) => void;
}

const RANGE_START = 0;
const RANGE_END = 100;

const NavigationHeader: FunctionComponent<INavigationHeader> = props => {
  const { title, isForumRules, prevScreen = '', scrollOffset, onLayout } = props;
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

  const menuModal = useMemo(
    () => (
      <HeaderOptionsModal
        optionsVisible={optionsVisible}
        setOptionsVisible={setOptionsVisible}
        followStateVisible={followStateVisible}
        isFollowed={thread?.is_followed || false}
        menuOptions={menuOptions}
        isDark={isDark}
      />
    ),
    [
      optionsVisible,
      setOptionsVisible,
      followStateVisible,
      thread?.is_followed,
      menuOptions,
      isDark,
    ]
  );

  const headerOpacity = scrollOffset?.interpolate({
    inputRange: [RANGE_START, RANGE_END],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const negHeaderOpacity = scrollOffset?.interpolate({
    inputRange: [RANGE_START, RANGE_END],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const backArrow = (
    <TouchableOpacity style={styles.backButton} onPress={goBack}>
      {arrowLeft({
        width: 20,
        height: 16,
        fill: isDark ? 'white' : 'black',
      })}
      <Animated.Text style={[styles.backText, { opacity: headerOpacity }]}>
        {prevScreen.toUpperCase()}
      </Animated.Text>
    </TouchableOpacity>
  );

  const bigHeader = (
    <Animated.View style={{ opacity: headerOpacity }} onLayout={onLayout}>
      <SafeAreaView
        style={[styles.subContainer, styles.bigHeaderSafeArea]}
        edges={isHome ? ['right', 'left'] : ['top', 'right', 'left']}
      >
        {!isHome ? backArrow : null}

        <Animated.View style={[styles.titleRow, { opacity: headerOpacity }]}>
          <Animated.View style={[styles.titleContainer]}>
            <Animated.View style={[styles.titleIconsContainer]}>
              {!!thread?.locked &&
                lock({ height: 10, width: 10, fill: isDark ? 'white' : 'black' })}
              {!!thread?.pinned && pin({ height: 10, width: 10, fill: isDark ? 'white' : 'black' })}
            </Animated.View>
            <Text
              style={isHome ? styles.forumTitle : styles.titleText}
              numberOfLines={1}
              ellipsizeMode='tail'
            >
              {(!!title ? title : thread?.title)?.replace(/-/g, ' ')}
            </Text>
          </Animated.View>
          {name?.match(/^(Forums|Threads|Thread)$/) && !isForumRules && MenuButton}
        </Animated.View>

        <View style={styles.divider} />
      </SafeAreaView>
    </Animated.View>
  );

  const smallHeader = (
    <Animated.View
      style={[
        styles.absoluteContainer,
        { opacity: negHeaderOpacity, width: '100%', paddingHorizontal: 10 },
      ]}
    >
      <Animated.View style={[styles.absoluteContainer, styles.translucentBackground]}>
        <BlurView
          style={styles.blurView}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={10}
          reducedTransparencyFallbackColor={isDark ? '#00101d' : 'white'}
        />
        <SafeAreaView style={styles.subContainer} edges={['top', 'right', 'left']}>
          <Text />
        </SafeAreaView>
      </Animated.View>

      <View
        style={[
          styles.absoluteContainer,
          {
            paddingVertical: 15,
            opacity: 1,
          },
        ]}
      >
        <SafeAreaView style={styles.subContainer} edges={['top', 'right', 'left']}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              {arrowLeft({
                width: 20,
                height: 16,
                fill: isDark ? 'white' : 'black',
              })}
            </TouchableOpacity>
            <View style={styles.smallTitleContainer}>
              <Text style={styles.smallTitle}>{title}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.absoluteContainer}>
      {!isHome ? smallHeader : null}
      {bigHeader}

      {menuModal}
    </View>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    subContainer: {
      alignItems: 'flex-start',
      paddingHorizontal: 10,
    },
    bigHeaderSafeArea: {
      backgroundColor: isDark ? '#00101D' : '#f0f1f2',
      paddingTop: 15,
      paddingBottom: 0,
    },
    absoluteContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    blurView: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    translucentBackground: {
      paddingVertical: 15,
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
      justifyContent: 'center',
    },
    forumTitle: {
      fontFamily: 'OpenSans-Bold',
      fontSize: IS_TABLET ? 32 : 28,
      color: isDark ? '#FFFFFF' : '#00101D',
    },
    titleText: {
      fontFamily: 'OpenSans-ExtraBold',
      fontSize: 20,
      color: isDark ? 'white' : '#00101D',
      textAlign: 'left',
      textTransform: 'capitalize',
      marginBottom: 2,
      marginHorizontal: 5,
    },
    smallTitleContainer: {
      position: 'absolute',
      width: '100%',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    smallTitle: {
      color: isDark ? 'white' : '#00101D',
      fontFamily: 'OpenSans-SemiBold',
      fontSize: IS_TABLET ? 18 : 14,
      lineHeight: IS_TABLET ? 20 : 16,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backText: {
      color: isDark ? 'white' : '#00101D',
      fontSize: 12,
      paddingLeft: 4,
    },
    divider: {
      backgroundColor: isDark ? '#223F57' : '#B2B2B5',
      height: 1,
      marginTop: 5,
      width: '100%',
    },
  });

export default NavigationHeader;
