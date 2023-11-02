import React, { useState, useEffect, useRef, FunctionComponent, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { batch, useDispatch } from 'react-redux';
import { search as searchSvg, arrowLeft } from '../assets/svgs';
import { search, connection } from '../services/forum.service';
import Pagination from './Pagination';
import SearchCard from './SearchCard';
import type { IThread } from '../entity/IForum';
import type { StackNavigationProp } from '@react-navigation/stack';
import { setSearchThreads } from '../redux/threads/ThreadActions';
import type { ForumRootStackParamList } from '../entity/IRouteParams';

interface ISearch {
  isDark: boolean;
  appColor: string;
}

const Search: FunctionComponent<ISearch> = props => {
  const { isDark, appColor } = props;
  const styles = setStyles(isDark);
  const { navigate } = useNavigation<StackNavigationProp<ForumRootStackParamList>>();
  const dispatch = useDispatch();
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchTotal, setSearchTotal] = useState(0);
  const [page, setPage] = useState(1);

  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!loading) {
      flatListRef?.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [searchResults, loading]);

  const searchPosts = useCallback(
    (text = searchText) => {
      const { request, controller } = search(text, page);

      request.then(searchResult => {
        setSearchResults(searchResult.data?.results);
        setSearchText(text);
        setSearchTotal(searchResult.data?.total_results);
        dispatch(setSearchThreads(searchResult.data?.results?.map(r => r.thread)));
        batch(() => {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        });
      });

      return () => controller.abort();
    },
    [dispatch, page, searchText]
  );

  const closeModal = useCallback(() => {
    setShowSearchResults(false);
    setSearchText('');
    setSearchResults([]);
    setSearchTotal(0);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    setRefreshing(true);
    searchPosts();
  }, [searchPosts]);

  const changePage = useCallback(
    (newPage: number) => {
      if (!connection(true)) {
        return;
      }
      setPage(newPage);
      setLoadingMore(true);
      searchPosts();
    },
    [searchPosts]
  );

  const onSubmitEditing = useCallback(
    ({ nativeEvent: { text } }: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      textInputRef.current?.clear();
      if (connection(true) && text) {
        setShowSearchResults(true);
        setLoading(true);
        searchPosts(text);
      }
    },
    [searchPosts]
  );

  const renderSearchInput = useMemo(
    () => (
      <View style={styles.searchInputContainer}>
        <View style={styles.inputContainer}>
          <View style={styles.searchIcon}>
            {searchSvg({
              height: 15,
              width: 15,
              fill: '#000C17',
            })}
          </View>
          <TextInput
            ref={textInputRef}
            style={styles.searchInput}
            autoCapitalize='none'
            autoCorrect={false}
            spellCheck={false}
            placeholder='Search forums...'
            placeholderTextColor='#000C17'
            returnKeyType='search'
            onSubmitEditing={onSubmitEditing}
          />
        </View>
        {searchText && showSearchResults && (
          <Text style={styles.resultText}>
            {'Showing results for '}
            <Text style={{ fontFamily: 'OpenSans-BoldItalic' }}>{`${searchText}`}</Text>
            {' in All Forums'}
          </Text>
        )}
      </View>
    ),
    [
      onSubmitEditing,
      searchText,
      showSearchResults,
      styles.inputContainer,
      styles.resultText,
      styles.searchIcon,
      styles.searchInput,
      styles.searchInputContainer,
    ]
  );

  const onNavigate = useCallback(
    (item: any) => {
      closeModal();
      navigate('Thread', {
        threadId: item.thread_id,
        title: item.thread.title,
        postId: item.id,
      });
    },
    [navigate, closeModal]
  );

  const renderFLItem = useCallback(
    ({ item }: { item: any }) => (
      <SearchCard onNavigate={onNavigate} item={item} isDark={isDark} appColor={appColor} />
    ),
    [appColor, isDark, onNavigate]
  );

  const flFooter = useMemo(
    () => (
      <>
        {!!searchTotal && (
          <View style={styles.footerContainer}>
            <Pagination
              active={page}
              isDark={isDark}
              appColor={appColor}
              length={searchTotal}
              onChangePage={changePage}
            />
            <ActivityIndicator
              size='small'
              color={appColor}
              animating={loadingMore}
              style={{ padding: 15 }}
            />
          </View>
        )}
      </>
    ),
    [appColor, changePage, isDark, loadingMore, page, searchTotal, styles.footerContainer]
  );

  const flEmpty = useMemo(
    () => <Text style={styles.emptyList}>{'No Results'}</Text>,
    [styles.emptyList]
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={['white']}
        tintColor={appColor}
        progressBackgroundColor={appColor}
        onRefresh={refresh}
        refreshing={refreshing}
      />
    ),
    [appColor, refresh, refreshing]
  );

  const keyExtractor = useCallback((item: IThread) => item.id.toString(), []);

  return (
    <>
      {renderSearchInput}
      {showSearchResults && (
        <Modal
          animationType='fade'
          onRequestClose={closeModal}
          supportedOrientations={['portrait', 'landscape']}
          visible={showSearchResults}
          transparent={false}
        >
          <SafeAreaView style={styles.safeArea}>
            <TouchableOpacity style={styles.navHeader} onPress={closeModal}>
              {arrowLeft({ height: 20, fill: isDark ? 'white' : 'black' })}
              <Text style={styles.navHeaderTitle}>{'All Forums'}</Text>
            </TouchableOpacity>
            {loading ? (
              <ActivityIndicator
                size='large'
                color={appColor}
                animating={loading}
                style={{ flex: 1 }}
              />
            ) : (
              <FlatList
                windowSize={10}
                data={searchResults}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                removeClippedSubviews={true}
                keyboardShouldPersistTaps='handled'
                renderItem={renderFLItem}
                keyExtractor={keyExtractor}
                ref={flatListRef}
                refreshControl={refreshControl}
                ListEmptyComponent={flEmpty}
                ListHeaderComponent={renderSearchInput}
                ListFooterComponent={flFooter}
              />
            )}
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : 'white',
    },
    navHeader: {
      paddingHorizontal: 15,
      paddingVertical: 20,
      justifyContent: 'center',
    },
    navHeaderTitle: {
      fontFamily: 'OpenSans-ExtraBold',
      fontSize: 20,
      color: 'black',
      textAlign: 'center',
      position: 'absolute',
      alignSelf: 'center',
    },
    headerText: {
      fontFamily: 'OpenSans-ExtraBold',
      fontSize: 20,
      color: 'black',
    },
    resultText: {
      fontFamily: 'OpenSans-Italic',
      color: 'black',
      paddingVertical: 5,
    },
    searchInputContainer: {
      padding: 15,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchIcon: {
      position: 'absolute',
      left: 15,
      zIndex: 2,
    },
    searchInput: {
      fontSize: 14,
      fontFamily: 'OpenSans',
      flex: 1,
      height: 35,
      borderRadius: 25,
      paddingLeft: 40,
      color: '#000C17',
      backgroundColor: '#F7F9FC',
    },
    emptyList: {
      color: '#445F74',
      fontFamily: 'OpenSans',
      padding: 15,
    },
    footerContainer: {
      borderTopWidth: 1,
      borderColor: '#445F74',
      marginHorizontal: 15,
      marginBottom: 10,
    },
  });

export default Search;
