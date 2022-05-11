import React from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { connect, batch } from 'react-redux';
import { bindActionCreators } from 'redux';

import Pagination from '../commons/Pagination';
import Search from '../commons/Search';
import ThreadCard from '../commons/ThreadCard';

import { setAllThreads, setFollowedThreads } from '../redux/ThreadActions';

import { getFollowedThreads, getAllThreads, connection } from '../services/forum.service';

import { addThread } from '../assets/svgs';

let styles;
class Threads extends React.Component {
  followedPage = 1;
  allPage = 1;
  followedResultsTotal = 0;
  allResultsTotal = 0;
  followed = [];
  all = [];

  state = {
    followedLoadingMore: false,
    allLoadingMore: false,
    tab: 0,
    loading: true,
    createForumHeight: 0,
    followedRefreshing: false,
    allRefreshing: false,
  };

  constructor(props) {
    super(props);
    let { isDark, appColor } = props;
    styles = setStyles(isDark, appColor);
  }

  componentDidMount() {
    let reFocused;
    this.refreshOnFocusListener = this.props.navigation?.addListener('focus', () =>
      reFocused ? this.refresh?.() : (reFocused = true)
    );
    BackHandler.addEventListener('hardwareBackPress', this.onAndroidBack);
    let { forumId } = this.props.route.params;
    const { request: threadRequest, controller: threadController } = getAllThreads(forumId);
    const { request: followedThreadRequest, controller: followedThreadController } =
      getFollowedThreads(forumId);
    Promise.all([threadRequest, followedThreadRequest]).then(([all, followed]) => {
      this.all = all.data.results.map(r => r.id);
      this.followed = followed.data.results.map(r => r.id);
      this.followedResultsTotal = followed.data.total_results;
      this.allResultsTotal = all.data.total_results;
      batch(() => {
        this.props.setAllThreads(all.data.results);
        this.props.setFollowedThreads(followed.data.results);
        this.setState({ loading: false });
      });
    });
    return () => {
      threadController.abort();
      followedThreadController.abort();
    };
  }

  componentWillUnmount() {
    this.refreshOnFocusListener?.();
    BackHandler.removeEventListener('hardwareBackPress', this.onAndroidBack);
  }

  onAndroidBack = () => {
    this.props.navigation.goBack();
    return true;
  };

  navigate = (route, params) => connection(true) && this.props.navigation.navigate(route, params);

  renderFLHeader = () => {
    let { tab } = this.state;
    let { isDark, appColor } = this.props;
    return (
      <>
        <View style={styles.headerContainer}>
          {['All Threads', 'Followed Threads'].map((t, i) => (
            <TouchableOpacity
              key={t}
              onPress={() => this.setState({ tab: i }, this.refresh)}
              style={[styles.headerTOpacity, tab === i ? { borderColor: appColor } : {}]}
            >
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
    );
  };

  renderFLItem = ({ item: id }) => (
    <ThreadCard
      onNavigate={() => {
        this.navigate('Thread', { threadId: id });
      }}
      appColor={this.props.appColor}
      isDark={this.props.isDark}
      id={id}
      reduxKey={this.state.tab ? 'followed' : 'all'}
    />
  );

  changePage = page => {
    if (!connection()) return;
    let { tab } = this.state;
    let { forumId } = this.props.route.params;
    let fORa = tab ? 'followed' : 'all';
    this[`${fORa}Page`] = page;
    this.setState({ [`${fORa}LoadingMore`]: true }, () =>
      (tab ? getFollowedThreads : getAllThreads)(forumId, page).request.then(r => {
        this[fORa] = r.data.results.map(r => r.id);
        this.flatListRef.scrollToOffset({ offset: 0, animated: false });
        batch(() => {
          this.props[tab ? 'setFollowedThreads' : 'setAllThreads'](r.data.results);
          this.setState({ [`${fORa}LoadingMore`]: false });
        });
      })
    );
  };

  refresh = () => {
    if (!connection()) return;
    let { tab } = this.state;
    let { forumId } = this.props.route.params;
    let fORa = tab ? 'followed' : 'all';
    this.setState({ [`${fORa}Refreshing`]: true }, () =>
      (tab ? getFollowedThreads : getAllThreads)(forumId, this[`${fORa}Page`]).request.then(r => {
        this[fORa] = r.data.results.map(r => r.id);
        batch(() => {
          this.props[tab ? 'setFollowedThreads' : 'setAllThreads'](r.data.results);
          this.setState({ [`${fORa}Refreshing`]: false });
        });
      })
    );
  };

  render() {
    let {
      followedLoadingMore,
      allLoadingMore,
      tab,
      loading,
      createForumHeight,
      allRefreshing,
      followedRefreshing,
    } = this.state;
    let { isDark, appColor } = this.props;
    let { forumId } = this.props.route.params;

    return loading ? (
      <ActivityIndicator size='large' color={appColor} animating={true} style={styles.loading} />
    ) : (
      <SafeAreaView style={styles.fList} edges={['left', 'right', 'bottom']}>
        <FlatList
          key={tab}
          overScrollMode='never'
          windowSize={10}
          data={this[tab ? 'followed' : 'all']}
          style={styles.fList}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          onEndReachedThreshold={0.01}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps='handled'
          renderItem={this.renderFLItem}
          ListHeaderComponent={this.renderFLHeader}
          keyExtractor={item => item.toString()}
          ref={r => (this.flatListRef = r)}
          ListEmptyComponent={
            <Text style={styles.emptyList}>
              {tab ? 'You are not following any threads.' : 'No threads.'}
            </Text>
          }
          ListFooterComponent={
            <View
              style={{
                borderTopWidth: 1,
                borderColor: isDark ? '#445F74' : 'lightgrey',
                marginHorizontal: 15,
                marginBottom: createForumHeight,
              }}
            >
              <Pagination
                active={this[`${tab ? 'followed' : 'all'}Page`]}
                isDark={isDark}
                appColor={appColor}
                length={this[`${tab ? 'followed' : 'all'}ResultsTotal`]}
                onChangePage={this.changePage}
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
          }
          refreshControl={
            <RefreshControl
              colors={['white']}
              tintColor={appColor}
              progressBackgroundColor={appColor}
              onRefresh={this.refresh}
              refreshing={tab ? followedRefreshing : allRefreshing}
            />
          }
        />
        <View>
          <TouchableOpacity
            onLayout={({ nativeEvent: { layout } }) =>
              !this.state.createForumHeight &&
              this.setState({ createForumHeight: layout.height + 15 })
            }
            onPress={() =>
              this.navigate('CRUD', {
                type: 'thread',
                action: 'create',
                forumId,
              })
            }
            style={styles.bottomTOpacity}
          >
            {addThread({ height: 25, width: 25, fill: 'white' })}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}
let setStyles = (isDark, appColor) =>
  StyleSheet.create({
    headerContainer: {
      paddingHorizontal: 15,
      flexDirection: 'row',
      backgroundColor: isDark ? '#00101D' : 'white',
      flexWrap: 'wrap',
    },
    headerTOpacity: {
      paddingVertical: 15,
      marginRight: 15,
      borderBottomWidth: 2,
      borderColor: isDark ? '#00101D' : 'white',
    },
    headerText: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 14,
      color: '#445F74',
    },
    fList: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : 'white',
    },
    loading: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : 'white',
      alignItems: 'center',
    },
    emptyList: {
      color: isDark ? '#445F74' : 'black',
      fontFamily: 'OpenSans',
      padding: 15,
    },
    bottomTOpacity: {
      position: 'absolute',
      bottom: 60,
      right: 15,
      alignSelf: 'flex-end',
      padding: 15,
      borderRadius: 99,
      backgroundColor: appColor,
    },
  });
const mapDispatchToProps = dispatch =>
  bindActionCreators({ setAllThreads, setFollowedThreads }, dispatch);
const mapStateToProps = (
  { themeState },
  {
    route: {
      params: { appColor, isDark },
    },
  }
) => {
  let dark = themeState ? themeState.theme === 'dark' : isDark;
  if (setStyles.isDark !== dark) styles = setStyles(dark, appColor);
  return { appColor, isDark: dark };
};
export default connect(mapStateToProps, mapDispatchToProps)(Threads);
