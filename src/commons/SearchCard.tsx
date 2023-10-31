import React, { FunctionComponent } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp } from 'react-native';
import { arrowRight } from '../assets/svgs';
import AccessLevelAvatar from './AccessLevelAvatar';
import type { IThread } from '../entity/IForum';

interface ISearchCard {
  item: {
    content: string;
    thread: IThread;
  };
  isDark: boolean;
  appColor: string;
  onNavigate: () => void;
}

const SearchCard: FunctionComponent<ISearchCard> = props => {
  const {
    item: {
      content,
      thread: {
        author_id,
        author_avatar_url,
        author_access_level,
        author_display_name,
        title,
        published_on_formatted,
        post_count,
        latest_post,
        category,
      },
    },
    isDark,
    appColor,
    onNavigate,
  } = props;
  const styles = setStyles(isDark);

  return (
    <TouchableOpacity style={styles.container} onPress={onNavigate}>
      <AccessLevelAvatar
        author={{
          id: author_id,
          avatar_url: author_avatar_url,
          access_level: author_access_level,
        }}
        height={45}
        appColor={appColor}
        isDark={isDark}
        tagHeight={4}
      />
      <Text style={styles.title}>
        {title}
        {'\n'}
        <Text style={styles.text}>
          {`Started on ${published_on_formatted} by ${author_display_name}`}
        </Text>
      </Text>
      <Text style={styles.text}>{`${post_count} Replies`}</Text>
      <View style={styles.contentContainer}>
        <Text style={styles.content} numberOfLines={3}>
          {content}
        </Text>
        {arrowRight({ height: 15, fill: isDark ? 'white' : 'black' })}
      </View>
      <Text style={styles.text}>
        {`Replied ${latest_post.created_at_diff} by ${latest_post.author_display_name} - ${category}`}
      </Text>
    </TouchableOpacity>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#081825' : 'white',
      marginBottom: 15,
      flexDirection: 'row',
      padding: 10,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    title: {
      flex: 1,
      fontFamily: 'OpenSans-Bold',
      color: isDark ? 'white' : 'black',
      fontSize: 20,
      paddingHorizontal: 10,
    },
    text: {
      fontFamily: 'OpenSans',
      color: '#445F74',
      fontSize: 14,
    },
    contentContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    content: {
      color: isDark ? '#FFFFFF' : '#000000',
      fontFamily: 'OpenSans',
      fontSize: 14,
      padding: 10,
      paddingLeft: 0,
      flex: 1,
    },
  });

export default SearchCard;
