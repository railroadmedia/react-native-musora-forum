import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const IS_TABLET = DeviceInfo.isTablet();
export const IS_IOS = Platform.OS === 'ios';
export const setTestID = (testID: string): string => {
  if (Platform.OS === 'ios') {
    return testID;
  } else {
    return `com.musoraapp:id/${testID}`;
  }
};

export const createFormData = (photo: { uri: string; type: string; fileName: string }): object => {
  const data = new FormData();

  if (photo) {
    data.append('file', {
      name: `${photo.fileName.substring(photo.fileName.lastIndexOf('/') + 1)}`,
      type: photo.type,
      uri: IS_IOS ? photo.uri.replace('file://', '') : photo.uri,
    });
    data.append('target', `${photo.fileName.substring(photo.fileName.lastIndexOf('/') + 1)}`);
  }
  return data;
};
