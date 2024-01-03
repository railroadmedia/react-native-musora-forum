import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import {
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  SafeAreaView,
  StyleProp,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface ICustomModal {
  isDark: boolean;
  appColor: string;
  onCancel?: boolean;
  onAction?: () => void;
}

const CustomModal = forwardRef<
  { toggle: (title: string, message: string, buttonText?: string) => void },
  ICustomModal
>((props, ref) => {
  const { onCancel, onAction } = props;
  const [visible, setVisible] = useState(false);
  const [opacity] = useState(new Animated.Value(0));
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('');

  useImperativeHandle(ref, () => ({
    toggle,
  }));

  const toggle = (titleValue?: string, messageValue?: string, buttonTextValue?: string): void => {
    setTitle(titleValue || '');
    setMessage(messageValue || '');
    setButtonText(buttonTextValue || 'OK');
    setVisible(v => !v);
  };

  const animate = useCallback(() => {
    Animated.timing(opacity, {
      duration: 250,
      useNativeDriver: true,
      toValue: visible ? 1 : 0,
    }).start();
  }, [opacity, visible]);

  const onClose = (): void => {
    toggle();
  };

  return (
    <Modal
      transparent={true}
      onShow={animate}
      visible={visible}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <LinearGradient
        style={styles.lgradient}
        colors={['rgba(0, 12, 23, 0.69)', 'rgba(0, 12, 23, 1)']}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity style={styles.modalBackground} onPress={onClose}>
          <View />
          <View style={styles.msgContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {message && <Text style={styles.message}>{message}</Text>}
            {buttonText && (
              <TouchableOpacity style={styles.btn} onPress={onAction ? onAction : onClose}>
                <Text style={styles.btnText}>{buttonText}</Text>
              </TouchableOpacity>
            )}
          </View>

          {onCancel ? (
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.secondaryBtnText}>{'Close'}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
});

const styles: StyleProp<any> = StyleSheet.create({
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
  },
});

export default CustomModal;
