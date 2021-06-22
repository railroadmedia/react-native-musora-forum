import React from 'react';
import {
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated
} from 'react-native';

let styles;

export default class CustomModal extends React.PureComponent {
  constructor(props) {
    super(props);
    styles = setStyles(props.isDark, props.appColor);
    this.state = {
      visible: false,
      opacity: new Animated.Value(0)
    };
  }

  toggle = (title, message) => {
    this.title = title || '';
    this.message = message || '';
    this.setState(state => ({ visible: !state.visible }));
  };

  animate = () => {
    Animated.timing(this.state.opacity, {
      duration: 250,
      useNativeDriver: true,
      toValue: this.state.visible ? 1 : 0
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
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => this.toggle()}
        >
          <Animated.View
            style={[styles.animatedView, { opacity: this.state.opacity }]}
          >
            <Text style={styles.modalHeaderText}>{this.title}</Text>
            <Text style={styles.modalBodyText}>{this.message}</Text>

            <TouchableOpacity style={styles.btn} onPress={() => this.toggle()}>
              <Text style={styles.btnText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  }
}

let setStyles = (isDark, appColor) =>
  StyleSheet.create({
    modalBackground: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,.5)'
    },
    modalHeaderText: {
      fontFamily: 'OpenSans-Bold',
      textAlign: 'center',
      fontSize: 18,
      color: isDark ? '#FFFFFF' : '#000000'
    },
    animatedView: {
      padding: 10,
      paddingHorizontal: 50,
      borderRadius: 10,
      margin: 15,
      backgroundColor: isDark ? '#00101D' : '#F7F9FC'
    },
    modalBodyText: {
      textAlign: 'center',
      fontFamily: 'OpenSans',
      fontSize: 12,
      color: isDark ? '#FFFFFF' : '#000000',
      padding: 10
    },
    btn: {
      backgroundColor: appColor,
      borderRadius: 20
    },
    btnText: {
      fontFamily: 'OpenSans',
      textAlign: 'center',
      padding: 10,
      color: '#FFFFFF',
      paddingHorizontal: 50
    }
  });
