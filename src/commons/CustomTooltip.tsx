import React, { FunctionComponent } from 'react';
import { StyleSheet, StyleProp, Text } from 'react-native';
import Tooltip, { TooltipProps } from 'react-native-walkthrough-tooltip';
import { RouteProp, useRoute } from '@react-navigation/native';
import { IForumParams } from '../entity/IRouteParams';
import { IS_TABLET } from '../services/helpers';

interface ICustomTooltip extends TooltipProps {
  text: string;
}

const addBoldText = (text: any): any => {
  if (typeof text !== 'string') {
    return text;
  }
  if (text?.includes('<b>')) {
    const firstSplit = text?.split(/(?=<b>)/);
    const secondSplit = firstSplit.map(s => s.split(/<\/b>/));
    const newStrArray = secondSplit.flat().map((s, i) => {
      if (s.includes('<b>')) {
        return (
          <Text
            key={`${s.substring(s.indexOf('<b>') + 3)}${i}`}
            style={{ fontFamily: 'OpenSans-Bold' }}
          >
            {s.substring(s.indexOf('<b>') + 3)}
          </Text>
        );
      } else {
        return s;
      }
    });
    return newStrArray;
  }
  return text;
};

const CustomTooltip: FunctionComponent<ICustomTooltip> = props => {
  const { params }: RouteProp<{ params: IForumParams }, 'params'> = useRoute();
  const { appColor } = params;

  return (
    <Tooltip
      content={
        <Text style={[styles.tooltipText, { color: '#FFF' }]}>{addBoldText(props.text)}</Text>
      }
      contentStyle={[styles.tooltipContainer, { backgroundColor: appColor }]}
      closeOnContentInteraction={false}
      closeOnBackgroundInteraction={false}
      disableShadow
      {...props}
    >
      {props.children}
    </Tooltip>
  );
};

export default CustomTooltip;

const styles: StyleProp<any> = () =>
  StyleSheet.create({
    tooltipText: {
      fontFamily: 'OpenSans-Regular',
      fontSize: IS_TABLET ? 16 : 13,
    },
    tooltipContainer: {
      paddingTop: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
  });
