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
