import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

import AccessLevelAvatar from '../commons/AccessLevelAvatar';

import { x } from '../assets/svgs';

let styles;
export default class UserInfo extends React.Component {
  constructor(props) {
    super(props);
    styles = setStyles(props.isDark, props.appColor);
  }

  render = () => {
    const { author, onHideUserInfo, isVisible, isDark, appColor } = this.props;
    return (
      <Modal
        transparent={true}
        visible={isVisible}
        animationType={'slide'}
        onRequestClose={onHideUserInfo}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.background}>
          <View style={styles.infoContainer}>
            <TouchableOpacity style={styles.header} onPress={onHideUserInfo}>
              {x({ width: 50, height: 20, fill: isDark ? 'white' : 'black' })}
              <Text style={styles.name}>{author?.display_name}</Text>
            </TouchableOpacity>
            <AccessLevelAvatar
              author={author}
              height={100}
              appColor={appColor}
              isDark={isDark}
              tagHeight={12}
            />
            <Text style={styles.rank}>
              {author?.xp_rank}
              {'\n'}
              <Text style={styles.level}>LEVEL {author?.level_rank}</Text>
              {'\n'}
              {'\n'}
              <Text style={styles.yearSince}>
                MEMBER SINCE{' '}
                {new Date(Date.now() - author.days_as_member * 86400000).getUTCFullYear()}
              </Text>
            </Text>
            <View style={{ width: '100%', flexDirection: 'row', marginTop: 30 }}>
              {[
                [author.xp, author.total_posts, author.days_as_member, author.total_post_likes],
                ['Total XP', 'Total posts', 'Days as a member', 'Total post likes'],
              ].map((array, i) => (
                <View style={i ? { flex: 1 } : {}} key={`${i}`}>
                  {array.map((a, j) => (
                    <View style={styles.tableRow} key={`${i}${j}`}>
                      <Text
                        style={{
                          paddingVertical: 10,
                          paddingLeft: i ? 10 : 15,
                          color: i ? (isDark ? '#445f73' : 'black') : appColor,
                          fontSize: 18,
                          fontFamily: i ? 'OpenSans' : 'OpenSans-Bold',
                        }}
                      >
                        {a}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  };
}

let setStyles = (isDark, appColor) =>
  StyleSheet.create({
    background: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,.5)',
    },
    infoContainer: {
      flex: 0.85,
      backgroundColor: isDark ? '#081826' : '#F7F9FC',
      borderTopEndRadius: 25,
      borderTopStartRadius: 25,
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingVertical: 30,
      justifyContent: 'center',
    },
    header: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
    },
    name: {
      fontFamily: 'OpenSans-ExtraBold',
      color: isDark ? 'white' : 'black',
      fontSize: 20,
      position: 'absolute',
      textAlign: 'center',
      width: '100%',
    },
    rank: {
      width: '100%',
      textAlign: 'center',
      marginTop: 5,
      fontSize: 20,
      color: appColor,
      fontFamily: 'RobotoCondensed-Bold',
    },
    level: {
      color: isDark ? 'white' : 'black',
      fontSize: 16,
      fontFamily: 'OpenSans-Bold',
    },
    yearSince: {
      color: isDark ? '#445f73' : 'black',
      fontSize: 18,
      fontFamily: 'OpenSans-Bold',
      marginTop: 20,
    },
    tableRow: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#002039' : 'lightgrey',
      height: 40,
      justifyContent: 'center',
    },
  });
