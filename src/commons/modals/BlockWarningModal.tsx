import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, View, Modal, Text } from 'react-native';
import { isTablet } from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';

interface IBlockModal {
  onBlock: () => void;
}

const IS_TABLET = isTablet();

const BlockModal = forwardRef<{ toggle: (user: string) => void }, IBlockModal>((props, ref) => {
  const { onBlock } = props;
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState('');

  useImperativeHandle(ref, () => ({
    toggle(user: string) {
      setUsername(user);
      setVisible(!visible);
    },
  }));

  const closeModal = useCallback(() => {
    setVisible(false);
  }, []);

  const blockUser = useCallback(() => {
    onBlock?.();
    closeModal();
  }, [closeModal, onBlock]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType={'slide'}
      supportedOrientations={['portrait', 'landscape']}
    >

      <LinearGradient
        style={styles.lgradient}
        colors={['rgba(0, 12, 23, 0.69)', 'rgba(0, 12, 23, 1)']}
      />
      <View style={styles.modalContent}>
        <View style={IS_TABLET && { height: '10%' }} />
        <View style={styles.contentContainer}>
          <Text style={styles.header}>
            Are you sure you want to block {username}
          </Text>
          <Text style={styles.description}>
            You will no longer see {username}’s comments or forum posts.
          </Text>
          <TouchableOpacity
            style={styles.blockButton}
            onPress={blockUser}
          >
            <Text style={styles.blockText}>BLOCK</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={closeModal}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
});

const styles: StyleProp<any> = StyleSheet.create({
    modalContent: {
      flex: 1,
      justifyContent: 'space-between',
      backgroundColor: 'rgba(0,0,0,.4)',
      paddingBottom: 15,
    },
    contentContainer: {
      alignItems: 'center',
      padding: 36,
    },
    close: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 18,
      color: '#FFFFFF',
      padding: 10,
      alignSelf: 'center',
    },
    header: {
      color: 'white',
      fontSize: 24,
      fontFamily: 'OpenSans-ExtraBold',
      textAlign: 'center',
      marginBottom: 5,
    },
    description: {
      color: 'white',
      fontSize: 16,
      fontFamily: 'OpenSans',
      textAlign: 'center',
    },
    blockButton: {
      backgroundColor: '#DC2626',
      width: 165,
      height: 40,
      marginTop: 23,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center'
    },
    blockText: {
      color: 'white',
      fontSize: 18,
      fontFamily: 'BebasNeue',
    },
    lgradient: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      zIndex: 0,
    },
  });

export default BlockModal;
