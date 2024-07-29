import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, StyleProp } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import AccessLevelAvatar from './AccessLevelAvatar';
import HTMLRenderer from './HTMLRenderer';
import { like, likeOn, menuHSvg, replies } from '../assets/svgs';
import { likePost, disLikePost, connection } from '../services/forum.service';
import { updatePosts } from '../redux/threads/ThreadActions';
import { IS_TABLET } from '../services/helpers';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { IAuthor, IPost, IUser } from '../entity/IForum';
import { useAppSelector } from '../redux/Store';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ForumRootStackParamList } from '../entity/IRouteParams';

interface IPostProps {
  id: number;
  appColor: string;
  index: number;
  isDark: boolean;
  locked: boolean;
  user?: IUser;
  selected: boolean;
  toggleMenu: (post: IPost, type: 'user' | 'post') => void;
  onPostCreated: (postId?: number) => void;
}

const Post: FunctionComponent<IPostProps> = props => {
  const { id, appColor, index, isDark, locked, user, selected, toggleMenu, onPostCreated } = props;
  const { navigate } = useNavigation<StackNavigationProp<ForumRootStackParamList>>();
  const dispatch = useDispatch();
  const styles = setStyles(isDark, appColor);
  const signShown = useAppSelector(state => state.threadsState?.signShown);
  const post = useAppSelector(state => state?.threadsState?.posts?.[id]);
  const [isLiked, setIsLiked] = useState(post?.is_liked_by_viewer);
  const [likeCount, setLikeCount] = useState(post?.like_count || 0);

  const baseColor = isDark ? '#081825' : '#FFFFFF';
  const selectedColor = isDark ? '#002039' : '#E1E6EB';

  useEffect(() => {
    setIsLiked(post?.is_liked_by_viewer);
    setLikeCount(post?.like_count || 0);
  }, [post?.is_liked_by_viewer, post?.like_count]);

  const toggleLike = useCallback(() => {
    if (!connection(true)) {
      return;
    }
    if (post) {
      if (isLiked) {
        setLikeCount(likeCount - 1);
        disLikePost(post?.id);
      } else {
        setLikeCount(likeCount + 1);
        likePost(post?.id);
      }
      setIsLiked(!isLiked);
      dispatch(
        updatePosts({
          ...post,
          is_liked_by_viewer: !isLiked,
          like_count: isLiked ? likeCount - 1 : likeCount + 1,
        })
      );
    }
  }, [isLiked, likeCount, post, dispatch]);

  const onNavigateToCoach = useCallback(
    (coachId: number) => {
      navigate('CoachOverview', { coachId });
    },
    [navigate]
  );

  const reply = useCallback(() => {
    if (post) {
      navigate('CRUD', {
        type: 'post',
        action: 'create',
        threadId: post?.thread_id,
        onPostCreated,
        quotes: [
          {
            ...post,
            content: `<blockquote><b>${post?.author?.display_name}</b>:<br>${post?.content}</blockquote>`,
          },
        ],
      });
    }
  }, [navigate, onPostCreated, post]);

  const renderer = useMemo(
    () => (
      <HTMLRenderer
        html={post?.content || ''}
        tagsStyles={{
          div: {
            color: isDark ? 'white' : '#00101D',
            fontFamily: 'OpenSans',
            fontSize: 14,
          },
          blockquote: {
            padding: 10,
            borderRadius: 5,
            fontFamily: 'OpenSans',
          },
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
            backgroundColor: baseColor,
          },
        }}
      />
    ),
    [post?.content, isDark, baseColor]
  );

  return (
    <>
      {!!post && (
        <View
          style={{
            marginBottom: 40,
            backgroundColor: selected ? selectedColor : baseColor,
          }}
          testID={'PostCard'}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>#{index}</Text>
            <Text style={styles.headerText}>{post?.published_on_formatted}</Text>
          </View>
          <View style={styles.header} testID={'PostTitle'}>
            <View style={styles.userDetails}>
              <AccessLevelAvatar
                author={post?.author || ({} as IAuthor)}
                height={45}
                appColor={appColor}
                isDark={isDark}
                tagHeight={4}
                showUserInfo={true}
                onNavigateToCoach={onNavigateToCoach}
                onMenuPress={() => post && toggleMenu(post, 'user')}
              />
              <View style={{ marginLeft: 5 }}>
                <Text style={styles.name} numberOfLines={2} ellipsizeMode='tail'>
                  {post?.author?.display_name}
                </Text>
                <Text style={styles.xp}>
                  {post?.author?.total_posts} Posts - {post?.author?.xp_rank} - Level{' '}
                  {post?.author?.level_rank}
                </Text>
              </View>
            </View>
          </View>

          {post?.content && <View style={styles.htmlRendererCont}>{renderer}</View>}

          <View style={styles.likeContainer}>
            <TouchableOpacity
              disabled={user?.id === post?.author_id}
              onPress={toggleLike}
              disallowInterruption={true}
              style={styles.interactionBtn}
            >
              {(isLiked ? likeOn : like)({
                height: 15,
                width: 15,
                fill: appColor,
              })}
              {likeCount > 0 && <Text style={styles.likesNoText}>{likeCount}</Text>}
            </TouchableOpacity>
            {!locked && (
              <TouchableOpacity
                onPress={reply}
                disallowInterruption={true}
                style={styles.interactionBtn}
              >
                {replies({
                  height: 15,
                  width: 15,
                  fill: appColor,
                })}
                <Text style={styles.likesNoText}>{'REPLY'}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.menuContainer}>
              <TouchableOpacity
                onPress={() => post && toggleMenu(post, 'post')}
                disallowInterruption={true}
              >
                {menuHSvg({
                  width: 23,
                  height: 20,
                  fill: isDark ? 'white' : 'black',
                })}
              </TouchableOpacity>
            </View>
          </View>
          {signShown && !!post?.author?.signature && (
            <View style={styles.signatureContainer}>
              <HTMLRenderer html={post?.author?.signature} tagsStyles={{ div: styles.signature }} />
            </View>
          )}
        </View>
      )}
    </>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 10,
      paddingBottom: 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    userDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    xp: {
      fontSize: 16,
      fontFamily: 'BebasNeue-Regular',
      color: isDark ? '#FFFFFF' : '#00101D',
    },
    htmlRendererCont: {
      paddingHorizontal: 15,
    },
    headerText: {
      fontSize: IS_TABLET ? 16 : 14,
      fontFamily: 'OpenSans',
      color: isDark ? '#9EC0DC' : '#3F3F46',
    },
    name: {
      fontSize: IS_TABLET ? 18 : 16,
      fontFamily: 'OpenSans-Bold',
      color: isDark ? '#FFFFFF' : '#00101D',
    },
    post: {
      fontSize: 14,
      fontFamily: 'OpenSans',
      color: isDark ? '#FFFFFF' : '#00101D',
    },
    likeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    likesNoContainer: {
      padding: 5,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: isDark ? '#001f38' : '#97AABE',
    },
    likesNoText: {
      fontSize: 16,
      fontFamily: 'BebasNeuePro-Bold',
      color: isDark ? '#FFFFFF' : '#00101D',
      paddingLeft: 5,
    },
    menuContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      flexDirection: 'row',
      padding: 15,
    },
    replyText: {
      color: isDark ? '#445F74' : '#00101D',
      fontSize: 10,
      fontFamily: 'BebasNeuePro-Bold',
    },
    signatureContainer: {
      borderTopColor: isDark ? '#445F74' : 'lightgrey',
      borderTopWidth: 1,
      padding: 15,
      paddingVertical: 5,
    },
    signature: {
      color: isDark ? '#9EC0DC' : '#00101D',
      fontFamily: 'OpenSans',
      fontSize: IS_TABLET ? 16 : 14,
    },
    triangle: {
      width: 0,
      height: 0,
      borderTopWidth: 5,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderColor: 'transparent',
      borderTopColor: appColor,
    },
    reportModalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    reportModalContainer: {
      backgroundColor: isDark ? '#002039' : '#E1E6EB',
      borderRadius: 10,
      maxWidth: 300,
    },
    reportTitle: {
      padding: 15,
      paddingBottom: 0,
      fontFamily: 'OpenSans-Bold',
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center',
    },
    reportMessage: {
      padding: 15,
      fontFamily: 'OpenSans',
      fontSize: 12,
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center',
    },
    reportBtnsContainer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#545458A6',
    },
    reportBtnText: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 12,
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center',
      paddingVertical: 15,
    },
    interactionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      paddingLeft: 7.5,
    },
  });

export default Post;
