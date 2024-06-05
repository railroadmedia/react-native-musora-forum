import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Modal, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlockUserSvg, edit, multiQuoteSvg, reportSvg } from '../../assets/svgs';
import type { IPost, IUser } from '../../entity/IForum';
import { IS_TABLET } from '../../services/helpers';

interface IMenuModal {
  onReport?: (mode: 'user' | 'post') => void;
  onBlockUser?: () => void;
  onEdit?: () => void;
  onMultiquote?: () => void;
  mode?: 'user' | 'post';
  user?: IUser;
  authorId?: number;
  multiQuoteArr: IPost[];
}

const MenuModal = forwardRef<
  { toggle: (mode: 'post' | 'user', selected: IPost) => void },
  IMenuModal
>((props, ref) => {
  const { onReport, onBlockUser, onEdit, onMultiquote, user, multiQuoteArr } = props;
  const [visible, setVisible] = useState(false);
  const [reportMode, setReportMode] = useState<'post' | 'user'>();
  const [selectedPost, setSelectedPost] = useState<IPost | undefined>();

  useImperativeHandle(ref, () => ({
    toggle(mode: 'post' | 'user', selected: IPost) {
      setReportMode(mode);
      setSelectedPost(selected);
      setVisible(!visible);
    },
  }));

  const closeModal = useCallback(() => {
    setVisible(false);
  }, []);

  const report = useCallback(() => {
    if (reportMode) {
      onReport?.(reportMode);
    }
    closeModal();
  }, [closeModal, onReport, reportMode]);

  const blockUser = useCallback(() => {
    onBlockUser?.();
    closeModal();
  }, [closeModal, onBlockUser]);

  const editPost = useCallback(() => {
    onEdit?.();
    closeModal();
  }, [onEdit, closeModal]);

  const multiquote = useCallback(() => {
    onMultiquote?.();
    closeModal();
  }, [closeModal, onMultiquote]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType={'slide'}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableOpacity style={{ flex: 1 }} onPress={closeModal}>
        <LinearGradient
          style={styles.lgradient}
          colors={['rgba(0, 12, 23, 0.69)', 'rgba(0, 12, 23, 1)']}
        />
        <View style={styles.modalContent}>
          <View style={IS_TABLET && { height: '10%' }} />
          {(reportMode === 'post' && user?.permission_level === 'administrator') ||
          (selectedPost?.author_id && user?.id === selectedPost?.author_id) ? (
            <TouchableOpacity onPress={editPost} style={styles.actionContainer}>
              <View style={styles.iconContainer}>
                {edit({
                  height: 24,
                  width: 24,
                  fill: 'white',
                })}
              </View>
              <Text style={styles.actionText}>{'Edit'}</Text>
            </TouchableOpacity>
          ) : null}
          {reportMode === 'post' && (
            <TouchableOpacity onPress={multiquote} style={styles.actionContainer}>
              <View style={styles.iconContainer}>
                {multiQuoteSvg({
                  height: 24,
                  width: 24,
                  fill: 'white',
                })}
              </View>
              <Text style={styles.actionText}>
                {multiQuoteArr?.find(f => f.id === selectedPost?.id)
                  ? 'Remove quote'
                  : 'Multiquote'}
              </Text>
            </TouchableOpacity>
          )}
          {user?.id !== selectedPost?.author_id && (
            <>
              <TouchableOpacity onPress={report} style={styles.actionContainer}>
                <View style={styles.iconContainer}>
                  {reportSvg({
                    height: 24,
                    width: 24,
                    fill: 'white',
                  })}
                </View>
                <Text style={styles.actionText}>{'Report'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={blockUser} style={styles.actionContainer}>
                <View style={styles.iconContainer}>
                  {BlockUserSvg({
                    height: 24,
                    width: 24,
                    fill: 'white',
                  })}
                </View>
                <Text style={styles.actionText}>{'Block User'}</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={closeModal}>
            <Text style={styles.close}>{'Close'}</Text>
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
