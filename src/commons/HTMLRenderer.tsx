import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Linking, Platform, Text, View } from 'react-native';
import { HTMLIframe, iframeModel, useHtmlIframeProps } from '@native-html/iframe-plugin';
import HTML, {
  HTMLContentModel,
  HTMLElementModel,
  defaultHTMLElementModels,
} from 'react-native-render-html';
import WebView from 'react-native-webview';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { expandQuote } from '../assets/svgs';
import CustomModal from './CustomModal';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { IForumParams } from '../entity/IRouteParams';

interface IHTMLRenderer {
  html: string;
  tagsStyles: any;
  classesStyles?: any;
}

const HTMLRenderer: FunctionComponent<IHTMLRenderer> = props => {
  const { html: htmlProp, tagsStyles, classesStyles } = props;
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

  const IframeRenderer = function IframeRenderer(props) {
    const iframeProps = useHtmlIframeProps(props);
    const src = iframeProps.htmlAttribs.src.startsWith('//')
      ? 'https:' + iframeProps.htmlAttribs.src
      : iframeProps.htmlAttribs.src;
    const attributes = props?.tnode?.attributes;
    const ar = (attributes?.height as number) / (attributes?.width as number) || 9 / 16;
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

  const ATagRenderer = useCallback(
    ({ tnode, TNodeChildrenRenderer, style }) => {
      const href = (tnode?.attributes?.href as string) || '';
      const onPressLink = () => {
        let brand: string | string[] = rootUrl?.split('.');
        brand = [brand.pop(), brand.pop()].reverse().join('.');
        brand = brand.substring(0, brand.indexOf('.com') + 4);
        if (!href?.includes('http')) {
          return null;
        }
        if (href?.toLowerCase()?.includes(brand)) {
          let urlBrand = href?.substring(href?.indexOf('.com') + 5);
          if (urlBrand?.includes('/')) {
            urlBrand = urlBrand.substring(0, urlBrand.indexOf('/'));
          }
          if (currBrand !== urlBrand) {
            setLinkToOpen(href);
            return customModalRef.current?.toggle(
              `This link will take you to ${urlBrand.charAt(0).toUpperCase() + urlBrand.slice(1)}!`,
              `Clicking this link will take you to the ${
                urlBrand.charAt(0).toUpperCase() + urlBrand.slice(1)
              } members' area, and you won't be able to return directly to this post.`,
              `GO TO ${urlBrand.toUpperCase()}`
            );
          }
          return decideWhereToRedirect(
            href,
            { brandName: currBrand || 'drumeo', color: appColor },
            user || {},
            isDark
          );
        }
        if (href) {
          Linking.openURL(href);
        }
      };

      return (
        <Text>
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={{ marginBottom: -3, marginRight: 2 }}
              disallowInterruption={true}
              onPress={onPressLink}
            >
              <Text style={style}>
                <TNodeChildrenRenderer tnode={tnode} />
              </Text>
            </TouchableOpacity>
          ) : (
            <Text onPress={onPressLink}>
              <TNodeChildrenRenderer tnode={tnode} />
            </Text>
          )}
        </Text>
      );
    },
    [appColor, currBrand, decideWhereToRedirect, isDark, rootUrl, user]
  );

  return (
    <View onLayout={onLayout}>
      {!!htmlWidth ? (
        <HTML
          key={`${expanderVisible}${maxQuoteHeight}`}
          ignoredStyles={['fontFamily', 'backgroundColor', 'lineHeight']}
          WebView={WebView}
          source={{
            html: html
              ? `<div>${evenOddQuoteClassification(
                  html?.replace('<blockquote', '<shadow><blockquote class=""')
                )}</div>`
              : `</div>`,
          }}
          systemFonts={['OpenSans']}
          tagsStyles={tagsStyles}
          classesStyles={classesStyles}
          contentWidth={htmlWidth}
          renderersProps={{
            iframe: {
              scalesPageToFit: true,
              webViewProps: {
                scrollEnabled: false,
                androidLayerType: 'hardware',
              },
            },
          }}
          customHTMLElementModels={{
            shadow: HTMLElementModel.fromCustomModel({
              tagName: 'shadow',
              mixedUAStyles: classesStyles?.shadow,
              contentModel: HTMLContentModel.mixed,
            }),
            expander: HTMLElementModel.fromCustomModel({
              tagName: 'expander',
              contentModel: HTMLContentModel.mixed,
            }),
            iframe: iframeModel,
            a: defaultHTMLElementModels.a.extend({
              contentModel: HTMLContentModel.mixed,
            }),
          }}
          renderers={{
            blockquote: ({ tnode, TNodeChildrenRenderer }) =>
              tnode?.attributes?.class?.includes('blockquote') ? (
                <View
                  onLayout={({
                    nativeEvent: {
                      layout: { height },
                    },
                  }) => {
                    if (
                      tnode?.attributes?.class?.includes('first') &&
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
                      tnode?.attributes?.class?.includes('odd')
                        ? 'blockquote-odd'
                        : 'blockquote-even'
                    ],
                  ]}
                >
                  <TNodeChildrenRenderer tnode={tnode} />
                </View>
              ) : (
                <TNodeChildrenRenderer tnode={tnode} />
              ),
            expander: () =>
              expanderVisible ? (
                <TouchableOpacity
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
            iframe: IframeRenderer,
            source: ({ tnode }) => {
              const attributes = tnode?.attributes;
              if (!attributes?.src) {
                return null;
              }
              const ar = (attributes?.height as number) / (attributes?.width as number) || 9 / 16;

              return (
                <View onStartShouldSetResponder={() => true}>
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
                          <source src="${attributes.src}" type="video/mp4">
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
            a: ATagRenderer,
            p: ({ tnode, TNodeChildrenRenderer }) => (
              <Text>
                <TNodeChildrenRenderer tnode={tnode} />
              </Text>
            ),
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
