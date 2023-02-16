import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

let styles;

export default class ToastAlert extends React.Component {
	constructor(props) {
	  super(props);
	  styles = setStyles(props.isDark, props.appColor);
	}

  render = () => {
    const { content, icon } = this.props;
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          {icon}
          <Text style={styles.text}>{content}</Text>  
        </View> 
      </View>
    );
  }
};

const setStyles = (isDark) =>
  StyleSheet.create({
    container: {
      width: '97%',
      opacity: 0.95,
      borderRadius: 14,
      minHeight: 55,
      flex: 1,
      position: 'absolute',
      bottom: 100,
      alignSelf: 'center',
      backgroundColor: isDark ? '#FFFFFF' : '#081825',
    },
    messageContainer: {
      flexDirection: 'row',
      paddingVertical: 17,
      paddingHorizontal: 8,
    },
    text: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 14,
      lineHeight: 19,
      color: isDark ? 'black' : 'white',
      marginLeft: 8,
      flex: 1,
      alignSelf: 'center',
    },
  });


