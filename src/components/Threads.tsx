import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import Sort from '../commons/Sort';

const Threads: FunctionComponent = props => {
  const { params }: RouteProp<{ params: IThreadsParams & IForumParams }, 'params'> = useRoute();
  const { bottomPadding, isDark, appColor, title, forumId, prevScreen } = params;
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
  const selectedSort = useRef('-published_on');
  const [headerHeight, setHeaderHeight] = useState(0);

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
          setAll(allRes.value.data?.results?.map((r: { id: number }) => r.id));
          setAllResultsTotal(allRes.value?.data?.total_results);
          dispatch(setAllThreads(allRes.value?.data?.results));
        }
        if (followedRes.status === 'fulfilled') {
          setFollowed(followedRes.value?.data?.results?.map((r: { id: number }) => r.id));
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
        getFollowedThreads(forumId, page, selectedSort.current)
          .request.then(r => {
            setFollowed(r.data?.results?.map((f: { id: number }) => f.id));
            dispatch(setFollowedThreads(r.data?.results));
          })
          .finally(() => {
            setFollowedLoadingMore(false);
          });
      } else {
        setAllPage(page);
        setAllLoadingMore(true);
        getAllThreads(forumId, page, selectedSort.current)
          .request.then(r => {
            setAll(r.data?.results?.map((a: { id: number }) => a.id));
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

  const onSort = useCallback(
    (sortBy: string) => {
      selectedSort.current = sortBy;
      if (tab) {
        setFollowedRefreshing(true);
        getFollowedThreads(forumId, followedPage, sortBy)
          .request.then(r => {
            setFollowed(r?.data?.results?.map(f => f.id));
            dispatch(setFollowedThreads(r.data?.results));
          })
          .finally(() => {
            setFollowedRefreshing(false);
          });
      } else {
        setAllRefreshing(true);
        getAllThreads(forumId, allPage, sortBy)
          .request.then(r => {
            setAll(r.data?.results?.map(a => a.id));
            dispatch(setAllThreads(r.data?.results));
          })
          .finally(() => {
            setAllRefreshing(false);
          });
      }
    },
    [dispatch, forumId, tab]
  );

  const refresh = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (tab) {
      setFollowedRefreshing(true);
      getFollowedThreads(forumId, followedPage, selectedSort.current)
        .request.then(r => {
          setFollowed(r?.data?.results?.map((f: { id: number }) => f.id));
          dispatch(setFollowedThreads(r.data?.results));
        })
        .finally(() => {
          setFollowedRefreshing(false);
        });
    } else {
      setAllRefreshing(true);
      getAllThreads(forumId, allPage, selectedSort.current)
        .request.then(r => {
          setAll(r.data?.results?.map((a: { id: number }) => a.id));
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
          <View style={styles.headerBtnContainer}>
            {['ALL THREADS', 'FOLLOWED'].map((t, i) => (
              <TouchableOpacity
                key={t}
                onPress={() => onTabChange(i)}
                style={[
                  styles.headerTOpacity,
                  tab === i ? { backgroundColor: isDark ? '#445F74' : '#000C17' } : {},
                ]}
              >
                <Text style={[styles.headerText, tab === i ? { color: 'white' } : {}]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Sort onSort={onSort} defaultSelectedSort='Newest First' />
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
        prevScreen={title}
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

  const scrollOffsetY = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }], {
    useNativeDriver: true,
  });

  const onLayout = (e: LayoutChangeEvent): void => {
    setHeaderHeight(e.nativeEvent.layout.height);
  };

  return loading ? (
    <ActivityIndicator size='large' color={appColor} animating={true} style={styles.loading} />
  ) : (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.fList, { paddingBottom: bottomPadding / 2 + 10 }]}
    >
      <Animated.FlatList
        contentContainerStyle={{ paddingTop: headerHeight + 15 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
      <NavigationHeader
        title={title}
        {...props}
        prevScreen={prevScreen}
        scrollOffset={scrollOffsetY}
        onLayout={onLayout}
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
      marginTop: 20,
      paddingHorizontal: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#00101D' : '#f0f1f2',
      flexWrap: 'wrap',
    },
    headerBtnContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTOpacity: {
      height: 35,
      width: 95,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 7,
      borderRadius: 55,
      borderWidth: 1.5,
      borderColor: isDark ? '#445F74' : '#CBCBCD',
      backgroundColor: isDark ? '#00101D' : 'white',
    },
    headerText: {
      fontFamily: 'BebasNeue-Regular',
      fontSize: IS_TABLET ? 16 : 14,
      letterSpacing: 1,
      lineHeight: 20,
      color: isDark ? 'white' : '#00101D',
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
