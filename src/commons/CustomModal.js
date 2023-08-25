import React from 'react';
import { Modal, TouchableOpacity, Text, StyleSheet, Animated, View, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

let styles;

export default class CustomModal extends React.PureComponent {
  constructor(props) {
    super(props);
    styles = setStyles(props.isDark, props.appColor);
    this.state = {
      visible: false,
      opacity: new Animated.Value(0),
    };
  }

  toggle = (title, message, buttonText) => {
    this.title = title || '';
    this.message = message || '';
    this.buttonText = buttonText || '';
    this.setState(state => ({ visible: !state.visible }));
  };

  animate = () => {
    Animated.timing(this.state.opacity, {
      duration: 250,
      useNativeDriver: true,
      toValue: this.state.visible ? 1 : 0,
    }).start();
  };

  render() {
    return (
      <Modal
        transparent={true}
        onShow={this.animate}
        visible={this.state.visible}
        onRequestClose={this.toggle}
        supportedOrientations={['portrait', 'landscape']}
        onBackButtonPress={this.toggle}
      >
        <LinearGradient
          style={styles.lgradient}
          colors={['rgba(0, 12, 23, 0.69)', 'rgba(0, 12, 23, 1)']}
        />
        <SafeAreaView style={{flex: 1}}>
          <TouchableOpacity style={styles.modalBackground} onPress={this.toggle}>
            <View />
            <View style={styles.msgContainer}>
              <Text style={styles.title}>{this.title}</Text>
              <Text style={styles.message}>{this.message}</Text>
              <TouchableOpacity 
                style={styles.btn} 
                onPress={this.props.onAction ? this.props.onAction : this.toggle}
              >
                <Text style={styles.btnText}>{this.buttonText || 'OK'}</Text>
              </TouchableOpacity>
            </View>
    
            {this.props.onCancel ? (
              <TouchableOpacity onPress={this.toggle}>
                <Text style={styles.secondaryBtnText}>Close</Text>
              </TouchableOpacity>
            ) : <View /> }
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }
}

let setStyles = (isDark, appColor) =>
  StyleSheet.create({
    lgradient: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      zIndex: 0,
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'space-between',
    },
    msgContainer: {
      alignSelf: 'center',
      paddingHorizontal: '10%',
    },
    title: {
      fontFamily: 'OpenSans-Bold',
      textAlign: 'center',
      fontSize: 24,
      color: '#FFFFFF',
      paddingTop: 5,
    },
    message: {
      textAlign: 'center',
      fontFamily: 'OpenSans',
      fontSize: 16,
      color: '#FFFFFF',
      paddingTop: 5,
    },
    btn: {
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      borderRadius: 25,
      marginTop: 10,
    },
    btnText: {
      fontFamily: 'BebasNeuePro-Bold',
      fontSize: 18,
      textAlign: 'center',
      padding: 10,
      color: '#000000',
      paddingHorizontal: 20,
    },
    secondaryBtnText: {
      fontSize: 18,
      color: '#FFFFFF',
      padding: 10,
      alignSelf: 'center',
      textAlign: 'center',
      fontFamily: 'OpenSans-Bold',
    }
  });
