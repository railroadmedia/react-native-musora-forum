import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { IS_IOS, defaultIssues, setTestID } from '../../services/helpers';
import CustomCheckBox from '../CustomCheckBox';
import CustomTextinput from '../CustomTextInput';

interface IReportModal {
  onReportUser: (issue: string) => void;
  onReportPost: (issue: string) => void;
  isDark: boolean;
}

const ReportModal = forwardRef<{ toggle: (mode: 'post' | 'user') => void }, IReportModal>(
  (props, ref) => {
    const { onReportUser, onReportPost, isDark } = props;
    const styles = localStyles(isDark);

    const [visible, setVisible] = useState(false);
    const [issues, setIssues] = useState<Array<{ text: string; selected: boolean }>>([]);
    const [showReportForm, setShowReportForm] = useState(true);
    const [issueText, setIssueText] = useState('');
    const [reportMode, setReportMode] = useState<'post' | 'user'>();

    useImperativeHandle(ref, () => ({
      toggle(mode) {
        setReportMode(mode);
        const getIssues = defaultIssues(mode);
        setIssues(getIssues?.map(c => ({ text: c, selected: 'Other reasons.' === c })));
        setShowReportForm(true);
        setVisible(!visible);
      },
    }));

    const closeModal = useCallback(() => {
      setVisible(false);
      setIssueText('');
    }, []);

    const onIssueChanged = useCallback((value?: string) => {
      if (value) {
        setIssues(i => i.map(s => ({ ...s, selected: s.text === value })));
        if (value === 'Other reasons.') {
          setIssueText('');
          setShowReportForm(true);
        } else {
          setIssueText(value);
          setShowReportForm(false);
        }
      }
    }, []);

    const onIssueTextChanged = useCallback((value: string) => {
      setIssueText(value);
    }, []);

    const onSubmitReport = useCallback(() => {
      if (reportMode === 'post') {
        onReportPost?.(issueText);
      } else if (reportMode === 'user') {
        onReportUser?.(issueText);
      }
      closeModal();
    }, [onReportPost, onReportUser, issueText, closeModal, reportMode]);

    return (
      <Modal visible={visible} onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : undefined} style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps={'handled'}
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <View />
                <View>
                  <View>
                    <Text style={styles.titleStyle}>{`Report This ${reportMode}`}</Text>
                    <Text
                      style={styles.subtitleStyle}
                    >{`Please tell us why you're reporting this ${reportMode}.`}</Text>
                  </View>
                  <View>
                    {issues?.map(({ text, selected }) => (
                      <TouchableOpacity
                        key={text}
                        onPress={() => onIssueChanged(selected ? undefined : text)}
                        style={styles.issueBtn}
                        testID={setTestID('issueRadioBtn')}
                        accessible={IS_IOS ? false : true}
                      >
                        <CustomCheckBox
                          isOn={selected}
                          onValueChange={() => onIssueChanged(selected ? undefined : text)}
                          style={{
                            ...styles.checkBoxStyle,
                            backgroundColor: selected ? '#FFAE00' : isDark ? '#002039' : '#FFFFFF',
                          }}
                          icon={<View style={styles.checkBoxActive} />}
                        />
                        <Text style={styles.issueTextStyle} testID={setTestID('filterOptionText')}>
                          {text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {showReportForm && (
                    <CustomTextinput
                      multiline={true}
                      placeholder={`Start sharing your feedback...`}
                      placeholderTextColor={isDark ? '#9EC0DC' : '#8C8C90'}
                      value={issueText}
                      onChangeText={onIssueTextChanged}
                      containerStyle={styles.textAreaContainer}
                      inputStyle={styles.textArea}
                      textinputStyle={styles.textAreaInput}
                      clearIcon={{
                        fill: isDark ? '#9EC0DC' : '#8C8C90',
                        size: 10,
                        style: { top: 10 },
                      }}
                    />
                  )}
                </View>

                <View>
                  <TouchableOpacity
                    onPress={onSubmitReport}
                    style={[styles.submitBtn, issueText === '' && [styles.disabledBtn]]}
                    disabled={issueText === ''}
                    testID={setTestID(`submitBtn`)}
                    accessible={IS_IOS ? false : true}
                  >
                    <Text
                      style={[styles.submitBtnText, issueText === '' && styles.disabledBtnText]}
                      testID={setTestID(`SubmitBtnText`)}
                      numberOfLines={1}
                    >
                      {'SUBMIT REPORT'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                    <Text style={styles.close}>{'Close'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
);

const localStyles: StyleProp<any> = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#00101D' : '#F7F9FC',
    },
    scrollContent: {
      flexGrow: 1,
    },
    modalContent: {
      flex: 1,
      padding: 10,
      backgroundColor: isDark ? '#00101D' : '#F7F9FC',
      justifyContent: 'space-between',
    },
    textContainer: {
      paddingHorizontal: 20,
    },
    titleStyle: {
      color: isDark ? '#FFFFFF' : '#00101D',
      fontFamily: 'OpenSans-Bold',
      fontSize: 24,
      paddingHorizontal: 20,
      marginBottom: 25,
      textTransform: 'capitalize',
    },
    subtitleStyle: {
      color: isDark ? '#FFFFFF' : '#00101D',
      fontFamily: 'OpenSans',
      fontSize: 16,
      paddingHorizontal: 20,
      marginBottom: 5,
    },
    issueBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignItems: 'center',
      flexDirection: 'row',
    },
    checkBoxStyle: {
      height: 18,
      width: 18,
      borderRadius: 9,
      marginRight: 10,
      borderColor: isDark ? '#445F74' : '#D1D5DB',
      borderWidth: 1,
    },
    checkBoxActive: {
      height: 7,
      width: 7,
      borderRadius: 3.5,
      backgroundColor: 'white',
    },
    issueTextStyle: {
      color: isDark ? '#FFFFFF' : '#00101D',
      fontFamily: 'OpenSans',
      fontSize: 16,
    },
    textAreaContainer: {
      width: '95%',
      marginTop: 15,
    },
    textArea: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
      height: 185,
      borderColor: isDark ? '#445F74' : '#A1A1A9',
      borderWidth: 1,
      borderRadius: 6,
    },
    textAreaInput: {
      color: isDark ? '#9EC0DC' : '#3F3F46',
      height: '100%',
      textAlign: 'left',
      textAlignVertical: 'top',
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      borderRadius: 25,
      backgroundColor: isDark ? '#FFFFFF' : '#00101D',
      width: '100%',
      marginTop: 20,
    },
    disabledBtn: {
      backgroundColor: 'rgba(68, 95, 116, 0.55)',
    },
    submitBtnText: {
      fontSize: 18,
      fontFamily: 'BebasNeuePro-Bold',
      paddingVertical: 8,
      marginHorizontal: 5,
      letterSpacing: 1,
      color: isDark ? '#00101D' : '#F7F9FC',
    },
    disabledBtnText: {
      color: '#000000',
    },
    closeBtn: {
      alignSelf: 'center',
      marginTop: 15,
    },
    close: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 18,
      color: isDark ? '#FFFFFF' : '#00101D',
      padding: 10,
      alignSelf: 'center',
    },
  });

export default ReportModal;
