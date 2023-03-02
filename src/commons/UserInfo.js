import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

import AccessLevelAvatar from '../commons/AccessLevelAvatar';

import { banSvg, menuHSvg, reportSvg, x } from '../assets/svgs';
import ToastAlert from '../commons/ToastAlert';
import { reportUser } from '../services/forum.service';
import BlockModal from '../commons/modals/BlockModal';
import BlockWarningModal from '../commons/modals/BlockWarningModal';

let styles;
export default class UserInfo extends React.Component {
  constructor(props) {
    super(props);
    styles = setStyles(props.isDark, props.appColor);
    this.blockRef = React.createRef();
    this.warningRef = React.createRef();
  }
  state = {
    showToastAlert: false,
    showBlockAlert: false,
    userAlreadyReported: this.props.author.is_reported_by_viewer,
  }

  showBlockModal = () => {
    this.blockRef.current?.toggle();
  }

  showBlockWarning = () => {
    this.warningRef.current?.toggle();
  }

  onReportUser = () => {
    if (this.state.userAlreadyReported) {
      this.setState({ showToastAlert: true });
      setTimeout(() => {
        this.setState({ showToastAlert: false });
      }, 2000);
    } else {
      const { request, controller } = reportUser(this.props.author.id);
      request.then(res => {
        if (res.data.success) {
          this.setState({ showToastAlert: true });
          setTimeout(() => {
            this.setState({ showToastAlert: false, userAlreadyReported: true  });
          }, 2000);
        }
      })
      return () => {
        controller.abort();
      };
    }
  }

  onBlockUser = () => {
    this.setState({ showBlockAlert: true });

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
          <View style={styles.container} >
            <View style={styles.infoContainer}>
              <View style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 30,
                paddingHorizontal: 10,
              }}>
                <TouchableOpacity onPress={onHideUserInfo}>
                  {x({ width: 20, height: 20, fill: isDark ? 'white' : 'black' })}
                </TouchableOpacity>
                <Text style={styles.name}>{author?.display_name}</Text>
                <TouchableOpacity onPress={() => this.showBlockModal()}>
                  {menuHSvg({ width: 23, height: 20, fill: isDark ? 'white' : 'black' })}
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
          <BlockModal ref={this.blockRef} onReport={this.onReportUser} onBlock={this.showBlockWarning} />
          <BlockWarningModal ref={this.warningRef} onBlock={this.onBlockUser} />
          {this.state.showToastAlert &&
            <ToastAlert
              content={this.state.userAlreadyReported ? "You have already reported this profile.":"The user profile was reported" }
              icon={reportSvg({ height: 21.6, width: 21.6, fill: isDark ? 'black' : 'white' })}
              isDark={isDark}
            />
          }
          {this.state.showBlockAlert &&
            <ToastAlert
              content={`${author?.display_name} was blocked.`}
              icon={banSvg({ height: 21.6, width: 21.6, fill: isDark ? 'black' : 'white' })}
              isDark={isDark}
            />
          }
        </View>
      </Modal>
    );
  };
}

const setStyles = (isDark, appColor) =>
  StyleSheet.create({
    background: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,.5)',
    },
    infoContainer: {
      height: '90%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingVertical: 30,
      justifyContent: 'center',
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
