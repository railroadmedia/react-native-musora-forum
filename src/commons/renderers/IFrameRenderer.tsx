import React, { FunctionComponent } from 'react';
import type { CustomRendererProps, TBlock } from 'react-native-render-html';
import { HTMLIframe, useHtmlIframeProps } from '@native-html/iframe-plugin';

interface IIFrameRenderer {
  iFrameProps: CustomRendererProps<TBlock>;
  htmlWidth: number;
}

const IFrameRenderer: FunctionComponent<IIFrameRenderer> = props => {
  const { iFrameProps, htmlWidth } = props;
  const iframeProps = useHtmlIframeProps(iFrameProps);
  const src = iframeProps.htmlAttribs.src.startsWith('//')
    ? 'https:' + iframeProps.htmlAttribs.src
    : iframeProps.htmlAttribs.src;
  const attributes = iFrameProps?.tnode?.attributes;
  const ar = Number(attributes?.height) / Number(attributes?.width) || 9 / 16;

  return (
    <HTMLIframe
      {...iframeProps}
      source={{ uri: src + '?fs=0&modestbranding=1&rel=0' }}
      style={{
        width: htmlWidth > 420 ? 420 : htmlWidth,
        height: htmlWidth > 420 ? 420 * ar : htmlWidth * ar,
      }}
    />
  );
};

export default IFrameRenderer;
