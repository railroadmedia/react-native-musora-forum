import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { IS_TABLET } from '../services/helpers';
import { addThread } from '../assets/svgs';
import NavigationHeader from '../commons/NavigationHeader';
import Pagination from '../commons/Pagination';
import Search from '../commons/Search';
import ThreadCard from '../commons/ThreadCard';
import { setAllThreads, setFollowedThreads } from '../redux/threads/ThreadActions';
import { getAllThreads, getFollowedThreads, connection } from '../services/forum.service';
import type { ForumRootStackParamList, IForumParams, IThreadsParams } from '../entity/IRouteParams';
import type { LayoutChangeEvent } from 'react-native';

const Threads: FunctionComponent = props => {
  const { params }: RouteProp<{ params: IThreadsParams & IForumParams }, 'params'> = useRoute();
  const { bottomPadding, isDark, appColor, title, forumId } = params;
  const styles = setStyles(isDark, appColor);
  const dispatch = useDispatch();
  const { navigate, goBack, addListener, canGoBack } =
    useNavigation<StackNavigationProp<ForumRootStackParamList>>();

  const [followedPage, setFollowedPage] = useState<number>(1);
  const [allPage, setAllPage] = useState<number>(1);
  const [followedResultsTotal, setFollowedResultsTotal] = useState<number>(0);
  const [allResultsTotal, setAllResultsTotal] = useState<number>(0);
  const [followed, setFollowed] = useState<number[]>([]);
  const [all, setAll] = useState<number[]>([]);

  const [followedLoadingMore, setFollowedLoadingMore] = useState<boolean>(false);
  const [allLoadingMore, setAllLoadingMore] = useState<boolean>(false);
  const [tab, setTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [createForumHeight, setCreateForumHeight] = useState<number>(0);
  const [followedRefreshing, setFollowedRefreshing] = useState<boolean>(false);
  const [allRefreshing, setAllRefreshing] = useState<boolean>(false);
  const flatListRef = useRef<FlatList | null>(null);
  const reFocused = useRef<boolean>(false);

  useEffect(() => {
    const refreshOnFocusListener = addListener('focus', () => {
      if (reFocused.current) {
        refresh();
      } else {
        reFocused.current = true;
      }
    });
    BackHandler.addEventListener('hardwareBackPress', onAndroidBack);

    fetchData();

    return () => {
      refreshOnFocusListener?.();
      BackHandler.removeEventListener('hardwareBackPress', onAndroidBack);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(() => {
    const { request: threadRequest, controller: threadController } = getAllThreads(forumId);
    const { request: followedThreadRequest, controller: followedThreadController } =
      getFollowedThreads(forumId);
    Promise.allSettled([threadRequest, followedThreadRequest])
      .then(([allRes, followedRes]) => {
        if (allRes.status === 'fulfilled') {
          setAll(allRes.value.data?.results?.map(r => r.id));
          setAllResultsTotal(allRes.value?.data?.total_results);
          dispatch(setAllThreads(allRes.value?.data?.results));
        }
        if (followedRes.status === 'fulfilled') {
          setFollowed(followedRes.value?.data?.results?.map(r => r.id));
          setFollowedResultsTotal(followedRes.value?.data?.total_results);
          dispatch(setFollowedThreads(followedRes.value?.data?.results));
        }
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      threadController.abort();
      followedThreadController.abort();
    };
  }, [dispatch, forumId]);

  const changePage = useCallback(
    (page: number) => {
      if (!connection(true)) {
        return;
      }
      if (tab) {
        setFollowedPage(page);
        setFollowedLoadingMore(true);
        getFollowedThreads(forumId, page)
          .request.then(r => {
            setFollowed(r.data?.results?.map(f => f.id));
            dispatch(setFollowedThreads(r.data?.results));
          })
          .finally(() => {
            setFollowedLoadingMore(false);
          });
      } else {
        setAllPage(page);
        setAllLoadingMore(true);
        getAllThreads(forumId, page)
          .request.then(r => {
            setAll(r.data?.results?.map(a => a.id));
            dispatch(setAllThreads(r.data?.results));
          })
          .finally(() => {
            setAllLoadingMore(false);
          });
      }
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
    [dispatch, forumId, tab]
  );

  const refresh = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (tab) {
      setFollowedRefreshing(true);
      getFollowedThreads(forumId, followedPage)
        .request.then(r => {
          setFollowed(r?.data?.results?.map(f => f.id));
          dispatch(setFollowedThreads(r.data?.results));
        })
        .finally(() => {
          setFollowedRefreshing(false);
        });
    } else {
      setAllRefreshing(true);
      getAllThreads(forumId, allPage)
        .request.then(r => {
          setAll(r.data?.results?.map(a => a.id));
          dispatch(setAllThreads(r.data?.results));
        })
        .finally(() => {
          setAllRefreshing(false);
        });
    }
  }, [allPage, dispatch, followedPage, forumId, tab]);

  const onAndroidBack = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (canGoBack()) {
      goBack();
    }
    return true;
  }, [canGoBack, goBack]);

  const onTabChange = useCallback(
    (index: number): void => {
      setTab(index);
      refresh();
    },
    [refresh]
  );

  const onPressAddTread = (): void =>
    navigate('CRUD', {
      type: 'thread',
      action: 'create',
      forumId,
    });

  const onLayoutAddThread = ({ nativeEvent: { layout } }: LayoutChangeEvent): void => {
    if (!createForumHeight) {
      setCreateForumHeight(layout.height + 15);
    }
  };

  const renderFLHeader = useMemo(
    () => (
      <>
        <View style={styles.headerContainer}>
          {['ALL THREADS', 'FOLLOWED THREADS'].map((t, i) => (
            <TouchableOpacity key={t} onPress={() => onTabChange(i)} style={styles.headerTOpacity}>
              <Text
                style={[styles.headerText, tab === i ? { color: isDark ? 'white' : 'black' } : {}]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Search isDark={isDark} appColor={appColor} />
      </>
    ),
    [
      appColor,
      isDark,
      styles.headerContainer,
      styles.headerTOpacity,
      styles.headerText,
      tab,
      onTabChange,
    ]
  );

  const renderFLItem = useCallback(
    ({ item }: { item: number }) => (
      <ThreadCard
        appColor={appColor}
        isDark={isDark}
        id={item}
        reduxKey={tab ? 'followed' : 'all'}
      />
    ),
    [appColor, isDark, tab]
  );

  const flRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={['white']}
        tintColor={appColor}
        progressBackgroundColor={appColor}
        onRefresh={refresh}
        refreshing={followedRefreshing || allRefreshing}
      />
    ),
    [followedRefreshing, allRefreshing, appColor, refresh]
  );

  const flFooter = useMemo(
    () => (
      <View
        style={{
          borderTopWidth: 1,
          borderColor: isDark ? '#445F74' : 'lightgrey',
          marginHorizontal: 15,
          marginBottom: createForumHeight,
        }}
      >
        <Pagination
          active={tab ? followedPage : allPage}
          isDark={isDark}
          appColor={appColor}
          length={tab ? followedResultsTotal : allResultsTotal}
          onChangePage={changePage}
        />
        {(followedLoadingMore || allLoadingMore) && (
          <ActivityIndicator
            size='small'
            color={appColor}
            animating={true}
            style={{ padding: 15 }}
          />
        )}
      </View>
    ),
    [
      appColor,
      isDark,
      changePage,
      allLoadingMore,
      allPage,
      allResultsTotal,
      createForumHeight,
      followedLoadingMore,
      followedPage,
      followedResultsTotal,
      tab,
    ]
  );

  const flEmpty = useMemo(
    () => (
      <Text style={styles.emptyList}>
        {tab ? 'You are not following any threads.' : 'No threads.'}
      </Text>
    ),
    [styles.emptyList, tab]
  );

  return loading ? (
    <ActivityIndicator size='large' color={appColor} animating={true} style={styles.loading} />
  ) : (
    <SafeAreaView
      style={[styles.fList, { paddingBottom: bottomPadding / 2 + 10 }]}
      edges={['left', 'right', 'bottom']}
    >
      <NavigationHeader title={title} {...props} />
      <FlatList
        key={tab}
        overScrollMode='never'
        windowSize={10}
        data={tab ? followed : all}
        style={styles.fList}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        onEndReachedThreshold={0.01}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps='handled'
        renderItem={renderFLItem}
        ListHeaderComponent={renderFLHeader}
        keyExtractor={(item: number) => item.toString()}
        ref={flatListRef}
        ListEmptyComponent={flEmpty}
        ListFooterComponent={flFooter}
        refreshControl={flRefreshControl}
      />
      <View>
        <TouchableOpacity
          onLayout={onLayoutAddThread}
          onPress={onPressAddTread}
          style={styles.bottomTOpacity}
        >
          {addThread({ height: 25, width: 25, fill: 'white' })}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    headerContainer: {
      paddingHorizontal: 15,
      flexDirection: 'row',
      backgroundColor: isDark ? '#00101D' : '#f0f1f2',
      flexWrap: 'wrap',
    },
    headerTOpacity: {
      paddingVertical: 15,
      marginRight: 15,
      borderBottomWidth: 2,
      borderColor: isDark ? '#00101D' : '#f0f1f2',
    },
    headerText: {
      fontFamily: 'BebasNeue-Regular',
      fontSize: IS_TABLET ? 24 : 20,
      color: '#445F74',
    },
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
  });

export default Threads;
