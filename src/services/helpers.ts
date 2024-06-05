import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const IS_TABLET = DeviceInfo.isTablet();
export const IS_IOS = Platform.OS === 'ios';

export const HEADER_RANGE_START = 0;
export const HEADER_RANGE_END = 100;
export const SMALL_HEADER_LENGTH = IS_TABLET ? 45 : 30;
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
    data.append('fieldKey', 'forum_post_photo');
  }
  return data;
};

export const defaultIssues = (type: 'post' | 'user'): string[] => {
  switch (type) {
    case 'post': {
      return [
        `It contains offensive language or content.`,
        `It's abusive or harmful.`,
        `It contains personal information.`,
        `It's misleading or a false claim.`,
        `Other reasons.`,
      ];
    }
    case 'user': {
      return [
        `Inappropriate or offensive behavior.`,
        `Harassment or bullying.`,
        `Fake profile or impersonation.`,
        `Spamming or solicitation.`,
        `Sharing harmful or illegal content.`,
        `Other reasons.`,
      ];
    }
  }
};
