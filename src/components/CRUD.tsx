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
  StyleProp,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
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
import { selectPost, selectThread } from '../redux/threads/ThreadSelectors';
import type { ForumRootStackParamList, ICRUDParams, IForumParams } from '../entity/IRouteParams';
import type { IPost } from '../entity/IForum';
import InsertImageModal from '../commons/modals/InsertImageModal';

const CRUD: FunctionComponent = () => {
  const { params }: RouteProp<{ params: ICRUDParams & IForumParams }, 'params'> = useRoute();
  const {
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
    onDelete: onDeleteProp,
  } = params;
  const styles = setStyles(isDark, appColor);
  const dispatch = useDispatch();
  const { navigate, goBack, pop } = useNavigation<StackNavigationProp<ForumRootStackParamList>>();

  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [richHTML, setRichHTML] = useState<string | undefined>('');
  const scrollRef = useRef<ScrollView | null>(null);
  const richTextRef = useRef<RichEditor>(null);
  const linkModalRef = useRef<React.ElementRef<typeof InsertLinkModal>>(null);
  const imageModalRef = useRef<React.ElementRef<typeof InsertImageModal>>(null);
  const customModalRef = useRef<React.ElementRef<typeof CustomModal>>(null);

  const post = useAppSelector(state => selectPost(state, postId));
  const thread = useAppSelector(state =>
    selectThread(state, threadId, type === 'thread' ? 'Thread' : '')
  );

  useEffect(() => {
    const keyboardDidChangeFrameEListener = Keyboard.addListener('keyboardDidChangeFrame', () => {
      scrollRef.current?.scrollToEnd();
    });
    return () => {
      keyboardDidChangeFrameEListener.remove();
    };
  }, []);

  useEffect(() => {
    setRichHTML(action === 'edit' ? post?.content : '');
  }, [action, post?.content]);

  const onInsertLink = (insertType: 'Image' | 'Link' | 'Video'): void =>
    linkModalRef.current?.toggle(insertType);

  const onInsertImage = (): void => imageModalRef.current?.toggle();

  const onLinkDone = useCallback(
    (titleValue: string, urlValue: string, typeValue: string): void => {
      if (urlValue) {
        if (typeValue === 'Link') {
          richTextRef.current?.insertLink(titleValue, urlValue);
        } else if (typeValue === 'Image') {
          if (richHTML === '') {
            richTextRef.current?.insertHTML(`<div><br></div>`);
          }
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
    },
    [richHTML]
  );

  const save = useCallback(async (): Promise<void> => {
    if (!connection(true)) {
      return;
    }
    try {
      Keyboard.dismiss();
      richTextRef.current?.blurContentEditor();
      setLoading(true);
      let response;

      const htmlValue = richHTML?.replace(/<div><br><\/div>/g, '') === '' ? '' : richHTML;
      if (type === 'thread') {
        if (title) {
          if (action === 'create' && forumId) {
            if (!htmlValue) {
              throw Error('First post cannot be empty.');
            }
            response = await createThread(title, htmlValue, forumId).request;
          } else if (threadId) {
            if (thread) {
              dispatch(updateThreads({ ...thread, title: title }));
            }
            response = await updateThread(threadId, { title: title }).request;
          }
        } else {
          throw Error('Title cannot be empty.');
        }
      } else {
        if (htmlValue) {
          const content = `${
            quotes && quotes?.length > 0
              ? quotes
                  ?.map(({ content: mapContent }) => mapContent)
                  .join('<br>')
                  .concat('<br>')
              : ''
          }${htmlValue}`;

          if (action === 'create' && threadId) {
            response = await createPost({
              content,
              thread_id: threadId,
              parent_ids: (quotes as IPost[])?.map(q => q?.id),
            }).request;
          } else if (postId) {
            if (post) {
              dispatch(updatePosts({ ...post, content }));
            }
            response = await editPost(postId, content).request;
          }
        } else {
          throw Error('Post cannot be empty.');
        }
      }

      setLoading(false);
      onPostCreated?.(response?.data?.id);
      if (type === 'thread' && action === 'create') {
        pop();
        navigate('Thread', { threadId: response?.data?.id });
      } else {
        goBack();
      }
    } catch (e: any) {
      customModalRef.current?.toggle(
        'Something went wrong',
        e?.errors?.map((m: { detail: any }) => m?.detail).join(' ') ||
          e?.message ||
          'Please try again later.'
      );
      setLoading(false);
    }
  }, [
    richHTML,
    title,
    action,
    dispatch,
    forumId,
    goBack,
    navigate,
    onPostCreated,
    pop,
    post,
    postId,
    quotes,
    thread,
    threadId,
    type,
  ]);

  const onDelete = useCallback(async () => {
    if (!connection(true)) {
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    if (type === 'thread' && threadId) {
      await deleteThread(threadId).request.finally(() => setLoading(false));
      pop(2);
    } else if (postId) {
      await deletePost(postId).request.finally(() => {
        setLoading(false);
        if (onDeleteProp) {
          onDeleteProp?.(postId);
        } else {
          goBack();
        }
      });
    }
  }, [goBack, pop, postId, threadId, type, onDeleteProp]);

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
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.cancelBtn}>{'Cancel'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {action === 'create'
            ? quotes?.length === 1
              ? 'Reply'
              : quotes?.length && quotes?.length > 1
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
      <View style={styles.editorContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          keyboardShouldPersistTaps='handled'
          contentInsetAdjustmentBehavior='never'
          showsVerticalScrollIndicator={false}
        >
          {quotes &&
            quotes?.length > 0 &&
            quotes?.map((p, index) => (
              <View style={styles.htmlContainer} key={index}>
                <HTMLRenderer
                  html={p.content}
                  tagsStyles={{
                    div: { color: isDark ? 'white' : '#00101D' },
                    blockquote: { padding: 10, borderRadius: 5 },
                  }}
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
              editor={richTextRef}
              style={styles.richBar}
              flatContainerStyle={{ paddingHorizontal: 12 }}
              selectedIconTint={'#2095F2'}
              disabledIconTint={'#bfbfbf'}
              iconTint={isDark ? '#80A0B9' : '#000000'}
              onPressAddImage={onInsertImage}
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
                [actions.setBold]: ({ tintColor }: { tintColor: string }) => (
                  <>{setBoldSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.setItalic]: ({ tintColor }: { tintColor: string }) => (
                  <>{setItalicSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.setUnderline]: ({ tintColor }: { tintColor: string }) => (
                  <>{setUnderlineSvg({ width: 25, height: 23, fill: tintColor })}</>
                ),
                [actions.insertBulletsList]: ({ tintColor }: { tintColor: string }) => (
                  <>{insertBulletsListSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.insertOrderedList]: ({ tintColor }: { tintColor: string }) => (
                  <>{insertOrderedListSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.insertLink]: ({ tintColor }: { tintColor: string }) => (
                  <>{insertLinkSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.insertImage]: ({ tintColor }: { tintColor: string }) => (
                  <>{insertImageSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
                [actions.insertVideo]: ({ tintColor }: { tintColor: string }) => (
                  <>{insertVideoSvg({ width: 25, height: 25, fill: tintColor })}</>
                ),
              }}
            />
          )}
          {!(type === 'thread' && action === 'edit') && (
            <RichEditor
              editorInitializedCallback={() =>
                richTextRef.current?.injectJavascript(`
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
            <Text style={styles.deleteBtnText}>{`DELETE ${type}`}</Text>
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
      <InsertImageModal
        appColor={appColor}
        isDark={isDark}
        onClose={onLinkDone}
        ref={imageModalRef}
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
    editorContainer: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
      margin: 15,
    },
    htmlContainer: {
      marginBottom: 10,
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
