import React, { FunctionComponent } from 'react';
import { StyleSheet, StyleProp, Text } from 'react-native';
import Tooltip, { TooltipProps } from 'react-native-walkthrough-tooltip';
import { RouteProp, useRoute } from '@react-navigation/native';
import { IForumParams } from '../entity/IRouteParams';

interface ICustomTooltip extends TooltipProps {
  text: string;
}

const CustomTooltip: FunctionComponent<ICustomTooltip> = props => {
  const { params }: RouteProp<{ params: IForumParams }, 'params'> = useRoute();
  const { appColor } = params;

  return (
    <Tooltip
      content={<Text style={styles.tooltipText}>{props.text}</Text>}
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
      color: '#FFF',
      fontFamily: 'OpenSans-Regular',
      fontSize: 13,
    },
    tooltipContainer: {
      paddingTop: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
  });
