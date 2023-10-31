import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  TextInput,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  BackHandler,
  StyleProp,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  setBoldSvg,
  setItalicSvg,
  setUnderlineSvg,
  insertBulletsListSvg,
  insertOrderedListSvg,
  insertLinkSvg,
  insertImageSvg,
  insertVideoSvg,
} from '../assets/svgs';
import CustomModal from '../commons/CustomModal';
import HTMLRenderer from '../commons/HTMLRenderer';
import { updateThreads, updatePosts } from '../redux/threads/ThreadActions';
import {
  connection,
  createThread,
  updateThread,
  createPost,
  editPost,
  deleteThread,
  deletePost,
} from '../services/forum.service';
import InsertLinkModal from '../commons/InsertLinkModal';
import { useAppSelector } from '../redux/Store';
import type { ForumRootStackParamList } from '../ForumRouter';

interface ICRUDProps {
  route: {
    params: {
      isDark: boolean;
      appColor: string;
      action: 'create' | 'edit';
      type: 'thread' | 'post';
      forumId?: number;
      threadId?: number;
      postId?: number;
      quotes?: Array<{ id: number; content: string }>;
      onPostCreated?: (postId: number) => void;
    };
  };
}

const CRUD: FunctionComponent<ICRUDProps> = props => {
  const {
    route: {
      params: {
        isDark,
        appColor,
        action,
        type,
        quotes,
        threadTitle,
        bottomPadding,
        threadId,
        postId,
        forumId,
        onPostCreated,
      },
    },
  } = props;
  const styles = setStyles(isDark, appColor);
  const dispatch = useDispatch();
  const { navigate, goBack, pop } = useNavigation<StackNavigationProp<ForumRootStackParamList>>();

  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [richHTML, setRichHTML] = useState<string | undefined>();
  const scrollRef = useRef<ScrollView | null>(null);
  const richTextRef = useRef();
  const linkModalRef = useRef<React.ElementRef<typeof InsertLinkModal>>(null);
  const customModalRef = useRef<React.ElementRef<typeof CustomModal>>(null);

  const post = useAppSelector(({ threadsState }) => ({
    ...threadsState.posts?.[postId],
    content: threadsState.posts?.[postId]?.content
      ?.split('</blockquote>')
      .slice(0, -1)
      .join('</blockquote>')
      ? threadsState.posts?.[postId]?.content
          .split('</blockquote>')
          .reverse()[0]
          .replace(/^<br>/, '')
      : threadsState.posts?.[postId]?.content,
  }));

  const thread = useAppSelector(
    ({ threadsState }) =>
      threadsState.forums?.[threadId] ||
      threadsState.all?.[threadId] ||
      threadsState.followed?.[threadId] ||
      threadsState.search?.[threadId]
  );

  useEffect(() => {
    const keyboardDidChangeFrameEListener = Keyboard.addListener('keyboardDidChangeFrame', () => {
      scrollRef.current?.scrollToEnd();
    });

    const keyboardBackPressed = (): boolean => {
      goBack();
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', keyboardBackPressed);

    return () => {
      keyboardDidChangeFrameEListener.remove();
      BackHandler.removeEventListener('hardwareBackPress', keyboardBackPressed);
    };
  }, [goBack]);

  useEffect(() => {
    setRichHTML(action === 'edit' ? post?.content : '');
  }, [action, post?.content]);

  const onInsertLink = useCallback(
    (insertType: 'Image' | 'Link' | 'Video') => linkModalRef.current?.toggle(insertType),
    []
  );

  const onLinkDone = useCallback((titleValue: string, urlValue: string, typeValue: string) => {
    if (urlValue) {
      if (typeValue === 'Link') {
        richTextRef.current?.insertLink(titleValue, urlValue);
      } else if (typeValue === 'Image') {
        richTextRef.current?.insertImage(urlValue);
      } else {
        if (urlValue.includes('<iframe')) {
          richTextRef.current?.insertHTML(urlValue);
        } else if (urlValue.includes('youtube.com')) {
          richTextRef.current?.insertHTML(
            `<p><iframe src="https://www.youtube.com/embed/${urlValue.slice(
              urlValue.indexOf('watch?v=') + 8,
              urlValue.length
            )}" width="560" height="314" allowfullscreen="allowfullscreen"></iframe></p>`
          );
        } else if (urlValue.includes('youtu')) {
          richTextRef.current?.insertHTML(
            `<p><iframe src="https://www.youtube.com/embed/${urlValue.slice(
              urlValue.lastIndexOf('/') + 1,
              urlValue.length
            )}" width="560" height="314" allowfullscreen="allowfullscreen"></iframe></p>`
          );
        } else if (urlValue.includes('vimeo.com')) {
          richTextRef.current?.insertHTML(
            `<p><iframe src="https://player.vimeo.com/video/${urlValue.slice(
              urlValue.indexOf('.com/') + 5,
              urlValue.length
            )}" width="425" height="350" allowfullscreen="allowfullscreen"></iframe></p>`
          );
        } else {
          richTextRef.current?.insertHTML(
            `<video controls="controls" width="300" height="150"><source src=${urlValue} /></video>`
          );
        }
      }
    }
  }, []);

  const save = async (): Promise<void> => {
    if (!connection(true)) {
      return;
    }
    Keyboard.dismiss();
    richTextRef.current?.blurContentEditor();
    setLoading(true);
    let response;
    const html = richHTML?.replace('<div><br></div>', '');
    if (html === '') {
      setRichHTML(html);
    }
    try {
      if (type === 'thread') {
        if (title) {
          if (action === 'create') {
            if (!richHTML) {
              throw Error('First post cannot be empty.');
            }
            response = await createThread(title, richHTML, forumId).request;
          } else {
            dispatch(updateThreads({ ...thread, title: title }));
            response = await updateThread(threadId, { title: title });
          }
        } else {
          throw Error('Title cannot be empty.');
        }
      } else {
        if (richHTML) {
          const content = `${
            quotes && quotes?.length > 0
              ? quotes
                  ?.map(({ content: mapContent }) => mapContent)
                  .join('<br>')
                  .concat('<br>')
              : ''
          }${richHTML}`;

          if (action === 'create') {
            response = await createPost({
              content,
              thread_id: threadId,
              parent_ids: quotes?.map(q => q?.id),
            });
          } else {
            dispatch(updatePosts({ ...post, content }));
            response = await editPost(postId, content);
          }
        } else {
          throw Error('Post cannot be empty.');
        }
      }

      if (response.response) {
        throw Error(
          response.response?.data?.errors?.map((m: { detail: any }) => m?.detail).join(' ') ||
            response?.response?.data?.message
        );
      } else {
        onPostCreated?.(response.id);
        if (type === 'thread' && action === 'create') {
          pop();
          navigate('Thread', { threadId: response?.data?.id });
        } else {
          goBack();
        }
      }
    } catch (e) {
      customModalRef.current?.toggle(
        'Something went wrong',
        e?.message || 'Please try again later.'
      );
      setLoading(false);
    }
  };

  const onDelete = useCallback(async () => {
    if (!connection(true)) {
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    if (type === 'thread') {
      await deleteThread(threadId);
      pop();
    } else {
      await deletePost(postId);
    }
    onDelete?.(postId);
    goBack();
  }, [goBack, pop, postId, threadId, type]);

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.container, { paddingBottom: bottomPadding }]}
    >
      <SafeAreaInsetsContext.Consumer>
        {insets => (
          <View style={{ backgroundColor: isDark ? '#081825' : 'white', height: insets?.top }}>
            <StatusBar
              backgroundColor={isDark ? '#081825' : 'white'}
              barStyle={isDark ? 'light-content' : 'dark-content'}
            />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()}>
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
        <TouchableOpacity onPress={save} disabled={loading}>
          <Text style={styles.actionBtn}>
            {action === 'create' ? (quotes?.length ? 'Reply' : 'Create') : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, margin: 15 }}
          keyboardShouldPersistTaps='handled'
          contentInsetAdjustmentBehavior='never'
          showsVerticalScrollIndicator={false}
        >
          {quotes?.map((p, index) => (
            <View style={{ marginBottom: 10 }} key={index}>
              <HTMLRenderer
                appColor={appColor}
                html={p.content}
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
            <>
              <Text style={styles.label}>{'Title'}</Text>
              <TextInput
                style={styles.titleInput}
                placeholderTextColor={isDark ? '#9EC0DC' : 'black'}
                placeholder='Title'
                defaultValue={thread?.title || threadTitle || ''}
                onChangeText={txt => setTitle(txt)}
              />
            </>
          )}
          {!(type === 'thread' && action === 'edit') && (
            <RichToolbar
              getEditor={richTextRef}
              style={styles.richBar}
              flatContainerStyle={{ paddingHorizontal: 12 }}
              selectedIconTint={'#2095F2'}
              disabledIconTint={'#bfbfbf'}
              iconTint={isDark ? '#80A0B9' : '#000000'}
              onPressAddImage={() => onInsertLink('Image')}
              onInsertLink={() => onInsertLink('Link')}
              insertVideo={() => onInsertLink('Video')}
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
              iconMap={{
                [actions.setBold]: ({ tintColor }) => (
                  <>{setBoldSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.setItalic]: ({ tintColor }) => (
                  <>{setItalicSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.setUnderline]: ({ tintColor }) => (
                  <>{setUnderlineSvg({ width: 25, height: 23, fill: tintColor })}</>
                ),
                [actions.insertBulletsList]: ({ tintColor }) => (
                  <>{insertBulletsListSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.insertOrderedList]: ({ tintColor }) => (
                  <>{insertOrderedListSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.insertLink]: ({ tintColor }) => (
                  <>{insertLinkSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.insertImage]: ({ tintColor }) => (
                  <>{insertImageSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.insertVideo]: ({ tintColor }) => (
                  <>{insertVideoSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
              }}
            />
          )}
          {!(type === 'thread' && action === 'edit') && (
            <RichEditor
              editorInitializedCallback={() =>
                richTextRef.current?.webviewBridge?.injectJavaScript(`
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
                placeholderColor: isDark ? '#9EC0DC' : 'black',
              }}
              ref={richTextRef}
              style={styles.richEditor}
              containerStyle={styles.editorContainerStyle}
              placeholder={'Write something...'}
              initialContentHTML={richHTML}
              onChange={html => setRichHTML(html)}
            />
          )}
        </ScrollView>
        {action === 'edit' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
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
        onClose={onLinkDone}
        ref={linkModalRef}
      />
      <CustomModal ref={customModalRef} isDark={isDark} appColor={appColor} />
    </SafeAreaView>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: isDark ? '#081825' : 'white',
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
      backgroundColor: isDark ? '#002039' : '#E6E7E9',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? '#445F74' : '#D1D5DB',
    },
    editorStyle: {
      backgroundColor: isDark ? '#00101D' : '#FFFFFF',
      color: isDark ? '#9EC0DC' : 'black',
    },
    deleteBtn: {
      borderRadius: 30,
      borderWidth: 2,
      borderColor: isDark ? '#FFFFFF' : '#000000',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 15,
      height: 42,
      width: 198,
    },
    deleteBtnText: {
      textAlign: 'center',
      fontFamily: 'BebasNeuePro-Bold',
      fontSize: 18,
      color: isDark ? '#FFFFFF' : '#000000',
      textTransform: 'uppercase',
    },
    titleInput: {
      marginBottom: 15,
      backgroundColor: isDark ? '#00101D' : '#FFFFFF',
      borderRadius: 60,
      borderColor: isDark ? '#445F74' : '#D1D5DB',
      borderWidth: 1,
      color: isDark ? '#9EC0DC' : 'black',
      paddingHorizontal: 12,
      fontFamily: 'OpenSans',
      fontSize: 12,
      height: 42,
    },
    editorContainerStyle: {
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: isDark ? '#445F74' : '#D1D5DB',
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
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
    label: {
      fontFamily: 'OpenSans',
      fontSize: 14,
      color: isDark ? '#9EC0DC' : 'black',
      marginBottom: 5,
      marginLeft: 10,
    },
  });

export default CRUD;
