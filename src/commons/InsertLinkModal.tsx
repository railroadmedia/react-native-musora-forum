import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
} from 'react-native';

interface IInsertLinkModal {
  isDark: boolean;
  appColor: string;
  onClose: (title: string, url: string, type: string) => void;
}

const InsertLinkModal = forwardRef<{ toggle: (linkType: string) => void }, IInsertLinkModal>(
  (props, ref) => {
    const { isDark, appColor, onClose } = props;
    const styles = setStyles(isDark, appColor);

    const [visible, setVisible] = useState(false);
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');

    const titleTInputRef = useRef<TextInput | null>(null);
    const urlTInputRef = useRef<TextInput | null>(null);

    useImperativeHandle(ref, () => ({
      toggle,
    }));

    const toggle = useCallback(
      (linkType: string) => {
        setVisible(!visible);
        setType(linkType);

        if (visible) {
          setTimeout(() => {
            if (linkType === 'Link') {
              titleTInputRef.current?.focus();
            } else {
              urlTInputRef.current?.focus();
            }
          }, 500);
        } else {
          titleTInputRef.current?.blur();
          urlTInputRef.current?.blur();
        }
      },
      [visible]
    );

    const onButtonPress = useCallback(() => {
      onClose?.(title, url, type);
      toggle('');
    }, [onClose, toggle, title, type, url]);

    return (
      <Modal
        animationType={'fade'}
        transparent={true}
        visible={visible}
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => toggle('')}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <TouchableOpacity style={styles.modalBackground} onPress={() => toggle('')}>
            <View style={styles.modalContainer}>
              <Text style={styles.text}>{`Insert ${type} Url`}</Text>
              {type === 'Link' && (
                <View style={styles.item}>
                  <TextInput
                    style={styles.input}
                    placeholderTextColor={isDark ? '#EDEEEF' : '#00101D'}
                    placeholder={'title'}
                    onChangeText={t => setTitle(t)}
                    ref={titleTInputRef}
                  />
                </View>
              )}
              <View style={styles.item}>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={isDark ? '#EDEEEF' : '#00101D'}
                  placeholder='http(s)://'
                  onChangeText={t => setUrl(t)}
                  ref={urlTInputRef}
                />
              </View>

              <TouchableOpacity style={styles.btn} onPress={() => onButtonPress()}>
                <Text style={styles.text}>{'OK'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
);

const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    modalBackground: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,.8)',
    },
    modalContainer: {
      backgroundColor: isDark ? '#00101D' : '#F7F9FC',
      padding: 10,
      paddingHorizontal: 50,
      borderRadius: 10,
      margin: 5,
      width: '80%',
    },
    item: {
      borderBottomWidth: 1,
      borderColor: '#e8e8e8',
      flexDirection: 'row',
      height: 40,
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    input: {
      flex: 1,
      height: 40,
      color: isDark ? '#EDEEEF' : '#00101D',
    },
    btn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: appColor,
      borderRadius: 20,
      marginVertical: 15,
    },
    text: {
      color: isDark ? '#EDEEEF' : '#00101D',
      paddingVertical: 10,
    },
  });

export default InsertLinkModal;
