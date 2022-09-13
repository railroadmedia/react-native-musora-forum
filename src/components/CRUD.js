/**
 * PROPS: isDark, appColor, action, type, posts, title, forumId, threadId
 * action: can be 'create', 'edit' => used to display header title and button
 * type: can be 'thread', 'post' => used to display header type on header and on delete button and to display title input besides description field
 * posts: use posts[0] for editing a post's text or use it like posts for reply and multiquote displaying
 * title: thread title that can be edited
 * forumId: for thread creation
 * threadId: for thread update
 */

import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { SafeAreaView } from 'react-native-safe-area-context';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

import { InsertLinkModal } from '../commons/InsertLinkModal';
import HTMLRenderer from '../commons/HTMLRenderer';
import CustomModal from '../commons/CustomModal';

import {
  connection,
  createPost,
  createThread,
  deletePost,
  deleteThread,
  editPost,
  updateThread,
} from '../services/forum.service';

import { updateThreads, updatePosts } from '../redux/ThreadActions';

let styles;

class CRUD extends React.Component {
  state = { loading: false };

  constructor(props) {
    super(props);
    let { isDark, appColor } = props;
    styles = setStyles(isDark, appColor);
    this.richHTML = this.props.route.params.action === 'edit' ? props.post?.content : '';
  }

  onInsertLink = type => this.linkModal?.toggle(type);

  componentDidMount() {
    this.keyboardDidChangeFrameEListener = Keyboard.addListener('keyboardDidChangeFrame', () =>
      this.scrollRef?.scrollToEnd()
    );
  }

  componentWillUnmount() {
    this.keyboardDidChangeFrameEListener.remove();
  }

  onLinkDone = (title, url, type) => {
    if (url) {
      if (type === 'Link') {
        this.richTextRef?.insertLink(title, url);
      } else if (type === 'Image') {
        this.richTextRef?.insertImage(url);
      } else {
        if (url.includes('<iframe')) this.richTextRef?.insertHTML(url);
        else if (url.includes('youtube.com'))
          this.richTextRef?.insertHTML(
            `<p><iframe src="https://www.youtube.com/embed/${url.slice(
              url.indexOf('watch?v=') + 8,
              url.length
            )}" width="560" height="314" allowfullscreen="allowfullscreen"></iframe></p>`
          );
        else if (url.includes('youtu'))
          this.richTextRef?.insertHTML(
            `<p><iframe src="https://www.youtube.com/embed/${url.slice(
              url.lastIndexOf('/') + 1,
              url.length
            )}" width="560" height="314" allowfullscreen="allowfullscreen"></iframe></p>`
          );
        else if (url.includes('vimeo.com'))
          this.richTextRef?.insertHTML(
            `<p><iframe src="https://player.vimeo.com/video/${url.slice(
              url.indexOf('.com/') + 5,
              url.length
            )}" width="425" height="350" allowfullscreen="allowfullscreen"></iframe></p>`
          );
        else
          this.richTextRef?.insertHTML(
            `<video controls="controls" width="300" height="150"><source src=${url} /></video>`
          );
      }
    }
  };

  save = async () => {
    if (!connection(true)) return;
    Keyboard.dismiss();
    this.richTextRef?.blurContentEditor();
    this.setState({ loading: true });
    const { action, type, forumId, threadId, postId, quotes, onPostCreated } =
      this.props.route.params;
    let response;
    let html = this.richHTML?.replace('<div><br></div>', '')
    if (html === '') {
      this.richHTML = html
    }
    try {
      if (type === 'thread') {
        if (this.title) {
          if (action === 'create') {
            if (!this.richHTML) throw Error('First post cannot be empty.')
            response = await createThread(this.title, this.richHTML, forumId).request;
          } else {
            this.props.updateThreads({ ...this.props.thread, title: this.title });
            response = await updateThread(threadId, { title: this.title });
          }
        } else throw Error('Title cannot be empty.')
      } else {
        if (this.richHTML) {
          let content = `${quotes?.length > 0 ? quotes
            ?.map(({ content }) => content)
            .join('<br>')
            .concat('<br>') : ''}${this?.richHTML}`;

          if (action === 'create') {
            response = await createPost({ content, thread_id: threadId, parent_ids: quotes.map(q => q?.id) });
          } else {
            this.props.updatePosts({ ...this.props.post, content });
            response = await editPost(postId, content);
          }
        } else throw Error('Post cannot be empty.')
      }

      if (response.response) throw Error(response.response?.data?.errors?.map(m => m?.detail).join(' ') || response?.response?.data?.message)
      else {
        onPostCreated?.(response.id);
        if (type === 'thread' && action === 'create') {
          this.props.navigation.pop();
          this.props.navigation.navigate('Thread', { threadId: response?.data?.id });
        } else this.props.navigation.goBack()
      }
    }
    catch (e) {
      this.customModal.toggle('Something went wrong', e.message || 'Please try again later.');
      this.setState({ loading: false });
    }
  };

  onDelete = async () => {
    if (!connection(true)) return;
    Keyboard.dismiss();
    this.setState({ loading: true });
    const { type, threadId, postId, onDelete } = this.props.route.params;
    if (type === 'thread') {
      await deleteThread(threadId);
      this.props.navigation.pop();
    }
    else await deletePost(postId);
    onDelete?.(postId);
    this.props.navigation.goBack();
  };

  render() {
    let { loading } = this.state;
    const {
      route: {
        params: { action, type, quotes, threadTitle },
      },
      post,
      thread,
      isDark,
      appColor,
    } = this.props;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {action === 'create'
              ? quotes?.length === 1
                ? 'Reply'
                : quotes?.length > 1
                  ? 'MultiQuote'
                  : `Create ${type}`
              : `Edit ${type}`}
          </Text>
          <TouchableOpacity onPress={this.save} disabled={loading}>
            <Text style={styles.actionBtn}>
              {action === 'create' ? (quotes?.length ? 'Reply' : 'Create') : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={r => (this.scrollRef = r)}
            style={{ flex: 1, margin: 15 }}
            keyboardShouldPersistTaps='handled'
            contentInsetAdjustmentBehavior='never'
            showsVerticalScrollIndicator={false}
          >
            {quotes?.map((post, index) => (
              <View style={{ marginBottom: 10 }} key={index}>
                <HTMLRenderer
                  appColor={appColor}
                  html={post.content}
                  tagsStyles={{
                    div: { color: isDark ? 'white' : '#00101D' },
                    blockquote: { padding: 10, borderRadius: 5 },
                  }}
                  olItemStyle={{ color: isDark ? 'white' : '#00101D' }}
                  ulItemStyle={{ color: isDark ? 'white' : '#00101D' }}
                  classesStyles={{
                    'blockquote-even': {
                      backgroundColor: isDark ? '#081825' : 'white',
                    },
                    'blockquote-odd': {
                      backgroundColor: isDark ? '#002039' : '#E1E6EB',
                    },
                    shadow: {
                      elevation: 5,
                      shadowColor: 'black',
                      shadowOffset: { height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 2,
                      borderRadius: 5,
                    },
                  }}
                />
              </View>
            ))}
            {type === 'thread' && (
              <TextInput
                style={styles.titleInput}
                placeholderTextColor={isDark ? '#445F74' : 'grey'}
                placeholder='Title'
                defaultValue={thread?.title || threadTitle || ''}
                onChangeText={txt => (this.title = txt)}
              />
            )}
            {!(type === 'thread' && action === 'edit') && (
              <RichToolbar
                getEditor={() => this.richTextRef}
                style={styles.richBar}
                flatContainerStyle={{ paddingHorizontal: 12 }}
                selectedIconTint={'#2095F2'}
                disabledIconTint={'#bfbfbf'}
                onPressAddImage={() => this.onInsertLink('Image')}
                onInsertLink={() => this.onInsertLink('Link')}
                insertVideo={() => this.onInsertLink('Video')}
                actions={[
                  actions.setBold,
                  actions.setItalic,
                  actions.setUnderline,
                  actions.insertBulletsList,
                  actions.insertOrderedList,
                  actions.insertLink,
                  actions.insertImage,
                  actions.insertVideo,
                ]}
              />
            )}
            {!(type === 'thread' && action === 'edit') && (
              <RichEditor
                editorInitializedCallback={() =>
                  this.richTextRef?.webviewBridge?.injectJavaScript(`
                     setTimeout(() => {
                       let link = document.createElement("link");
                       link.type = "text/css";
                       link.rel = "stylesheet";
                       link.href = "https://fonts.googleapis.com/css?family=Open+Sans";
                       document.head.appendChild(link);
                     }, 10)
                   `)
                }
                pasteAsPlainText={true}
                useContainer={false}
                editorStyle={{
                  ...styles.editorStyle,
                  contentCSSText: 'font-family: Open Sans; font-size: 10px;',
                  placeholderColor: isDark ? '#445F74' : 'grey',
                }}
                ref={r => (this.richTextRef = r)}
                style={styles.richEditor}
                placeholder={'Write something'}
                initialContentHTML={this.richHTML}
                onChange={html => (this.richHTML = html)}
              />
            )}
          </ScrollView>
          {action === 'edit' && (
            <TouchableOpacity style={styles.deleteBtn} onPress={this.onDelete}>
              <Text style={styles.deleteBtnText}>DELETE {type}</Text>
            </TouchableOpacity>
          )}
          {loading && (
            <ActivityIndicator
              size='large'
              color={appColor}
              animating={true}
              style={styles.activityIndicator}
            />
          )}
        </View>
        <InsertLinkModal
          appColor={appColor}
          isDark={isDark}
          onClose={this.onLinkDone}
          ref={ref => (this.linkModal = ref)}
        />
        <CustomModal ref={ref => (this.customModal = ref)} isDark={isDark} appColor={appColor} />
      </SafeAreaView>
    );
  }
}

let setStyles = (isDark, appColor) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    cancelBtn: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 14,
      color: isDark ? 'white' : '#00101D',
    },
    actionBtn: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 14,
      color: appColor,
    },
    headerTitle: {
      textTransform: 'capitalize',
      fontFamily: 'OpenSans-Bold',
      fontSize: 16,
      color: isDark ? 'white' : '#000000',
    },
    container: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : '#F7F9FC',
    },
    richBar: {
      backgroundColor: '#001424',
      borderColor: isDark ? '#002039' : '#E1E6EB',
      borderWidth: 4,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    editorStyle: {
      backgroundColor: isDark ? '#002039' : '#E1E6EB',
      color: isDark ? 'white' : 'black',
    },
    deleteBtn: {
      backgroundColor: appColor,
      borderRadius: 99,
      justifyContent: 'center',
      alignSelf: 'center',
      padding: 20,
      paddingHorizontal: 80,
      marginBottom: 15,
    },
    deleteBtnText: {
      textAlign: 'center',
      fontFamily: 'BebasNeuePro-Bold',
      fontSize: 15,
      color: 'white',
      textTransform: 'uppercase',
    },
    titleInput: {
      marginBottom: 15,
      backgroundColor: isDark ? '#002039' : '#E1E6EB',
      borderRadius: 5,
      color: isDark ? 'white' : 'black',
      padding: 15,
      paddingHorizontal: 10,
      fontFamily: 'OpenSans',
      fontSize: 12,
    },
    richEditor: {
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      height: 200,
    },
    activityIndicator: {
      backgroundColor: 'rgba(0,0,0,.5)',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  });
const mapStateToProps = (
  { threads, themeState },
  {
    route: {
      params: { threadId, postId, appColor, isDark },
    },
  }
) => {
  let post = {
    ...threads.posts?.[postId],
    content: threads.posts?.[postId].content.split('</blockquote>').slice(0, -1).join('</blockquote>') ? threads.posts?.[postId]?.content
      .split('</blockquote>')
      .reverse()[0]
      .replace(/^<br>/, '') : threads.posts?.[postId]?.content,
  };
  let thread =
    threads.forums?.[threadId] ||
    threads.all?.[threadId] ||
    threads.followed?.[threadId] ||
    threads.search?.[threadId];
  let dark = themeState ? themeState.theme === 'dark' : isDark;
  if (setStyles.isDark !== dark) styles = setStyles(dark, appColor);
  return { thread, post, isDark: dark, appColor };
};
const mapDispatchToProps = dispatch => bindActionCreators({ updateThreads, updatePosts }, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(CRUD);
