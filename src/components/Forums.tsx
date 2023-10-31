import { useNavigation } from '@react-navigation/native';
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
import { useDispatch, batch } from 'react-redux';
import { setTestID, IS_TABLET, ForumRootStackParamList } from '../ForumRouter';
import ForumCard from '../commons/ForumCard';
import NavigationHeader from '../commons/NavigationHeader';
import Pagination from '../commons/Pagination';
import Search from '../commons/Search';
import ThreadCard from '../commons/ThreadCard';
import { setForumsThreads } from '../redux/threads/ThreadActions';
import { connection, getForums, getFollowedThreads } from '../services/forum.service';
import { SafeAreaView } from 'react-native-safe-area-context';

interface IForumsProps {
  route: any;
}

const Forums: FunctionComponent<IForumsProps> = props => {
  const { bottomPadding, brand, isDark, appColor } = props.route.params;

  const styles = setStyles(isDark, appColor);
  const dispatch = useDispatch();
  const { navigate, goBack, addListener, canGoBack } =
    useNavigation<StackNavigationProp<ForumRootStackParamList>>();
  const [page, setPage] = useState(1);
  const [forums, setForums] = useState([]);
  const [followedThreads, setFollowedThreads] = useState([]);
  const [followedThreadsTotal, setFollowedThreadsTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const reFocused = useRef<boolean>(false);

  const flatListRef = useRef<FlatList | null>(null);
  console.log('render forum');

  useEffect(() => {
    const refreshOnFocusListener = addListener('focus', () => {
      if (reFocused.current) {
        console.log('one refresh');
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
  }, []);

  const fetchData = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    const { request: forumsRequest, controller: forumsController } = getForums();
    const { request: followedRequest, controller: followedController } = getFollowedThreads();

    Promise.all([forumsRequest, followedRequest]).then(([forumsResponse, followedResponse]) => {
      setForums(forumsResponse.data?.results);
      setFollowedThreads(followedResponse.data?.results?.map(r => r.id));
      setFollowedThreadsTotal(followedResponse.data?.total_results);
      batch(() => {
        if (followedResponse.data) {
          dispatch(setForumsThreads(followedResponse.data?.results));
        }
        setLoading(false);
      });
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

    const { request: forumsRequest, controller: forumsController } = getForums();
    const { request: followedRequest, controller: followedController } = getFollowedThreads();

    Promise.all([forumsRequest, followedRequest]).then(([forumsResponse, followedResponse]) => {
      setForums(forumsResponse.data.results);
      setFollowedThreads(followedResponse.data?.results?.map(r => r.id));

      batch(() => {
        dispatch(setForumsThreads(followedResponse.data?.results));
        setRefreshing(false);
      });
    });

    return () => {
      forumsController.abort();
      followedController.abort();
    };
  }, [dispatch]);

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

      followedRequest.then(response => {
        setFollowedThreads(response.data?.results?.map(r => r.id));

        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        }

        batch(() => {
          dispatch(setForumsThreads(response.data.results));
          setLoadingMore(false);
        });
      });

      return () => {
        followedController.abort();
      };
    },
    [dispatch]
  );

  const renderFLItem = useCallback(
    ({ item }: { item: number }) => (
      <ThreadCard
        onNavigate={() => navigate('Thread', { threadId: item })}
        appColor={appColor}
        isDark={isDark}
        id={item}
        reduxKey='forums'
      />
    ),
    [appColor, isDark, navigate]
  );

  const renderForum = useCallback(
    (item: any) => (
      <ForumCard
        key={item.id}
        data={item}
        appColor={appColor}
        isDark={isDark}
        onNavigate={() => navigate('Threads', { title: item.title, forumId: item.id })}
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
        <Search isDark={isDark} appColor={appColor} />
        {forums?.map(item => renderForum(item))}
        <Text style={styles.sectionTitle}>{'Followed Threads'}</Text>
      </>
    ),
    [forums, appColor, isDark, renderForum, styles.sectionTitle]
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

  const keyExtractor = useCallback((item: number) => item.toString(), []);

  return (
    <SafeAreaView
      style={[styles.fList, { paddingBottom: bottomPadding / 2 }]}
      edges={['left', 'right', 'bottom']}
      testID={setTestID(`${brand}ForumsScreen`)}
    >
      <NavigationHeader title={'Forums'} {...props} />
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
          keyExtractor={keyExtractor}
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