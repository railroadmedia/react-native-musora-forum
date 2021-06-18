import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  Modal
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { connect, batch } from 'react-redux';
import { bindActionCreators } from 'redux';

import Pagination from '../commons/Pagination';
import Post from '../commons/Post';

import { connection, getThread } from '../services/forum.service';

import { post, multiQuote, lock } from '../assets/svgs';

import { setPosts, setForumRules } from '../redux/ThreadActions';

let styles;
class Thread extends React.Component {
  page = 1;
  state = {
    loading: true,
    postHeight: 0,
    loadingMore: false,
    refreshing: false,
    multiQuoting: false,
    lockedModalVisible: false
  };

  constructor(props) {
    super(props);
    let { isDark, appColor, page } = props.route.params;
    styles = setStyles(isDark, appColor);
    this.page = page || 1;
    this.itemsDisplayed = new Set();
  }

  componentDidMount() {
    let reFocused;
    this.refreshOnFocusListener = this.props.navigation?.addListener(
      'focus',
      () => (reFocused ? this.refresh?.() : (reFocused = true))
    );
    const { threadId, postId, isForumRules } = this.props.route.params;
    getThread(threadId, this.page, postId).then(thread => {
      this.page = parseInt(thread.page);
      this.post_count = thread.post_count;
      this.posts = thread.posts.map(p => p.id);
      batch(() => {
        if (isForumRules) this.props.setForumRules(thread);
        this.props.setPosts(thread.posts);
        this.setState({ loading: false });
      });
    });
  }

  componentWillUnmount() {
    this.refreshOnFocusListener?.();
  }

  navigate = (route, params) =>
    connection(true) && this.props.navigation.navigate(route, params);

  renderFLItem = ({ item: id, index }) => {
    let { isDark, appColor, user, postId } = this.props.route.params;
    return (
      <View
        onLayout={() => {
          this.itemsDisplayed?.add(id);
          // if a notification is opened scroll to the given post
          if (postId && this.itemsDisplayed?.size === this.posts.length)
            try {
              this.flatListRef?.scrollToIndex({
                animated: false,
                index: this.posts.findIndex(p => p === postId)
              });
              delete this.itemsDisplayed;
            } catch (_) {}
        }}
      >
        <Post
          user={user}
          id={id}
          index={index + 1 + 10 * (this.page - 1)}
          appColor={appColor}
          isDark={isDark}
          onMultiQuote={() =>
            this.setState({ multiQuoting: !!Post.multiQuotes.length })
          }
        />
      </View>
    );
  };

  renderPagination = (marginBottom, borderTopWidth, borderBottomWidth) => {
    let { isDark, appColor } = this.props.route.params;
    return (
      <View
        style={{
          borderTopWidth,
          borderBottomWidth,
          borderColor: isDark ? '#445F74' : 'lightgrey',
          marginHorizontal: 15,
          marginBottom
        }}
      >
        <Pagination
          key={this.page}
          active={this.page}
          isDark={isDark}
          appColor={appColor}
          length={this.post_count}
          onChangePage={this.changePage}
        />
        {this.state.loadingMore && (
          <ActivityIndicator
            size='small'
            color={isDark ? 'white' : 'black'}
            animating={true}
            style={{ padding: 15 }}
          />
        )}
      </View>
    );
  };

  refresh = () => {
    if (!connection()) return;
    let { threadId } = this.props.route.params;
    Post.clearQuoting();
    this.setState({ refreshing: true, multiQuoting: false }, () =>
      getThread(threadId, this.page).then(thread => {
        this.post_count = thread.post_count;
        this.posts = thread.posts.map(p => p.id);
        batch(() => {
          this.props.setPosts(thread.posts);
          this.setState({ refreshing: false });
        });
      })
    );
  };

  changePage = page => {
    if (!connection()) return;
    let { threadId } = this.props.route.params;
    this.page = page;
    this.setState({ loadingMore: true }, () =>
      getThread(threadId, page).then(thread => {
        this.post_count = thread.post_count;
        this.posts = thread.posts.map(p => p.id);
        this.flatListRef.scrollToOffset({ offset: 0, animated: false });
        batch(() => {
          this.props.setPosts(thread.posts);
          this.setState({ loadingMore: false });
        });
      })
    );
  };

  toggleLockedModal = () =>
    this.setState(
      ({ lockedModalVisible }) => ({ lockedModalVisible: !lockedModalVisible }),
      () =>
        this.state.lockedModalVisible &&
        setTimeout(() => this.setState({ lockedModalVisible: false }), 3000)
    );

  render() {
    let { locked } = this.props;
    let { loading, refreshing, postHeight, multiQuoting, lockedModalVisible } =
      this.state;
    let { isDark, appColor, threadId } = this.props.route.params;
    return loading ? (
      <ActivityIndicator
        size='large'
        color={isDark ? 'white' : 'black'}
        animating={true}
        style={styles.loading}
      />
    ) : (
      <>
        <FlatList
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
          ListEmptyComponent={
            <Text style={styles.emptyList}>{'No posts.'}</Text>
          }
          ListFooterComponent={this.renderPagination(postHeight, 1, 0)}
          refreshControl={
            <RefreshControl
              colors={[isDark ? 'white' : 'black']}
              tintColor={isDark ? 'white' : 'black'}
              onRefresh={this.refresh}
              refreshing={refreshing}
            />
          }
        />
        <SafeAreaView style={styles.bottomTOpacitySafeArea}>
          <TouchableOpacity
            onLayout={({ nativeEvent: { layout } }) =>
              !this.state.postHeight &&
              this.setState({ postHeight: layout.height + 15 })
            }
            onPress={
              locked
                ? this.toggleLockedModal
                : () =>
                    this.navigate('CRUD', {
                      type: 'post',
                      action: 'create',
                      threadId,
                      quotes: Post.multiQuotes.map(({ props: { post } }) => ({
                        ...post,
                        content: `<blockquote><b>${post.author.display_name}</b>:<br>${post.content}</blockquote>`
                      }))
                    })
            }
            style={styles.bottomTOpacity}
          >
            {(locked ? lock : multiQuoting ? multiQuote : post)({
              height: 25,
              width: 25,
              fill: 'white'
            })}
            {multiQuoting && (
              <View style={styles.multiQuoteBadge}>
                <Text style={{ color: appColor, fontSize: 10 }}>
                  +{Post.multiQuotes.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </SafeAreaView>
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
                <Text style={{ color: 'white', fontFamily: 'OpenSans' }}>
                  This thread is locked.
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }
}
let setStyles = (isDark, appColor) =>
  StyleSheet.create({
    fList: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : 'white'
    },
    loading: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : 'white',
      alignItems: 'center'
    },
    emptyList: {
      color: isDark ? '#445F74' : 'black',
      fontFamily: 'OpenSans',
      padding: 15
    },
    bottomTOpacity: {
      padding: 15,
      margin: 15,
      borderRadius: 99,
      backgroundColor: appColor
    },
    bottomTOpacitySafeArea: {
      position: 'absolute',
      bottom: 0,
      alignSelf: 'flex-end'
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
      bottom: 0
    },
    lockedModalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,.5)',
      justifyContent: 'flex-end'
    },
    lockedModalMsgContainer: {
      backgroundColor: '#081825',
      margin: 5,
      padding: 15,
      borderTopWidth: 6,
      borderTopColor: '#FFAE00',
      borderRadius: 8,
      flexDirection: 'row'
    },
    lockedTitle: {
      paddingLeft: 15,
      color: 'white',
      fontFamily: 'OpenSans-Bold'
    }
  });

const mapDispatchToProps = dispatch =>
  bindActionCreators({ setPosts, setForumRules }, dispatch);
const mapStateToProps = (
  { threads },
  {
    route: {
      params: { threadId }
    }
  }
) => ({
  locked: !!(
    threads?.forums?.[threadId] ||
    threads?.all?.[threadId] ||
    threads?.followed?.[threadId] ||
    threads?.search?.[threadId] ||
    threads.forumRules ||
    {}
  ).locked
});

export default connect(mapStateToProps, mapDispatchToProps)(Thread);
