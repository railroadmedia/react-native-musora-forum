import React, { FunctionComponent } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp } from 'react-native';
import { IS_TABLET } from '../ForumRouter';
import { pin, arrowRight } from '../assets/svgs';
import AccessLevelAvatar from './AccessLevelAvatar';
import { useAppSelector } from '../redux/Store';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ForumRootStackParamList } from '../entity/IRouteParams';

interface IThreadCard {
  id: number;
  reduxKey: 'followed' | 'all' | 'forums';
  appColor: string;
  isDark: boolean;
}

const ThreadCard: FunctionComponent<IThreadCard> = props => {
  const { id, reduxKey, appColor, isDark } = props;
  const { navigate } = useNavigation<StackNavigationProp<ForumRootStackParamList>>();

  const styles = useStyles(isDark);
  const thread = useAppSelector(state => state.threadsState?.[reduxKey]?.[id]);

  const onNavigate = (): void => {
    navigate('Thread', {
      threadId: id,
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onNavigate}>
      <AccessLevelAvatar
        author={{
          id: thread?.author_id || -1,
          avatar_url: thread?.author_avatar_url,
          access_level: thread?.author_access_level,
        }}
        height={60}
        appColor={appColor}
        tagHeight={8}
        isDark={false}
      />
      <View style={{ paddingHorizontal: 10, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {!!thread?.pinned && (
            <View style={{ marginRight: 5 }}>
              {pin({ width: 10, fill: isDark ? 'white' : 'black' })}
            </View>
          )}
          <Text style={styles.title}>{thread?.title}</Text>
        </View>
        <Text style={styles.lastPost}>
          {'Started On '}
          <Text style={{ fontFamily: 'OpenSans-BoldItalic' }}>
            {thread?.published_on_formatted}
          </Text>
          {' By '}
          <Text style={{ fontFamily: 'OpenSans-BoldItalic' }}>{thread?.author_display_name}</Text>
        </Text>
        <Text style={styles.topicName}>
          {`${thread?.post_count} Replies`} · {thread?.latest_post?.created_at_diff} · By{' '}
          {thread?.latest_post?.author_display_name}
        </Text>
      </View>
      {arrowRight({ height: 15, fill: isDark ? 'white' : 'black' })}
    </TouchableOpacity>
  );
};

const useStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#002039' : '#FFFFFF',
      alignItems: 'center',
      padding: 10,
      marginBottom: 15,
      borderRadius: 5,
      elevation: 5,
      shadowColor: isDark ? 'black' : 'lightgrey',
      shadowOffset: { width: 3, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 4,
    },
    title: {
      fontFamily: 'OpenSans-Bold',
      color: isDark ? 'white' : 'black',
      fontSize: IS_TABLET ? 18 : 16,
    },
    lastPost: {
      fontFamily: 'OpenSans-Italic',
      color: isDark ? '#FFFFFF' : '#000000',
      fontSize: IS_TABLET ? 16 : 14,
      paddingVertical: 5,
    },
    topicName: {
      fontFamily: 'OpenSans',
      color: isDark ? '#9EC0DC' : '#3F3F46',
      fontSize: IS_TABLET ? 16 : 14,
    },
  });

export default ThreadCard;
