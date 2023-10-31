import React, { FunctionComponent } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, StyleProp } from 'react-native';
import { IS_TABLET } from '../ForumRouter';
import { arrowRight, defaultForumIcon } from '../assets/svgs';

interface IForumCard {
  appColor: string;
  isDark: boolean;
  data: {
    title: string;
    post_count: number;
    description: string;
    latest_post: {
      created_at_diff: string;
      thread_title: string;
      author_display_name: string;
    } | null;
    icon_path: string | null;
  };
  onNavigate: () => void;
}

const ForumCard: FunctionComponent<IForumCard> = props => {
  const { appColor, isDark, data, onNavigate } = props;
  const styles = setStyles(isDark);

  return (
    <TouchableOpacity onPress={onNavigate} style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={styles.icon}>
          {data.icon_path ? (
            <Image
              source={{ uri: data.icon_path }}
              style={{ height: '50%', aspectRatio: 1 }}
              resizeMode={'contain'}
            />
          ) : (
            defaultForumIcon({ height: '50%', fill: appColor })
          )}
        </View>
        <View style={{ marginLeft: 5 }}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{`${data.post_count} Threads`}</Text>
        </View>
      </View>
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>{data.description}</Text>
        {arrowRight({ height: 10, width: 10, fill: isDark ? '#FFFFFF' : '#000000' })}
      </View>
      {!!data.latest_post && (
        <View style={styles.tagsContainer}>
          <Text style={[styles.tags, { flexShrink: 0 }]} numberOfLines={1} ellipsizeMode='tail'>
            {data.latest_post.created_at_diff}
          </Text>
          <Text style={styles.tags} numberOfLines={1} ellipsizeMode='tail'>
            {` - In: ${data.latest_post.thread_title}`}
          </Text>
          <Text style={styles.tags} numberOfLines={1} ellipsizeMode='tail'>
            {` - By: ${data.latest_post.author_display_name}`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#002039' : '#FFFFFF',
      padding: 10,
      margin: 5,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      height: 35,
      aspectRatio: 1,
      borderRadius: 17,
      backgroundColor: isDark ? '#002039' : '#F7F9FC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'OpenSans-Bold',
      color: isDark ? '#FFFFFF' : '#00101D',
      fontSize: IS_TABLET ? 18 : 16,
    },
    subtitle: {
      fontFamily: 'OpenSans',
      color: isDark ? '#9EC0DC' : '#3F3F46',
      fontSize: IS_TABLET ? 16 : 14,
    },
    descriptionContainer: {
      flexDirection: 'row',
      padding: 5,
      justifyContent: 'space-between',
    },
    description: {
      fontFamily: 'OpenSans',
      color: isDark ? '#FFFFFF' : '#00101D',
      fontSize: IS_TABLET ? 16 : 14,
      width: '90%',
    },
    tagsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tags: {
      fontFamily: 'OpenSans',
      color: isDark ? '#9EC0DC' : '#3F3F46',
      fontSize: IS_TABLET ? 16 : 14,
      flexShrink: 1,
    },
  });

export default ForumCard;
