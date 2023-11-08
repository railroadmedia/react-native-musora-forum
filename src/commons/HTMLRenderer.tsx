import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Text, View } from 'react-native';
import iframe from '@native-html/iframe-plugin';
import HTML, { IGNORED_TAGS, StylesDictionary } from 'react-native-render-html';
import WebView from 'react-native-webview';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { expandQuote } from '../assets/svgs';
import CustomModal from './CustomModal';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { IForumParams } from '../entity/IRouteParams';

interface IHTMLRenderer {
  html: string;
  tagsStyles: StylesDictionary | undefined;
  classesStyles?: StylesDictionary | undefined;
  olItemStyle?: StylesDictionary | undefined;
  ulItemStyle?: StylesDictionary | undefined;
}

const HTMLRenderer: FunctionComponent<IHTMLRenderer> = props => {
  const { html: htmlProp, tagsStyles, classesStyles, olItemStyle, ulItemStyle } = props;
  const { params }: RouteProp<{ params: IForumParams }, 'params'> = useRoute();
  const {
    isDark,
    appColor,
    rootUrl,
    brand: currBrand,
    user,
    decideWhereToRedirect,
    handleOpenUrl,
  } = params;
  const [html, setHtml] = useState('');
  const [expanderVisible, setExpanderVisible] = useState(false);
  const [maxQuoteHeight, setMaxQuoteHeight] = useState<number | undefined>();
  const [htmlWidth, setHtmlWidth] = useState(0);
  const [linkToOpen, setLinkToOpen] = useState<string>('');
  const customModalRef = useRef<React.ElementRef<typeof CustomModal>>(null);

  useEffect(() => {
    const lastBlockquote = htmlProp.lastIndexOf('</blockquote');
    if (lastBlockquote >= 0) {
      setHtml(
        htmlProp.substring(0, lastBlockquote) +
          '</blockquote></shadow><expander></expander>' +
          htmlProp.substring(lastBlockquote + 13)
      );
    } else {
      setHtml(htmlProp);
    }
  }, [htmlProp]);

  const evenOddQuoteClassification = useCallback((htmlString: string): string => {
    let i = 1;
    htmlString = htmlString?.replace(/<blockquote>/g, '<blockquote class="">');
    return htmlString
      ?.split('<blockquote')
      ?.map(blockquote => {
        if (i === 2) {
          blockquote = blockquote.replace('class="', `class="blockquote-first`);
        }
        blockquote = blockquote.replace(
          'class="',
          `class="${++i % 2 ? 'blockquote-odd ' : 'blockquote-even '}`
        );
        for (let j = 0; j < (blockquote.match(/<\/blockquote/g) || []).length; j++) {
          i--;
        }
        return blockquote;
      })
      .join('<blockquote');
  }, []);

  const onLayout = ({
    nativeEvent: {
      layout: { width },
    },
  }: LayoutChangeEvent): void => setHtmlWidth(width);

  return (
    <View onLayout={onLayout}>
      {!!htmlWidth ? (
        <HTML
          ignoredTags={IGNORED_TAGS.filter((tag: string) => tag !== 'video' && tag !== 'source')}
          key={`${expanderVisible}${maxQuoteHeight}`}
          ignoredStyles={['font-family', 'background-color', 'line-height']}
          WebView={WebView}
          source={{
            html: html
              ? `<div>${evenOddQuoteClassification(
                  html?.replace('<blockquote', '<shadow><blockquote class=""')
                )}</div>`
              : `</div>`,
          }}
          tagsStyles={tagsStyles}
          classesStyles={classesStyles}
          listsPrefixesRenderers={{
            ol: (_, __, ___, passProps) => (
              <Text style={olItemStyle} key={passProps.key}>
                {passProps.nodeIndex + 1}.{`  `}
              </Text>
            ),
            ul: (_, __, ___, { key }) => (
              <Text key={key} style={ulItemStyle}>
                ·{`  `}
              </Text>
            ),
          }}
          renderersProps={{
            iframe: {
              scalesPageToFit: true,
              webViewProps: {
                scrollEnabled: false,
                androidLayerType: 'hardware',
              },
            },
          }}
          renderers={{
            shadow: (_, children, __, { key }) => (
              <View style={classesStyles?.shadow} key={key}>
                {children}
              </View>
            ),
            blockquote: (htmlAttribs, children, _, { key }) => {
              const { class: className } = htmlAttribs;
              return (className as string)?.includes('blockquote') ? (
                <View
                  key={key}
                  onLayout={({
                    nativeEvent: {
                      layout: { height },
                    },
                  }) => {
                    if (
                      (className as string)?.includes('first') &&
                      height > 150 &&
                      !expanderVisible
                    ) {
                      setExpanderVisible(true);
                      setMaxQuoteHeight(150);
                    }
                  }}
                  style={[
                    {
                      padding: 10,
                      borderRadius: 5,
                      maxHeight: maxQuoteHeight,
                      overflow: 'hidden',
                    },
                    classesStyles?.[
                      (className as string)?.includes('odd') ? 'blockquote-odd' : 'blockquote-even'
                    ],
                  ]}
                >
                  {children}
                </View>
              ) : (
                children
              );
            },
            expander: (_, __, ___, { key }) =>
              expanderVisible ? (
                <TouchableOpacity
                  key={key}
                  disallowInterruption={true}
                  onPress={() =>
                    setMaxQuoteHeight(mQuoteHeight => (mQuoteHeight === 150 ? undefined : 150))
                  }
                  containerStyle={{
                    padding: 20,
                    paddingTop: 10,
                    alignSelf: 'flex-end',
                    paddingRight: maxQuoteHeight === 150 ? 0 : 20,
                    paddingLeft: maxQuoteHeight === 150 ? 20 : 0,
                    transform: [
                      {
                        rotate: `${maxQuoteHeight === 150 ? 0 : 180}deg`,
                      },
                    ],
                  }}
                >
                  {expandQuote({ height: 15, width: 15, fill: appColor })}
                </TouchableOpacity>
              ) : null,
            iframe: (htmlAttribs, children, convertedCSSStyles, passProps) => {
              const ar = (htmlAttribs?.height as number) / (htmlAttribs?.width as number) || 9 / 16;
              return (
                <View key={passProps.key}>
                  {iframe(
                    {
                      ...htmlAttribs,
                      src: htmlAttribs.src + '?fs=0&modestbranding=1&rel=0',
                      width: htmlWidth > 420 ? 420 : htmlWidth,
                      height: htmlWidth > 420 ? 420 * ar : htmlWidth * ar,
                    },
                    children,
                    convertedCSSStyles,
                    passProps
                  )}
                </View>
              );
            },
            source: (htmlAttribs, _, __, passProps) => {
              if (!htmlAttribs.src) {
                return null;
              }
              const ar = (htmlAttribs?.height as number) / (htmlAttribs?.width as number) || 9 / 16;

              return (
                <View onStartShouldSetResponder={() => true} key={passProps.key}>
                  <WebView
                    originWhitelist={['*']}
                    androidLayerType={'hardware'}
                    automaticallyAdjustContentInsets={true}
                    allowsInlineMediaPlayback={true}
                    scrollEnabled={false}
                    source={{
                      html: `
                    <body style="margin: 0">
                      <video width="100%" height="100%" controls style="background: black; margin: 0;" playsinline>
                          <source src="${htmlAttribs.src}" type="video/mp4">
                      </video>
                    </body>
                    `,
                    }}
                    style={{
                      width: htmlWidth,
                      height: htmlWidth * ar,
                      backgroundColor: 'black',
                    }}
                  />
                </View>
              );
            },
            a: ({ href }, children, _, { onLinkPress, key }) => {
              const onPressLink = (): any => {
                let brand: string | string[] = rootUrl?.split('.');
                brand = [brand.pop(), brand.pop()].reverse().join('.');
                brand = brand.substring(0, brand.indexOf('.com') + 4);
                if (!(href as string)?.includes('http')) {
                  return null;
                }
                if ((href as string).toLowerCase()?.includes(brand)) {
                  let urlBrand = (href as string).substring((href as string).indexOf('.com') + 5);
                  if (urlBrand?.includes('/')) {
                    urlBrand = urlBrand.substring(0, urlBrand.indexOf('/'));
                  }
                  if (currBrand !== urlBrand) {
                    setLinkToOpen(href as string);
                    return customModalRef.current?.toggle(
                      `This link will take you to ${
                        urlBrand.charAt(0).toUpperCase() + urlBrand.slice(1)
                      }!`,
                      `Clicking this link will take you to the ${
                        urlBrand.charAt(0).toUpperCase() + urlBrand.slice(1)
                      } members' area, and you won't be able to return directly to this post.`,
                      `GO TO ${urlBrand.toUpperCase()}`
                    );
                  }
                  return decideWhereToRedirect(
                    href as string,
                    { brandName: currBrand || 'drumeo', color: appColor },
                    user || {},
                    isDark
                  );
                }
                if (href) {
                  onLinkPress?.(_, href as string, _);
                }
              };
              return (
                <Text key={key}>
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity
                      style={{ marginBottom: -3, marginRight: 2 }}
                      disallowInterruption={true}
                      onPress={onPressLink}
                    >
                      <Text>{children}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text onPress={onPressLink}>{children}</Text>
                  )}
                </Text>
              );
            },
            p: (_, children, key) => <Text key={key}>{children}</Text>,
          }}
        />
      ) : null}
      <CustomModal
        ref={customModalRef}
        isDark={isDark}
        appColor={appColor}
        onAction={() => handleOpenUrl(linkToOpen)}
        onCancel={true}
      />
    </View>
  );
};

export default HTMLRenderer;
