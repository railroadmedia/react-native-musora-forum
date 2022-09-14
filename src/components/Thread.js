import React from 'react';
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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { connect, batch } from 'react-redux';
import { bindActionCreators } from 'redux';

import Pagination from '../commons/Pagination';
import Post from '../commons/Post';

import { connection, getThread } from '../services/forum.service';

import { post, multiQuote, lock } from '../assets/svgs';

import { setPosts, setForumRules } from '../redux/ThreadActions';
import { IS_TABLET } from '../index';

let styles;
class Thread extends React.Component {
  page = 1;
  postLayouts = {};
  flHeaderHeight = 0;
  state = {
    loading: true,
    postHeight: 0,
    loadingMore: false,
    refreshing: false,
    multiQuoting: false,
    lockedModalVisible: false,
    postKey: false,
  };

  constructor(props) {
    super(props);
    let { page, postId } = props.route.params;
    this.postId = postId;
    styles = setStyles(props.isDark, props.appColor);
    this.page = page || 1;
  }

  componentDidMount() {
    let reFocused;
    this.refreshOnFocusListener = this.props.navigation?.addListener('focus', () =>
      reFocused ? this.refresh?.() : (reFocused = true)
    );
    this.blurListener = this.props.navigation?.addListener('blur', () =>
      this.setState(({ postKey }) => ({ postKey: !postKey }))
    );
    const { threadId, isForumRules } = this.props.route.params;
    BackHandler.addEventListener('hardwareBackPress', this.onAndroidBack);
    if (threadId || isForumRules || this.postId) {
      const { request, controller } = getThread(threadId, this.page, isForumRules, this.postId);
      request.then(thread => {
        this.page = parseInt(thread.data.page);
        this.post_count = thread.data.post_count;
        this.posts = thread.data.posts.map(p => p.id);
        batch(() => {
          if (isForumRules) this.props.setForumRules(thread.data);
          this.props.setPosts(thread.data.posts);
          this.setState({ loading: false });
        });
      });
      return () => {
        controller.abort();
      };
    }
    this.setState({ loading: false });
  }

  componentWillUnmount() {
    this.blurListener?.();
    this.refreshOnFocusListener?.();
    BackHandler.removeEventListener('hardwareBackPress', this.onAndroidBack);
  }

  onAndroidBack = () => {
    this.props.navigation.goBack();
    return true;
  };

  navigate = (route, params) => connection(true) && this.props.navigation.navigate(route, params);

  handleAutoScroll = (id, height) => {
    this.postLayouts[id] = height;
    let { postId } = this;
    if (postId && this.posts.every(p => Object.keys(this.postLayouts).includes(`${p}`))) {
      let scrollPos = this.flHeaderHeight;
      this.posts
        .slice(
          0,
          this.posts.findIndex(p => p === postId)
        )
        .map(pId => (scrollPos += this.postLayouts[pId]));
      this.flatListRef?.scrollToOffset({
        offset: scrollPos,
        animated: false,
      });
    }
  };

  renderFLItem = ({ item: id, index }) => {
    let { postKey } = this.state;
    let { locked, isDark, appColor, user } = this.props;
    return (
      <View
        key={postKey}
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }) => this.handleAutoScroll(id, height)}
      >
        <Post
          locked={locked}
          user={user}
          id={id}
          index={index + 1 + 10 * (this.page - 1)}
          appColor={appColor}
          isDark={isDark}
          onMultiQuote={() => this.setState({ multiQuoting: !!Post.multiQuotes.length })}
          onPostCreated={postId => (this.postId = postId)}
          onDelete={postId => {
            delete this.postId;
            this.posts = this.posts.filter(p => p !== postId);
            if (!this.posts.length && this.page > 1) this.changePage(--this.page);
          }}
        />
      </View>
    );
  };

  renderPagination = (marginBottom, borderTopWidth, borderBottomWidth) => {
    let { isDark, appColor } = this.props;
    return (
      <View
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }) => (this.flHeaderHeight = height)}
        style={{
          borderTopWidth,
          borderBottomWidth,
          borderColor: isDark ? '#445F74' : 'lightgrey',
          marginHorizontal: 15,
          marginBottom,
        }}
      >
        <Pagination
          key={`${this.page}${this.post_count}`}
          active={this.page}
          isDark={isDark}
          appColor={appColor}
          length={this.post_count}
          onChangePage={this.changePage}
        />
        {this.state.loadingMore && (
          <ActivityIndicator
            size='small'
            color={appColor}
            animating={true}
            style={{ padding: 15 }}
          />
        )}
      </View>
    );
  };

  refresh = () => {
    if (!connection()) return;
    let { threadId, isForumRules } = this.props.route.params;
    Post.clearQuoting();
    if (!threadId && !isForumRules && !this.postId) {
      return;
    }
    this.setState({ refreshing: true, multiQuoting: false }, () => {
      const { request, controller } = getThread(threadId, this.page, isForumRules, this.postId);

      request.then(thread => {
        this.page = parseInt(thread.data.page);
        this.post_count = thread.data.post_count;
        this.posts = thread.data.posts.map(p => p.id);
        batch(() => {
          if (isForumRules) this.props.setForumRules(thread.data);
          this.props.setPosts(thread.data.posts);
          this.setState({ refreshing: false });
        });
      });
      return () => controller.abort();
    });
  };

  changePage = page => {
    delete this.postId;
    if (!connection()) return;
    let { threadId, isForumRules } = this.props.route.params;
    this.page = page;
    this.setState({ loadingMore: true }, () => {
      const { request, controller } = getThread(threadId, page, isForumRules);
      request.then(thread => {
        this.post_count = thread.data.post_count;
        this.posts = thread.data.posts.map(p => p.id);
        this.flatListRef.scrollToOffset({ offset: 0, animated: false });
        batch(() => {
          if (isForumRules) this.props.setForumRules(thread.data);
          this.props.setPosts(thread.data.posts);
          this.setState({ loadingMore: false });
        });
      });
      return () => controller.abort();
    });
  };

  toggleLockedModal = () =>
    this.setState(
      ({ lockedModalVisible }) => ({ lockedModalVisible: !lockedModalVisible }),
      () =>
        this.state.lockedModalVisible &&
        setTimeout(() => this.setState({ lockedModalVisible: false }), 3000)
    );

  render() {
    let { locked, isDark, appColor } = this.props;
    let { loading, refreshing, postHeight, multiQuoting, lockedModalVisible } = this.state;
    let { threadId, bottomPadding } = this.props.route.params;
    return loading ? (
      <ActivityIndicator size='large' color={appColor} animating={true} style={styles.loading} />
    ) : (
      <SafeAreaView
        style={[styles.fList, { paddingBottom: bottomPadding / 2 + 10 }]}
        edges={['right', 'left', 'bottom']}
      >
        <FlatList
          overScrollMode='never'
          onScrollBeginDrag={() => delete this.postId}
          windowSize={10}
          data={this.posts}
          style={styles.fList}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          onEndReachedThreshold={0.01}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps='handled'
          renderItem={this.renderFLItem}
          ListHeaderComponent={this.renderPagination(20, 0, 1)}
          keyExtractor={id => id.toString()}
          ref={r => (this.flatListRef = r)}
          ListEmptyComponent={<Text style={styles.emptyList}>{'No posts.'}</Text>}
          ListFooterComponent={this.renderPagination(postHeight, 1, 0)}
          refreshControl={
            <RefreshControl
              colors={['white']}
              tintColor={appColor}
              progressBackgroundColor={appColor}
              onRefresh={this.refresh}
              refreshing={refreshing}
            />
          }
        />
        <View>
          <TouchableOpacity
            onLayout={({ nativeEvent: { layout } }) =>
              !this.state.postHeight && this.setState({ postHeight: layout.height + 15 })
            }
            onPress={() => {
              delete this.postId;
              locked
                ? this.toggleLockedModal()
                : this.navigate('CRUD', {
                    type: 'post',
                    action: 'create',
                    onPostCreated: postId => (this.postId = postId),
                    threadId,
                    quotes: Post.multiQuotes.map(({ props: { post } }) => ({
                      ...post,
                      content: `<blockquote><b>${post.author.display_name}</b>:<br>${post.content}</blockquote>`,
                    })),
                  });
            }}
            style={styles.bottomTOpacity}
          >
            {(locked ? lock : multiQuoting ? multiQuote : post)({
              height: 25,
              width: 25,
              fill: 'white',
            })}
            {multiQuoting && (
              <View style={styles.multiQuoteBadge}>
                <Text style={{ color: appColor, fontSize: 10 }}>+{Post.multiQuotes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Modal
          animationType={'fade'}
          onRequestClose={this.toggleLockedModal}
          supportedOrientations={['portrait', 'landscape']}
          transparent={true}
          visible={lockedModalVisible}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={this.toggleLockedModal}
            style={styles.lockedModalBackground}
          >
            <View style={styles.lockedModalMsgContainer}>
              {lock({ height: 15, width: 15, fill: '#FFAE00' })}
              <Text style={styles.lockedTitle}>
                Locked{'\n'}
                <Text
                  style={{
                    color: isDark ? 'white' : '#000000',
                    fontFamily: 'OpenSans',
                  }}
                >
                  This thread is locked.
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }
}
let setStyles = (isDark, appColor) =>
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
  });

const mapDispatchToProps = dispatch => bindActionCreators({ setPosts, setForumRules }, dispatch);
const mapStateToProps = (
  { themeState, threads, userState },
  {
    route: {
      params: { threadId, appColor, user, isDark },
    },
  }
) => {
  let dark = themeState ? themeState.theme === 'dark' : isDark;
  if (setStyles.isDark !== dark) styles = setStyles(dark, appColor);

  let locked = !!(
    threads?.forums?.[threadId] ||
    threads?.all?.[threadId] ||
    threads?.followed?.[threadId] ||
    threads?.search?.[threadId] ||
    threads.forumRules ||
    {}
  ).locked;
  return { appColor, isDark: dark, locked, user: userState?.user || user };
};

export default connect(mapStateToProps, mapDispatchToProps)(Thread);
