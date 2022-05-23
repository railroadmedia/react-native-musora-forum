import React from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { connect, batch } from 'react-redux';
import { bindActionCreators } from 'redux';

import ForumCard from '../commons/ForumCard';
import ThreadCard from '../commons/ThreadCard';
import Search from '../commons/Search';
import Pagination from '../commons/Pagination';
import { connection, getForums, getFollowedThreads } from '../services/forum.service';

import { setForumsThreads } from '../redux/ThreadActions';
import { SafeAreaView } from 'react-native-safe-area-context';

let styles;
class Forums extends React.Component {
  page = 1;
  forums = [];
  followedThreads = [];
  followedThreadsTotal = 0;
  state = {
    loadingMore: false,
    loading: true,
    refreshing: false,
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
    const { request: forumsRequest, controller: forumsController } = getForums();
    const { request: followedRequest, controller: followedController } = getFollowedThreads();

    Promise.all([forumsRequest, followedRequest]).then(([forums, followed]) => {
      this.forums = forums.data.results;
      this.followedThreads = followed.data.results.map(r => r.id);
      this.followedThreadsTotal = followed.data.total_results;
      batch(() => {
        this.props.setForumsThreads(followed.data.results);
        this.setState({ loading: false });
      });
    });

    return () => {
      forumsController.abort();
      followedController.abort();
    };
  }

  componentWillUnmount = () => {
    BackHandler.removeEventListener('hardwareBackPress', this.onAndroidBack);
    this.refreshOnFocusListener?.();
  };

  onAndroidBack = () => {
    this.props.navigation.goBack();
    return true;
  };

  navigate = (route, params) => connection(true) && this.props.navigation.navigate(route, params);

  renderFLItem = ({ item: id }) => (
    <ThreadCard
      onNavigate={() => this.navigate('Thread', { threadId: id })}
      appColor={this.props.appColor}
      isDark={this.props.isDark}
      id={id}
      reduxKey={'forums'}
    />
  );

  renderForum = item => (
    <ForumCard
      key={item.id}
      data={item}
      appColor={this.props.appColor}
      isDark={this.props.isDark}
      onNavigate={() => this.navigate('Threads', { title: item.title, forumId: item.id })}
    />
  );

  refresh = () => {
    if (!connection()) return;
    this.setState({ refreshing: true }, () => {
      const { request: forumsRequest, controller: forumsController } = getForums();
      const { request: followedRequest, controller: followedController } = getFollowedThreads();
      Promise.all([forumsRequest, followedRequest]).then(([forums, followed]) => {
        this.forums = forums.data.results;
        this.followedThreads = followed.data.results.map(r => r.id);
        batch(() => {
          this.props.setForumsThreads(followed.data.results);
          this.setState({ refreshing: false });
        });
      });
      return () => {
        forumsController.abort();
        followedController.abort();
      };
    });
  };

  changePage = page => {
    if (!connection()) return;
    this.page = page;
    this.setState({ loadingMore: true }, () => {
      const { request: followedRequest, controller: followedController } = getFollowedThreads(
        undefined,
        page
      );

      followedRequest.then(r => {
        this.followedThreads = r.results.map(r => r.id);
        this.flatListRef.scrollToOffset({ offset: 0, animated: false });
        batch(() => {
          this.props.setForumsThreads(r.results);
          this.setState({ loadingMore: false });
        });
      });
      return () => {
        followedController.abort();
      };
    });
  };

  render() {
    let { loadingMore, loading, refreshing } = this.state;
    let { appColor, isDark } = this.props;
    let { bottomPadding } = this.props.route.params;

    return (
      <SafeAreaView
        style={[styles.fList, { paddingBottom: bottomPadding / 2 }]}
        edges={['left', 'right', 'bottom']}
      >
        {loading ? (
          <ActivityIndicator
            size='large'
            color={appColor}
            animating={true}
            style={styles.loading}
          />
        ) : (
          <FlatList
            windowSize={10}
            data={this.followedThreads}
            style={styles.fList}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps='handled'
            renderItem={this.renderFLItem}
            keyExtractor={item => item.toString()}
            ref={r => (this.flatListRef = r)}
            refreshControl={
              <RefreshControl
                colors={['white']}
                tintColor={appColor}
                progressBackgroundColor={appColor}
                onRefresh={this.refresh}
                refreshing={refreshing}
              />
            }
            ListEmptyComponent={<Text style={styles.emptyList}>You don't follow any threads</Text>}
            ListFooterComponent={
              <View
                style={{
                  borderTopWidth: 1,
                  borderColor: isDark ? '#445F74' : 'lightgrey',
                  marginHorizontal: 15,
                  marginBottom: 10,
                }}
              >
                <Pagination
                  active={this.page}
                  isDark={isDark}
                  appColor={appColor}
                  length={this.followedThreadsTotal}
                  onChangePage={this.changePage}
                />
                <ActivityIndicator
                  size='small'
                  color={appColor}
                  animating={loadingMore}
                  style={{ padding: 15 }}
                />
              </View>
            }
            ListHeaderComponent={
              <>
                <Search isDark={isDark} appColor={appColor} />
                {this.forums?.map(item => this.renderForum(item))}
                <Text style={styles.sectionTitle}>FOLLOWED THREADS</Text>
              </>
            }
          />
        )}
      </SafeAreaView>
    );
  }
}

let setStyles = (isDark, appColor) => {
  setStyles.isDark = isDark;
  return StyleSheet.create({
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
      fontSize: 16,
      color: isDark ? '#445F74' : '#97AABE',
      margin: 5,
      marginLeft: 15,
      marginTop: 40,
    },
  });
};
const mapDispatchToProps = dispatch => bindActionCreators({ setForumsThreads }, dispatch);
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

export default connect(mapStateToProps, mapDispatchToProps)(Forums);
