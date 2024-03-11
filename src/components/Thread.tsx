import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  Modal,
  BackHandler,
  StyleProp,
  LayoutChangeEvent,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { batch, useDispatch } from 'react-redux';
import { post as PostSvg, lock, multiQuote, reportSvg, banSvg } from '../assets/svgs';
import NavigationHeader from '../commons/NavigationHeader';
import Pagination from '../commons/Pagination';
import Post from '../commons/Post';
import ToastAlert from '../commons/ToastAlert';
import BlockWarningModal from '../commons/modals/BlockWarningModal';
import MenuModal from '../commons/modals/MenuModal';
import type { IPost, IThread } from '../entity/IForum';
import { setForumRules, setPosts } from '../redux/threads/ThreadActions';
import {
  getThread,
  connection,
  reportPost,
  reportUser,
  blockUser,
} from '../services/forum.service';
import { useAppSelector } from '../redux/Store';
import type { ForumRootStackParamList, IForumParams, IThreadParams } from '../entity/IRouteParams';
import { IS_TABLET } from '../services/helpers';
import ReportModal from '../commons/modals/ReportModal';

const Thread: FunctionComponent = () => {
  const { params }: RouteProp<{ params: IThreadParams & IForumParams }, 'params'> = useRoute();
  const {
    isDark,
    appColor,
    user,
    threadId,
    threadTitle,
    bottomPadding,
    page: pageProp,
    postId: postIdProp,
    isForumRules,
  } = params;
  const styles = setStyles(isDark, appColor);
  const dispatch = useDispatch();
  const { navigate, goBack, addListener, canGoBack, pop } =
    useNavigation<StackNavigationProp<ForumRootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [postHeight, setPostHeight] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [multiQuotesArr, setMultiQuotesArr] = useState<IPost[]>([]);
  const [lockedModalVisible, setLockedModalVisible] = useState(false);
  const [postKey, setPostKey] = useState(false);
  const [showToastAlert, setShowToastAlert] = useState(false);
  const [showReportAlert, setShowReportAlert] = useState(false);
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [alertText, setAlertText] = useState('');
  const selectedPost = useRef<IPost | undefined>();
  const [page, setPage] = useState<number>(pageProp || 1);
  const [thread, setThread] = useState<IThread>({ id: threadId || 0, title: threadTitle || '' });

  const locked = useAppSelector(
    ({ threadsState }) =>
      thread?.id &&
      !!(
        threadsState?.forums?.[thread?.id] ||
        threadsState?.all?.[thread?.id] ||
        threadsState?.followed?.[thread?.id] ||
        threadsState?.search?.[thread?.id] ||
        threadsState?.forumRules ||
        {}
      ).locked
  );

  const postLayouts = useRef<{ [id: number]: number }>({});
  const flHeaderHeight = useRef<number>(0);
  const postId = useRef<number>();
  const reFocused = useRef<boolean>(false);

  const flatListRef = useRef<FlatList>(null);
  const blockRef = useRef<React.ElementRef<typeof MenuModal>>(null);
  const warningRef = useRef<React.ElementRef<typeof BlockWarningModal>>(null);
  const reportRef = useRef<React.ElementRef<typeof ReportModal>>(null);

  useEffect(() => {
    const refreshOnFocusListener = addListener('focus', () => {
      if (reFocused.current) {
        refresh();
      } else {
        reFocused.current = true;
      }
    });
    const blurListener = addListener('blur', () => setPostKey(k => !k));
    BackHandler.addEventListener('hardwareBackPress', onAndroidBack);

    postId.current = postIdProp;
    fetchData();

    return () => {
      refreshOnFocusListener?.();
      blurListener?.();
      BackHandler.removeEventListener('hardwareBackPress', onAndroidBack);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postIdProp]);

  const fetchData = useCallback(() => {
    if (thread?.id || isForumRules || postId.current) {
      const { request, controller } = getThread(
        thread?.id ? thread?.id : undefined,
        page,
        isForumRules,
        postId.current
      );
      request
        .then(res => {
          setPage(parseInt(res.data?.page || '', 10));
          setThread(res?.data);
          batch(() => {
            if (isForumRules) {
              dispatch(setForumRules(res?.data));
            }
            dispatch(setPosts(res?.data?.posts || []));
          });
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
      return () => {
        controller.abort();
      };
    } else {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch, isForumRules, page, thread?.id]);

  const changePage = useCallback(
    (pageValue: number) => {
      postId.current = undefined;
      if (!connection(true)) {
        return;
      }
      setPage(pageValue);
      setLoadingMore(true);
      const { request, controller } = getThread(
        thread?.id ? thread?.id : undefined,
        pageValue,
        isForumRules,
        postId.current
      );
      request
        .then(res => {
          setThread(res.data);
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
          batch(() => {
            if (isForumRules) {
              dispatch(setForumRules(res.data));
            }
            dispatch(setPosts(res.data?.posts || []));
          });
        })
        .finally(() => setLoadingMore(false));
      return () => controller.abort();
    },
    [dispatch, isForumRules, thread?.id]
  );

  const refresh = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (!thread?.id && !isForumRules && !postId.current) {
      return;
    }
    setRefreshing(true);
    setMultiQuotesArr([]);
    fetchData();
  }, [isForumRules, thread?.id, fetchData]);

  const onAndroidBack = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (canGoBack()) {
      goBack();
    }
    return true;
  }, [canGoBack, goBack]);

  const handleAutoScroll = useCallback(
    (id: number, height: number) => {
      postLayouts.current[id] = height;

      if (
        postId.current &&
        thread?.posts?.every(p => Object.keys(postLayouts.current).includes(`${p?.id}`))
      ) {
        let scrollPos = flHeaderHeight.current;
        thread?.posts
          ?.slice(0, thread?.posts?.findIndex(p => p.id === postId.current))
          .map(p => (scrollPos += postLayouts.current[p.id]));
        flatListRef.current?.scrollToOffset({
          offset: scrollPos,
          animated: false,
        });
      }
    },
    [thread?.posts]
  );

  const toggleLockedModal = useCallback((): void => {
    setLockedModalVisible(prevLockedModalVisible => !prevLockedModalVisible);
    setTimeout(() => setLockedModalVisible(false), 3000);
  }, []);

  const deletePost = useCallback(
    (pId: number) => {
      if (!connection(true)) {
        return;
      }
      const updateThread = { ...thread, posts: thread?.posts?.filter(p => p.id !== pId) };
      if (updateThread?.id && updateThread.posts) {
        setThread(updateThread);
      }
      if (!updateThread?.posts?.length && page > 1) {
        changePage(page - 1);
      }
      if (updateThread?.posts && updateThread?.posts?.length < 1) {
        pop(2);
      } else {
        goBack();
      }
    },
    [changePage, page, thread, pop, goBack]
  );

  const editPost = useCallback(() => {
    const blockQuote = selectedPost.current?.content
      ?.split('</blockquote>')
      .slice(0, -1)
      .join('</blockquote');
    navigate('CRUD', {
      type: 'post',
      action: 'edit',
      postId: selectedPost.current?.id,
      onDelete: deletePost,
      quotes: blockQuote
        ? [
            {
              content:
                selectedPost.current?.content
                  ?.split('</blockquote>')
                  .slice(0, -1)
                  .join('</blockquote>') + '</blockquote>',
            },
          ]
        : [],
    });
  }, [navigate, deletePost]);

  const multiquote = useCallback(() => {
    const isQuoted = multiQuotesArr.find(f => f.id === selectedPost.current?.id);
    if (isQuoted) {
      setMultiQuotesArr(prevMultiQuotesArr =>
        prevMultiQuotesArr.filter(item => item.id !== selectedPost.current?.id)
      );
    } else {
      setMultiQuotesArr(prevMultiQuotesArr => [
        ...prevMultiQuotesArr,
        selectedPost.current as IPost,
      ]);
    }
  }, [multiQuotesArr]);

  const reportForumPost = useCallback(
    (issue: string) => {
      const { request, controller } = reportPost(selectedPost.current?.id || 0, issue);
      request.then(() => {
        setShowToastAlert(true);
        setAlertText('The forum post was reported.');
        setTimeout(() => {
          setShowToastAlert(false);
          setAlertText('');
        }, 2000);
        refresh();
      });
      return () => {
        controller.abort();
      };
    },
    [refresh]
  );

  const showBlockModal = useCallback((selectedP: IPost, mode: 'post' | 'user'): void => {
    selectedPost.current = selectedP;
    blockRef.current?.toggle(mode, selectedP);
  }, []);

  const showBlockWarning = (): void => {
    warningRef.current?.toggle(selectedPost.current?.author?.display_name || '');
  };

  const showReportModal = useCallback((mode: 'post' | 'user'): void => {
    if (mode === 'post' && !!selectedPost.current?.is_reported_by_viewer) {
      setShowToastAlert(true);
      setAlertText('You have already reported this post.');
      setTimeout(() => {
        setShowToastAlert(false);
        setAlertText('');
      }, 2000);
      return;
    } else if (mode === 'user' && selectedPost.current?.author?.is_reported_by_viewer) {
      setShowReportAlert(true);
      setTimeout(() => {
        setShowReportAlert(false);
      }, 2000);
      return;
    }
    reportRef.current?.toggle(mode);
  }, []);

  const onReportUser = (issue: string): any => {
    if (!selectedPost.current) {
      return;
    }
    const { request, controller } = reportUser(selectedPost.current?.author?.id || 0, issue);
    request.then(res => {
      if (res.data?.success) {
        setShowReportAlert(true);
        setTimeout(() => {
          setShowReportAlert(false);
        }, 2000);
      }
    });
    return () => {
      controller.abort();
    };
  };

  const onBlockUser = useCallback(() => {
    const { request, controller } = blockUser(selectedPost.current?.author?.id || 0);
    request.then((res: { data: { success: boolean } }) => {
      if (res.data.success) {
        setShowBlockAlert(true);
        setTimeout(() => {
          setShowBlockAlert(false);
        }, 2000);
        refresh();
      }
    });
    return () => {
      controller.abort();
    };
  }, [refresh]);

  const onLayoutAddPost = ({ nativeEvent: { layout } }: LayoutChangeEvent): void => {
    if (!postHeight) {
      setPostHeight(layout.height + 15);
    }
  };

  const onPressPost = useCallback(() => {
    postId.current = undefined;
    if (locked) {
      toggleLockedModal();
    } else {
      navigate('CRUD', {
        type: 'post',
        action: 'create',
        onPostCreated: pId => {
          postId.current = pId;
        },
        threadId: thread?.id,
        quotes: multiQuotesArr.map(post => ({
          ...post,
          content: `<blockquote><b>${post?.author?.display_name}</b>:<br>${post?.content}</blockquote>`,
        })),
      });
    }
  }, [locked, navigate, multiQuotesArr, thread?.id, toggleLockedModal]);

  const renderFLItem = useCallback(
    ({ item, index }: { item: number; index: number }) => (
      <View
        key={postKey.toString()}
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }) => handleAutoScroll(item, height)}
      >
        <Post
          locked={!!locked}
          user={user}
          id={item}
          index={index + 1 + 10 * (page - 1)}
          appColor={appColor}
          isDark={isDark}
          onPostCreated={(i: number | undefined) => (postId.current = i)}
          toggleMenu={showBlockModal}
          selected={!!multiQuotesArr?.find(f => f.id === item)}
        />
      </View>
    ),
    [
      appColor,
      handleAutoScroll,
      isDark,
      locked,
      multiQuotesArr,
      page,
      postKey,
      showBlockModal,
      user,
    ]
  );

  const renderPagination = useCallback(
    (marginBottom: number, borderTopWidth: number, borderBottomWidth: number) => (
      <View
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }) => (flHeaderHeight.current = height)}
        style={{
          borderTopWidth,
          borderBottomWidth,
          borderColor: isDark ? '#9EC0DC' : 'lightgrey',
          marginHorizontal: 15,
          marginBottom,
        }}
      >
        <Pagination
          key={`${page}${thread?.post_count}`}
          active={page}
          isDark={isDark}
          appColor={appColor}
          length={thread?.post_count || 0}
          onChangePage={changePage}
        />
        {loadingMore && (
          <ActivityIndicator
            size='small'
            color={appColor}
            animating={true}
            style={{ padding: 15 }}
          />
        )}
      </View>
    ),
    [appColor, changePage, isDark, loadingMore, page, thread?.post_count]
  );

  const flEmpty = <Text style={styles.emptyList}>{'No posts.'}</Text>;

  const flRefreshControl = (
    <RefreshControl
      colors={['white']}
      tintColor={appColor}
      progressBackgroundColor={appColor}
      onRefresh={refresh}
      refreshing={refreshing}
    />
  );

  const onScollBegin = (): void => (postId.current = undefined);

  return loading ? (
    <ActivityIndicator size='large' color={appColor} animating={true} style={styles.loading} />
  ) : (
    <SafeAreaView
      style={[styles.fList, { paddingBottom: bottomPadding / 2 + 10 }]}
      edges={['right', 'left', 'bottom']}
    >
      <NavigationHeader title={threadTitle || thread?.title || ''} />
      <FlatList
        overScrollMode='never'
        onScrollBeginDrag={onScollBegin}
        windowSize={10}
        data={thread?.posts?.map(p => p.id)}
        style={styles.fList}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        onEndReachedThreshold={0.01}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps='handled'
        renderItem={renderFLItem}
        ListHeaderComponent={renderPagination(20, 0, 1)}
        keyExtractor={id => id.toString()}
        ref={flatListRef}
        ListEmptyComponent={flEmpty}
        ListFooterComponent={renderPagination(postHeight, 1, 0)}
        refreshControl={flRefreshControl}
      />
      <View>
        <TouchableOpacity
          onLayout={onLayoutAddPost}
          onPress={onPressPost}
          style={styles.bottomTOpacity}
        >
          {(locked ? lock : multiQuotesArr?.length > 0 ? multiQuote : PostSvg)({
            height: 25,
            width: 25,
            fill: 'white',
          })}
          {multiQuotesArr?.length > 0 && (
            <View style={styles.multiQuoteBadge}>
              <Text style={styles.multiQuote}>+{multiQuotesArr?.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <Modal
        animationType={'fade'}
        onRequestClose={toggleLockedModal}
        supportedOrientations={['portrait', 'landscape']}
        transparent={true}
        visible={lockedModalVisible}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleLockedModal}
          style={styles.lockedModalBackground}
        >
          <View style={styles.lockedModalMsgContainer}>
            {lock({ height: 15, width: 15, fill: '#FFAE00' })}
            <Text style={styles.lockedTitle}>
              Locked{'\n'}
              <Text style={styles.lockedText}>This thread is locked.</Text>
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <MenuModal
        ref={blockRef}
        onReport={showReportModal}
        onBlock={showBlockWarning}
        onEdit={editPost}
        onMultiquote={multiquote}
        user={user}
        multiQuoteArr={multiQuotesArr}
      />
      <ReportModal
        ref={reportRef}
        onReportUser={onReportUser}
        onReportPost={reportForumPost}
        isDark={isDark}
      />
      <BlockWarningModal ref={warningRef} onBlock={onBlockUser} />
      {showToastAlert && (
        <ToastAlert
          content={alertText}
          icon={reportSvg({
            height: 21.6,
            width: 21.6,
            fill: isDark ? 'black' : 'white',
          })}
          isDark={isDark}
        />
      )}
      {showReportAlert && (
        <ToastAlert
          content={
            selectedPost.current?.author?.is_reported_by_viewer
              ? 'You have already reported this profile.'
              : `${selectedPost.current?.author?.display_name || 'User'} was reported.`
          }
          icon={reportSvg({
            height: 21.6,
            width: 21.6,
            fill: isDark ? 'black' : 'white',
          })}
          isDark={isDark}
        />
      )}
      {showBlockAlert && (
        <ToastAlert
          content={`${selectedPost.current?.author?.display_name || 'User'} was blocked.`}
          icon={banSvg({
            height: 21.6,
            width: 21.6,
            fill: isDark ? 'black' : 'white',
          })}
          isDark={isDark}
        />
      )}
    </SafeAreaView>
  );
};
const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    fList: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : '#f0f1f2',
    },
    loading: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : '#f0f1f2',
      alignItems: 'center',
    },
    emptyList: {
      color: isDark ? '#445F74' : 'black',
      fontFamily: 'OpenSans',
      padding: 15,
    },
    bottomTOpacity: {
      position: 'absolute',
      bottom: IS_TABLET ? 50 : 30,
      right: 15,
      alignSelf: 'flex-end',
      padding: 15,
      borderRadius: 99,
      backgroundColor: appColor,
    },
    multiQuoteBadge: {
      aspectRatio: 1,
      backgroundColor: 'white',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 99,
      position: 'absolute',
      padding: 4,
      bottom: 0,
    },
    multiQuote: {
      color: appColor,
      fontSize: 10,
    },
    lockedModalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,.5)',
      justifyContent: 'flex-end',
    },
    lockedModalMsgContainer: {
      backgroundColor: isDark ? '#081825' : '#F7F9FC',
      margin: 5,
      padding: 15,
      borderTopWidth: 6,
      borderTopColor: '#FFAE00',
      borderRadius: 8,
      flexDirection: 'row',
    },
    lockedTitle: {
      paddingLeft: 15,
      color: isDark ? 'white' : '#000000',
      fontFamily: 'OpenSans-Bold',
    },
    lockedText: {
      color: isDark ? 'white' : '#000000',
      fontFamily: 'OpenSans',
    },
  });

export default Thread;
