import React, { FunctionComponent } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp } from 'react-native';
import { arrowRight } from '../assets/svgs';
import AccessLevelAvatar from './AccessLevelAvatar';
import type { ISearchItem } from '../entity/IForum';

interface ISearchCard {
  item: ISearchItem;
  isDark: boolean;
  appColor: string;
  onNavigate: () => void;
}

const SearchCard: FunctionComponent<ISearchCard> = props => {
  const {
    item: { content, thread },
    isDark,
    appColor,
    onNavigate,
  } = props;
  const styles = setStyles(isDark);

  return (
    <TouchableOpacity style={styles.container} onPress={onNavigate}>
      <AccessLevelAvatar
        author={{
          id: thread?.author_id || -1,
          avatar_url: thread?.author_avatar_url,
          access_level: thread?.author_access_level,
        }}
        height={45}
        appColor={appColor}
        isDark={isDark}
        tagHeight={4}
      />
      <Text style={styles.title}>
        {thread?.title}
        {'\n'}
        <Text style={styles.text}>
          {`Started on ${thread?.published_on_formatted} by ${thread?.author_display_name}`}
        </Text>
      </Text>
      <Text style={styles.text}>{`${thread?.post_count} Replies`}</Text>
      <View style={styles.contentContainer}>
        <Text style={styles.content} numberOfLines={3}>
          {content}
        </Text>
        {arrowRight({ height: 15, fill: isDark ? 'white' : 'black' })}
      </View>
      <Text style={styles.text}>
        {`Replied ${thread?.latest_post?.created_at_diff} by ${thread?.latest_post?.author_display_name} - ${thread?.category}`}
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
