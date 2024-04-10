import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, StyleProp } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LibrarySvg, TakePhotoSvg } from '../../assets/svgs';
import { connection, uploadPicture } from '../../services/forum.service';
import ImagePicker, { Image } from 'react-native-image-crop-picker';
import CustomModal from '../CustomModal';

interface IInserImageModal {
  isDark: boolean;
  appColor: string;
  onClose: (title: string, url: string, type: string) => void;
}

const InserImageModal = forwardRef<{ toggle: () => void }, IInserImageModal>((props, ref) => {
  const { isDark, appColor, onClose } = props;
  const styles = setStyles(isDark, appColor);

  const [visible, setVisible] = useState(false);

  const warningRef = useRef<React.ElementRef<typeof CustomModal>>(null);

  useImperativeHandle(ref, () => ({
    toggle,
  }));

  const toggle = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const onButtonPress = useCallback(
    async (image: Image) => {
      const res = await uploadPicture({ fileName: image.path, uri: image.path, type: image.mime })
        .request;

      if (res?.data) {
        onClose?.('', res?.data?.url, 'Image');
      } else {
        warningRef.current?.toggle('Something went wrong', 'Please try again.');
      }
      toggle();
    },
    [onClose, toggle]
  );

  const openCamera = (): void => {
    handleImagePicker('openCamera');
  };

  const openPicker = (): void => {
    handleImagePicker('openPicker');
  };

  const handleImagePicker = (originFunction: 'openCamera' | 'openPicker'): void => {
    if (!connection(true)) {
      return;
    }
    ImagePicker[originFunction]({ mediaType: 'photo' })
      .then(res => {
        if (res.path) {
          ImagePicker.openCropper({
            path: res.path,
            width: 300,
            height: 300,
            mediaType: 'photo',
          })
            .then(image => {
              if (image) {
                onButtonPress(image);
              }
              setVisible(false);
            })
            .catch(() => setVisible(false));
        } else {
          warningRef.current?.toggle('Something went wrong', 'Please try again.');
        }
      })
      .catch(() => setVisible(false));
  };

  return (
    <>
      <Modal
        transparent={true}
        visible={visible}
        animationType={'slide'}
        supportedOrientations={['portrait', 'landscape']}
      >
        <TouchableOpacity onPress={toggle} style={styles.modalBackground}>
          <LinearGradient
            style={styles.lgradient}
            colors={['rgba(0, 12, 23, 0.69)', 'rgba(0, 12, 23, 1)']}
          />
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={openCamera} style={styles.modalBtnContainer}>
              {TakePhotoSvg({ width: 19, height: 17, fill: '#FFFFFF' })}
              <Text style={styles.modalBtn}>{'Take Photo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openPicker} style={styles.modalBtnContainer}>
              {LibrarySvg({ height: 17, width: 17, fill: '#FFFFFF' })}
              <Text style={styles.modalBtn}>{'Choose From Library'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggle}>
              <Text style={styles.close}>{'Close'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <CustomModal ref={warningRef} isDark={isDark} appColor={appColor} />
    </>
  );
});

const setStyles: StyleProp<any> = () =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
    },
    lgradient: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      zIndex: 0,
    },
    modalContent: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingBottom: 15,
    },
    modalBtn: {
      fontFamily: 'OpenSans',
      fontSize: 16,
      color: '#FFFFFF',
      marginLeft: 15,
    },
    modalBtnContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      marginLeft: 10,
    },
    close: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 18,
      color: '#FFFFFF',
      padding: 10,
      alignSelf: 'center',
    },
  });

export default InserImageModal;
