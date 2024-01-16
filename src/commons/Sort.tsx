import React, { FunctionComponent, ReactElement, useState } from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, Modal, SafeAreaView, Text } from 'react-native';
import { NewestSortIcon, OldestSortIcon, CompletedSvg } from '../assets/svgs';
import { ISvg } from '../entity/ISvg';
import LinearGradient from 'react-native-linear-gradient';
import { IS_IOS } from '../services/helpers';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { IForumParams, IThreadParams } from '../entity/IRouteParams';
import { connection } from '../services/forum.service';

type SearchText = 'Newest First' | 'Oldest First' | 'Mine';

type SortOption = {
  icon?: (svg: ISvg) => ReactElement;
  text: SearchText;
  selected: boolean;
};

interface ISort {
  onSort: (sortBy: string) => void;
  defaultSelectedSort: SearchText;
}

const Sort: FunctionComponent<ISort> = ({ onSort, defaultSelectedSort }) => {
  const { params }: RouteProp<{ params: IThreadParams & IForumParams }, 'params'> = useRoute();
  const { isDark, appColor } = params;

  const styles = setStyles(isDark, appColor);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([
    {
      icon: NewestSortIcon,
      text: 'Newest First',
      selected: defaultSelectedSort === 'Newest First',
    },
    {
      icon: OldestSortIcon,
      text: 'Oldest First',
      selected: defaultSelectedSort === 'Oldest First',
    },
    {
      icon: NewestSortIcon,
      text: 'Mine',
      selected: defaultSelectedSort === 'Mine',
    },
  ]);

  const toggleModal = (): void => {
    setShowSortModal(!showSortModal);
  };

  const applySort = (sortBy: SearchText): void => {
    if (!connection(true)) {
      return;
    }
    setSortOptions(sortOptions.map(s => ({ ...s, selected: s.text === sortBy })));
    toggleModal();
    switch (sortBy) {
      case 'Newest First': {
        onSort('-published_on');
        break;
      }
      case 'Oldest First': {
        onSort('published_on');
        break;
      }
      case 'Mine': {
        onSort('mine');
        break;
      }
    }
  };

  return (
    <>
      <TouchableOpacity onPress={toggleModal} style={styles.sortIcon}>
        {sortOptions
          .find(f => f.selected)
          ?.icon?.({ width: 22, height: 22, fill: isDark ?'#FFFFFF':'#00101D' })}
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={showSortModal}
        onRequestClose={toggleModal}
        supportedOrientations={['portrait', 'landscape']}
        animationType={'none'}
      >
        <LinearGradient
          style={styles.lgradient}
          colors={['rgba(0, 12, 23, 0.69)', 'rgba(0, 12, 23, 1)']}
        />
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={toggleModal}
          accessible={IS_IOS ? false : true}
          disabled={true}
        >
          <SafeAreaView style={styles.modalContent}>
            {sortOptions.map(({ text, selected, icon }) => (
              <TouchableOpacity
                key={text}
                onPress={() => applySort(text)}
                style={styles.touchableSorting}
                accessible={IS_IOS ? false : true}
              >
                {icon?.({ width: 25, height: 25, fill: '#FFFFFF' })}
                <Text
                  style={[
                    styles.touchableTextSorting,
                    selected ? styles.touchableTextSortingSelected : undefined,
                  ]}
                >
                  {text}
                </Text>
                {selected && CompletedSvg({ width: 18, height: 18, fill: '#FFFFFF' })}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.touchableSorting, { justifyContent: 'center' }]}
              onPress={toggleModal}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const setStyles: StyleProp<any> = (isDark: boolean, appColor: string) =>
  StyleSheet.create({
    sortIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 35,
      width: 35,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: isDark ? '#445F74' : '#CBCBCD',
      backgroundColor: isDark ? '#000C17' : '#FFF',
    },
    modalBackground: {
      flex: 1,
      alignItems: 'stretch',
      justifyContent: 'flex-end',
    },
    modalContent: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    touchableSorting: {
      padding: 15,
      alignItems: 'center',
      flexDirection: 'row',
    },
    touchableTextSorting: {
      fontSize: 16,
      fontFamily: 'OpenSans',
      color: '#FFFFFF',
      marginHorizontal: 10,
    },
    touchableTextSortingSelected: {
      fontFamily: 'OpenSans-Bold',
    },
    closeBtnText: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 16,
      color: '#FFFFFF',
    },
	lgradient: {
		width: '100%',
	height: '100%',
	position: 'absolute',
	top: 0,
	zIndex: 0,
	},
  });

export default Sort;