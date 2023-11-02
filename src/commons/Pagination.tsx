import React, { useState, FunctionComponent, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface IPagination {
  length: number;
  active?: number;
  appColor: string;
  isDark: boolean;
  onChangePage: (active: number) => void;
}

const Pagination: FunctionComponent<IPagination> = props => {
  const { length, active: initialActive = 1, appColor, isDark, onChangePage } = props;
  const [active, setActive] = useState(initialActive);
  const [showPagePicker, setShowPagePicker] = useState(false);
  const [pagePickerText, setPagePickerText] = useState('');

  const pagesNo = useMemo(() => Math.ceil(length / 10), [length]);

  const pages = useMemo(() => {
    let currVal = active;
    const tempPages: Array<string | number> = Array.from({ length: pagesNo }, (_, i) => i + 1);
    if (currVal < 2) {
      currVal = 2;
    }
    if (currVal < pagesNo - 2) {
      tempPages.splice(currVal + 1, tempPages.length - currVal - 2, '...');
    }
    if (currVal > 3) {
      tempPages.splice(1, currVal - 3, '...');
    }
    tempPages.unshift('<');
    tempPages.push('>');
    return tempPages;
  }, [pagesNo, active]);

  const changePage = useCallback(
    (page: number | string) => {
      if ((page as number) < 1 || (page as number) > pagesNo) {
        return;
      }
      const origActive = active;
      let currVal = active;
      if (page === '<' && active > 1) {
        currVal--;
      } else if (page === '>' && active < pagesNo) {
        currVal++;
      } else {
        currVal = page as number;
      }
      if (origActive !== currVal) {
        onChangePage(currVal);
        setActive(currVal);
      }
    },
    [active, pagesNo, onChangePage]
  );

  const togglePagePicker = useCallback(() => {
    setShowPagePicker(pagePicker => !pagePicker);
    setPagePickerText('');
  }, []);

  const onPressPagePicker = useCallback(() => {
    if (pagePickerText) {
      changePage(parseInt(pagePickerText, 10));
    }
    togglePagePicker();
  }, [pagePickerText, changePage, togglePagePicker]);

  return (
    <View style={styles.container}>
      {pages.map((p, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => changePage(p)}
          onLongPress={togglePagePicker}
          disabled={p.toString() === '...'}
          style={{ padding: 7 }}
        >
          <Text
            style={{
              color: active === p ? appColor : isDark ? '#9EC0DC' : 'black',
              fontFamily: active === p ? 'OpenSans-Bold' : 'OpenSans',
            }}
          >
            {p}
          </Text>
        </TouchableOpacity>
      ))}
      <Modal
        animationType='slide'
        onRequestClose={togglePagePicker}
        supportedOrientations={['portrait', 'landscape']}
        transparent={true}
        visible={showPagePicker}
      >
        <TouchableOpacity onPress={togglePagePicker} style={styles.pagePickerContainer}>
          <SafeAreaView edges={['top']}>
            <TextInput
              autoFocus={true}
              style={styles.textInput}
              onChangeText={page => setPagePickerText(page)}
              placeholder='Type the page number...'
              placeholderTextColor='grey'
              keyboardType='number-pad'
              returnKeyType='go'
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
            <TouchableOpacity
              onPress={onPressPagePicker}
              style={{
                backgroundColor: appColor,
                padding: 20,
              }}
            >
              <Text style={styles.goText}>{'GO'}</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles: StyleProp<any> = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
  },
  pagePickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.5)',
    alignItems: 'center',
  },
  textInput: {
    marginTop: '5%',
    backgroundColor: 'white',
    padding: 20,
    minWidth: '30%',
    textAlign: 'center',
  },
  goText: {
    textAlign: 'center',
    color: 'white',
    fontFamily: 'OpenSans-Bold',
  },
});

export default Pagination;
