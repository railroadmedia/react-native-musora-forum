import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { connect } from 'react-redux';

import AccessLevelAvatar from './AccessLevelAvatar';

import { pin, arrowRight } from '../assets/svgs';

let styles;
class ThreadCard extends React.Component {
  constructor(props) {
    super(props);
    let { isDark } = props;
    styles = setStyles(isDark);
  }

  render() {
    let {
      appColor,
      isDark,
      thread: {
        author_avatar_url,
        author_access_level,
        title,
        pinned,
        post_count,
        published_on_formatted,
        author_display_name,
        latest_post,
      },
    } = this.props;
    return (
      <TouchableOpacity style={styles.container} onPress={this.props.onNavigate}>
        <AccessLevelAvatar
          author={{
            avatar_url: author_avatar_url,
            access_level: author_access_level,
          }}
          height={60}
          appColor={appColor}
          tagHeight={8}
        />
        <View style={{ paddingHorizontal: 10, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!!pinned && (
              <View style={{ marginRight: 5 }}>
                {pin({ width: 10, fill: isDark ? 'white' : 'black' })}
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.lastPost}>
            Started On <Text style={{ fontFamily: 'OpenSans-Bold' }}>{published_on_formatted}</Text>{' '}
            By <Text style={{ fontFamily: 'OpenSans-Bold' }}>{author_display_name}</Text>
          </Text>
          <Text style={styles.topicName}>
            {`${post_count} Replies`} · {latest_post.created_at_diff} · By{' '}
            {latest_post.author_display_name}
          </Text>
        </View>
        {arrowRight({ height: 15, fill: isDark ? 'white' : 'black' })}
      </TouchableOpacity>
    );
  }
}
let setStyles = isDark => {
  setStyles.isDark = isDark;
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#081825' : '#F7F9FC',
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
      fontSize: 14,
    },
    lastPost: {
      fontFamily: 'OpenSans',
      color: '#445F74',
      fontSize: 11,
      paddingVertical: 5,
    },
    topicName: {
      fontFamily: 'OpenSans',
      color: '#445F74',
      fontSize: 11,
    },
  });
};

const mapStateToProps = ({ threads, themeState }, { reduxKey, id, isDark }) => {
  isDark = themeState ? themeState.theme === 'dark' : isDark;
  if (setStyles.isDark !== isDark) styles = setStyles(isDark);
  return {
    thread: threads[reduxKey]?.[id],
  };
};
export default connect(mapStateToProps)(ThreadCard);
