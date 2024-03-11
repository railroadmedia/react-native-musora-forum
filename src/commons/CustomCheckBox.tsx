import React, { FunctionComponent } from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { setTestID } from '../services/helpers';

export interface ICustomColoredButton {
  isOn?: boolean;
  onValueChange: (value: boolean) => void;
  style?: ViewStyle;
  icon?: any;
}

const CustomCheckBox: FunctionComponent<ICustomColoredButton> = ({
  isOn,
  onValueChange,
  style,
  icon,
}) => {
  const styles = localStyles();

  return (
    <TouchableOpacity
      onPress={() => onValueChange(!isOn)}
      style={[styles.checkBox, style]}
      testID={setTestID(`checkBtn`)}
    >
      {isOn && icon}
    </TouchableOpacity>
  );
};

const localStyles: StyleProp<any> = () =>
  StyleSheet.create({
    checkBox: {
      height: 25,
      width: 25,
      borderRadius: 12.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default CustomCheckBox;
