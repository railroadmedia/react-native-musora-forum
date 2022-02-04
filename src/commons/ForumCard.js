import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

import { connect } from 'react-redux';

import { arrowRight, defaultForumIcon } from '../assets/svgs';

let styles;
class ForumCard extends React.Component {
  constructor(props) {
    super(props);
    let { isDark } = props;
    styles = setStyles(isDark);
  }

  render() {
    let {
      appColor,
      data: { title, post_count, description, latest_post, icon_path },
    } = this.props;
    return (
      <TouchableOpacity onPress={this.props.onNavigate} style={styles.container}>
        <View style={styles.titleContainer}>
          <View style={styles.icon}>
            {icon_path ? (
              <Image
                source={{ uri: icon_path }}
                style={{ height: '50%', aspectRatio: 1 }}
                resizeMode={'contain'}
              />
            ) : (
              defaultForumIcon({ height: '50%', fill: appColor })
            )}
          </View>
          <View style={{ marginLeft: 5 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{post_count} Replies</Text>
          </View>
        </View>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{description}</Text>
          {arrowRight({ height: 10, width: 10, fill: appColor })}
        </View>
        {latest_post && (
          <View style={styles.tagsContainer}>
            <Text style={[styles.tags, { flexShrink: 0 }]} numberOfLines={1} ellipsizeMode='tail'>
              {latest_post.created_at_diff}
            </Text>
            <Text style={styles.tags} numberOfLines={1} ellipsizeMode='tail'>
              - In: {latest_post.thread_title}
            </Text>
            <Text style={styles.tags} numberOfLines={1} ellipsizeMode='tail'>
              - By: {latest_post.author_display_name}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
}
let setStyles = isDark => {
  setStyles.isDark = isDark;
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#081825' : '#F7F9FC',
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
      fontSize: 14,
    },
    subtitle: {
      fontFamily: 'OpenSans',
      color: isDark ? '#445F74' : '#00101D',
      fontSize: 11,
    },
    descriptionContainer: {
      flexDirection: 'row',
      padding: 5,
      justifyContent: 'space-between',
    },
    description: {
      fontFamily: 'OpenSans',
      color: isDark ? '#FFFFFF' : '#00101D',
      fontSize: 12,
      width: '90%',
    },
    tagsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tags: {
      fontFamily: 'OpenSans',
      color: isDark ? '#445F74' : '#00101D',
      fontSize: 11,
      flexShrink: 1,
    },
  });
};
const mapStateToProps = ({ themeState }, { isDark }) => {
  isDark = themeState ? themeState.theme === 'dark' : isDark;
  if (setStyles.isDark !== isDark) styles = setStyles(isDark);
  return { isDark };
};

export default connect(mapStateToProps, null)(ForumCard);
