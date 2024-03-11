import React, { FunctionComponent, ReactElement, useState } from 'react';
import {
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
  ViewStyle,
  View,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  TouchableOpacity,
  ReturnKeyTypeOptions,
  TextStyle,
  TextInputProps,
  Text,
} from 'react-native';
import { CloseAltSvg } from '../assets/svgs';
import { setTestID } from '../services/helpers';

interface ICustomTextinput extends TextInputProps {
  autoFocus?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  placeholderTextColor?: string;
  inputStyle?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle[];
  textinputStyle?: TextStyle;
  labelStyle?: TextStyle;
  label?: string;
  icon?: ReactElement;
  errorMessage?: string;
  secureTextEntry?: boolean;
  onSubmitText?: (text: string) => void;
  onChangeText?: (text: string) => void;
  clearTextInput?: () => void;
  value?: string;
  returnKeyType?: ReturnKeyTypeOptions;
  clearIcon: { fill: string; size?: number; style?: ViewStyle };
}

const CustomTextinput: FunctionComponent<ICustomTextinput> = ({
  autoFocus = false,
  keyboardType = 'default',
  placeholder,
  placeholderTextColor,
  inputStyle,
  containerStyle,
  textinputStyle,
  labelStyle,
  label,
  icon,
  onSubmitText,
  onChangeText,
  clearTextInput,
  value,
  returnKeyType,
  multiline,
  clearIcon,
}) => {
  const [focused, setFocused] = useState(false);

  const inputChanged = (text: string): void => {
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const onSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>): void => {
    if (onSubmitText) {
      onSubmitText(e.nativeEvent.text);
    }
  };

  const onClearTextInput = (): void => {
    if (onChangeText) {
      onChangeText('');
      clearTextInput?.();
    }
  };

  const onFocus = (): void => {
    setFocused(true);
  };

  const onBLur = (): void => {
    setFocused(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={[styles.searchSection, inputStyle]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          testID={setTestID('textinput')}
          spellCheck={false}
          autoCorrect={false}
          multiline={multiline}
          autoCapitalize={'none'}
          autoFocus={autoFocus}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor={placeholderTextColor}
          onChangeText={inputChanged}
          onSubmitEditing={onSubmitEditing}
          style={[styles.input, textinputStyle]}
          value={value}
          returnKeyType={returnKeyType}
          onFocus={onFocus}
          onBlur={onBLur}
        />
        {value !== '' && focused && (
          <TouchableOpacity
            onPress={onClearTextInput}
            style={[styles.hideIconBtn, clearIcon?.style]}
            hitSlop={10}
          >
            <CloseAltSvg
              width={clearIcon?.size || 12}
              height={clearIcon?.size || 12}
              fill={clearIcon?.fill}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    width: '90%',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 42,
    borderRadius: 60,
  },
  input: {
    fontFamily: 'OpenSans',
    fontSize: 14,
    paddingHorizontal: 13,
    width: '95%',
  },
  label: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
    marginLeft: 10,
  },
  errorState: {
    backgroundColor: '#FEF2F2',
  },
  successState: {
    backgroundColor: '#F0FDF4',
  },
  iconContainer: {
    paddingLeft: 10,
  },
  hideIconBtn: {
    position: 'absolute',
    right: 10,
  },
});

export default CustomTextinput;
