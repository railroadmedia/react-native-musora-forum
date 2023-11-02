import React, { FunctionComponent } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, StyleProp } from 'react-native';
import { x, menuHSvg } from '../assets/svgs';
import AccessLevelAvatar from './AccessLevelAvatar';
import type { IAuthor } from '../entity/IForum';

interface IUserInfo {
  isVisible: boolean;
  isDark: boolean;
  appColor: string;
  author: IAuthor;
  onHideUserInfo: () => void;
  onMenuPress: () => void;
}

const UserInfo: FunctionComponent<IUserInfo> = props => {
  const { author, isDark, appColor, isVisible, onHideUserInfo, onMenuPress } = props;
  const styles = setStyles(isDark, appColor);

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType={'slide'}
      onRequestClose={onHideUserInfo}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.background}>
        <View style={styles.container}>
          <View style={styles.infoContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onHideUserInfo}>
                {x({
                  width: 20,
                  height: 20,
                  fill: isDark ? 'white' : 'black',
                })}
              </TouchableOpacity>
              <Text style={styles.name}>{author?.display_name}</Text>
              <TouchableOpacity onPress={onMenuPress}>
                {menuHSvg({
                  width: 23,
                  height: 20,
                  fill: isDark ? 'white' : 'black',
                })}
              </TouchableOpacity>
            </View>
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
              <Text style={styles.level}>{`LEVEL ${author?.level_rank}`}</Text>
              {'\n'}
              {'\n'}
              {author?.days_as_member && (
                <Text style={styles.yearSince}>
                  {'MEMBER SINCE '}
                  {new Date(Date.now() - author?.days_as_member * 86400000).getUTCFullYear()}
                </Text>
              )}
            </Text>
            <View style={styles.rowsContainer}>
              {[
                [author?.xp, author?.total_posts, author?.days_as_member, author?.total_post_likes],
                ['Total XP', 'Total posts', 'Days as a member', 'Total post likes'],
              ].map((array, i) => (
                <View style={i ? { flex: 1 } : {}} key={`${i}`}>
                  {array.map((a, j) => (
                    <View style={styles.tableRow} key={`${i}${j}`}>
                      <Text
                        style={[
                          styles.infoRow,
                          {
                            paddingLeft: i ? 10 : 15,
                            color: i ? (isDark ? '#445f73' : 'black') : appColor,
                            fontFamily: i ? 'OpenSans' : 'OpenSans-Bold',
                          },
                        ]}
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
      </View>
    </Modal>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    background: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,.5',
    },
    infoContainer: {
      height: '90%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingVertical: 30,
      justifyContent: 'center',
    },
    rowsContainer: {
      width: '100%',
      flexDirection: 'row',
      marginTop: 30,
    },
    infoRow: {
      paddingVertical: 10,
      fontSize: 18,
    },
    container: {
      flex: 0.85,
      backgroundColor: isDark ? '#081826' : '#F7F9FC',
      borderTopEndRadius: 25,
      borderTopStartRadius: 25,
    },
    header: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 30,
      paddingHorizontal: 10,
    },
    name: {
      fontFamily: 'OpenSans-ExtraBold',
      color: isDark ? 'white' : 'black',
      fontSize: 20,
      textAlign: 'center',
      alignSelf: 'center',
      flex: 1,
    },
    rank: {
      width: '100%',
      textAlign: 'center',
      marginTop: 5,
      fontSize: 20,
      color: appColor,
      fontFamily: 'BebasNeuePro-Bold',
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
      justifyContent: 'center',
    },
    reportText: {
      color: isDark ? '#627F97' : '#445F74',
      fontFamily: 'BebasNeue-Regular',
      fontSize: 18,
      marginHorizontal: 5,
    },
    reportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
  });

export default UserInfo;
