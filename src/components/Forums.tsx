import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef, useState, FunctionComponent, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  StyleProp,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setTestID, IS_TABLET } from '../services/helpers';
import ForumCard from '../commons/ForumCard';
import NavigationHeader from '../commons/NavigationHeader';
import Pagination from '../commons/Pagination';
import Search from '../commons/Search';
import ThreadCard from '../commons/ThreadCard';
import { setForumsThreads } from '../redux/threads/ThreadActions';
import { connection, getForums, getFollowedThreads } from '../services/forum.service';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ForumRootStackParamList, IForumParams } from '../entity/IRouteParams';
import type { IForum, IThread } from '../entity/IForum';

const Forums: FunctionComponent = props => {
  const { params }: RouteProp<{ params: IForumParams }, 'params'> = useRoute();
  const { bottomPadding, brand, isDark, appColor } = params;

  const styles = setStyles(isDark, appColor);
  const dispatch = useDispatch();
  const { navigate, goBack, addListener, canGoBack } =
    useNavigation<StackNavigationProp<ForumRootStackParamList>>();
  const [page, setPage] = useState<number>(1);
  const [forums, setForums] = useState<IForum[]>([]);
  const [followedThreads, setFollowedThreads] = useState<number[]>([]);
  const [followedThreadsTotal, setFollowedThreadsTotal] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const reFocused = useRef<boolean>(false);

  const flatListRef = useRef<FlatList | null>(null);

  const title = 'Forums';

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
      BackHandler.removeEventListener('hardwareBackPress', onAndroidBack);
      refreshOnFocusListener?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    const { request: forumsRequest, controller: forumsController } = getForums();
    const { request: followedRequest, controller: followedController } = getFollowedThreads();

    Promise.allSettled([forumsRequest, followedRequest])
      .then(([forumsResponse, followedResponse]) => {
        if (forumsResponse.status === 'fulfilled') {
          setForums(forumsResponse.value.data?.results);
        }
        if (followedResponse.status === 'fulfilled') {
          setFollowedThreads(followedResponse.value.data?.results?.map((r: IThread) => r.id));
          setFollowedThreadsTotal(followedResponse.value.data?.total_results);
          if (followedResponse.value.data) {
            dispatch(setForumsThreads(followedResponse.value.data?.results));
          }
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      forumsController.abort();
      followedController.abort();
    };
  }, [dispatch]);

  const refresh = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const changePage = useCallback(
    (newPage: number) => {
      if (!connection(true)) {
        return;
      }
      setPage(newPage);
      setLoadingMore(true);
      const { request: followedRequest, controller: followedController } = getFollowedThreads(
        undefined,
        newPage
      );
      followedRequest
        .then(response => {
          setFollowedThreads(response.data?.results?.map((r: IThread) => r.id));
          if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: false });
          }
          dispatch(setForumsThreads(response.data.results));
        })
        .finally(() => setLoadingMore(false));

      return () => {
        followedController.abort();
      };
    },
    [dispatch]
  );

  const renderFLItem = useCallback(
    ({ item }: { item: number }) => (
      <ThreadCard
        appColor={appColor}
        isDark={isDark}
        id={item}
        reduxKey='forums'
        prevScreen={title}
      />
    ),
    [appColor, isDark]
  );

  const renderForum = useCallback(
    (item: IForum) => (
      <ForumCard
        key={item.id}
        data={item}
        appColor={appColor}
        isDark={isDark}
        onNavigate={() =>
          navigate('Threads', { title: item.title, forumId: item.id, prevScreen: title })
        }
      />
    ),
    [appColor, isDark, navigate]
  );

  const onAndroidBack = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (canGoBack()) {
      goBack();
    }
    return true;
  }, [goBack, canGoBack]);

  const flRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={['white']}
        tintColor={appColor}
        progressBackgroundColor={appColor}
        onRefresh={refresh}
        refreshing={refreshing}
      />
    ),
    [refreshing, appColor, refresh]
  );

  const flHeader = useMemo(
    () => (
      <>
        <View style={{ marginTop: 70 }} />
        <Search isDark={isDark} appColor={appColor} />
        {forums?.map(item => renderForum(item))}
        <Text style={styles.sectionTitle}>{'Followed Threads'}</Text>
        <NavigationHeader title={title} {...props} />
      </>
    ),
    [isDark, appColor, forums, styles.sectionTitle, props, renderForum]
  );

  const flFooter = useMemo(
    () => (
      <View
        style={{
          borderTopWidth: 1,
          borderColor: isDark ? '#445F74' : 'lightgrey',
          marginHorizontal: 15,
          marginBottom: 10,
        }}
      >
        <Pagination
          active={page}
          isDark={isDark}
          appColor={appColor}
          length={followedThreadsTotal}
          onChangePage={changePage}
        />
        <ActivityIndicator
          size='small'
          color={appColor}
          animating={loadingMore}
          style={{ padding: 15 }}
        />
      </View>
    ),
    [page, followedThreadsTotal, loadingMore, appColor, isDark, changePage]
  );

  const flEmpty = useMemo(
    () => <Text style={styles.emptyList}>{"You don't follow any threads"}</Text>,
    [styles.emptyList]
  );

  return (
    <SafeAreaView
      style={[styles.container, { paddingBottom: bottomPadding / 2 }]}
      testID={setTestID(`${brand}ForumsScreen`)}
    >
      {loading ? (
        <ActivityIndicator size='large' color={appColor} animating={true} style={styles.loading} />
      ) : (
        <FlatList
          windowSize={10}
          data={followedThreads}
          style={styles.fList}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps='handled'
          renderItem={renderFLItem}
          keyExtractor={(item: number) => item.toString()}
          ref={flatListRef}
          refreshControl={flRefreshControl}
          ListEmptyComponent={flEmpty}
          ListFooterComponent={flFooter}
          ListHeaderComponent={flHeader}
        />
      )}
    </SafeAreaView>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : '#f0f1f2',
    },
    fList: {
      flex: 1,
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
    createForumIcon: {
      position: 'absolute',
      bottom: 60,
      right: 15,
      height: 55,
      aspectRatio: 1,
      borderRadius: 27,
      backgroundColor: appColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      fontFamily: 'OpenSans-Bold',
      fontSize: IS_TABLET ? 24 : 20,
      color: isDark ? '#FFFFFF' : '#00101D',
      margin: 5,
      marginLeft: 15,
      marginVertical: 20,
    },
  });

export default Forums;
