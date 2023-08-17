import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Modal, Text } from 'react-native';
import { isTablet } from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { banSvg, edit, multiQuoteSvg, reportSvg } from 'react-native-musora-forum/src/assets/svgs';

interface IMenuModal {
  onReportUser?: () => void;
  onReportPost?: () => void;
  onBlock?: () => void;
  onEdit?: () => void;
  onMultiquote?: () => void;
  mode: 'user' | 'post';
  user: any;
  authorId: number;
  multiQuoteText: string;
}

const IS_TABLET = isTablet();

const MenuModal = forwardRef<{ toggle: () => void }, IMenuModal>((props, ref) => {
  const { onReportUser, onReportPost, onBlock, onEdit, onMultiquote, mode, user, authorId, multiQuoteText } = props;
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    toggle() {
      setVisible(!visible);
    },
  }));

  const closeModal = useCallback(() => {
    setVisible(false);
  }, []);

  const report = useCallback(() => {
    mode === 'user' ? onReportUser?.() : onReportPost?.();
    closeModal();
  }, [closeModal, onReportPost, onReportUser, mode]);

  const blockUser = useCallback(() => {
    onBlock?.();
    closeModal();
  }, [closeModal, onBlock]);

  const editPost = useCallback(() => {
    onEdit?.();
    closeModal();
  },[onEdit, closeModal])

  const multiquote = useCallback(() => {
    onMultiquote?.();
    closeModal();
  },[closeModal, onMultiquote])

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType={'slide'}
      supportedOrientations={['portrait', 'landscape']}
    >
    <TouchableOpacity style={{ flex: 1 }} onPress={closeModal} >
      <LinearGradient
        style={styles.lgradient}
        colors={['rgba(0, 12, 23, 0.69)', 'rgba(0, 12, 23, 1)']}
      />
      <View style={styles.modalContent}>

        <View style={IS_TABLET && { height: '10%' }} />
        {user.permission_level === 'administrator' || user.id === authorId ? (
          <TouchableOpacity onPress={editPost} style={styles.actionContainer}>
            <View style={styles.iconContainer}>
              {edit({
                height: 24,
                width: 24,
                fill: 'white',
              })}
            </View>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        ):null}
        <TouchableOpacity onPress={multiquote} style={styles.actionContainer}>
          <View style={styles.iconContainer}>
            {multiQuoteSvg({
              height: 24,
              width: 24,
              fill: 'white',
            })}
          </View>
          <Text style={styles.actionText}>{multiQuoteText}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={report} style={styles.actionContainer}>
          <View style={styles.iconContainer}>
            {reportSvg({
              height: 24,
              width: 24,
              fill: 'white',
            })}
          </View>
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={blockUser} style={styles.actionContainer}>
          <View style={styles.iconContainer}>
            {banSvg({
              height: 24,
              width: 24,
              fill: 'white',
            })}
          </View>
          <Text style={styles.actionText} >Block User </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={closeModal}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
      </View>
     </TouchableOpacity>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,.4)',
    paddingBottom: 15,
  },
  close: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    padding: 10,
    alignSelf: 'center',
  },
  actionText: {
    color: 'white',
    fontFamily: 'OpenSans',
    fontSize: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    marginBottom: 36,
  },
  iconContainer: {
    marginRight: 16,
  },
  lgradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
});

export default MenuModal;
