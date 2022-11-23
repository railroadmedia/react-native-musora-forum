import React from 'react';
import { Text, View } from 'react-native';
import iframe from '@native-html/iframe-plugin';
import HTML from 'react-native-render-html';
import WebView from 'react-native-webview';
import { expandQuote } from '../assets/svgs';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { IGNORED_TAGS } from 'react-native-render-html/src/HTMLUtils';

import { getRootUrl, decideWhereToRedirect } from '../services/forum.service';

export default class HTMLRenderer extends React.Component {
  state = { expanderVisible: false, maxQuoteHeight: undefined, width: 0 };

  render() {
    let { html, tagsStyles, classesStyles, olItemStyle, ulItemStyle, appColor } = this.props;
    let { expanderVisible, maxQuoteHeight } = this.state;
    let lastBlockquote = html.lastIndexOf('</blockquote>');
    if (lastBlockquote >= 0)
      html =
        html.substring(0, lastBlockquote) +
        '</blockquote></shadow><expander></expander>' +
        html.substring(lastBlockquote + 13);
    return (
      <View
        onLayout={({
          nativeEvent: {
            layout: { width },
          },
        }) => this.setState({ width })}
      >
        {this.state.width ? (
          <HTML
            ignoredTags={IGNORED_TAGS.filter(tag => tag !== 'video' && tag !== 'source')}
            key={`${expanderVisible}${maxQuoteHeight}`}
            ignoredStyles={['font-family', 'background-color', 'line-height']}
            WebView={WebView}
            source={{
              html: `<div>${evenOddQuoteClassification(
                html.replace('<blockquote', '<shadow><blockquote class=""')
              )}</div>`,
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
                  // containerStyle: { width: 300 }
                },
              },
            }}
            renderers={{
              shadow: (_, children, __, { key }) => (
                <View style={classesStyles.shadow} key={key}>
                  {children}
                </View>
              ),
              blockquote: (htmlAttribs, children, _, { key }) => {
                let { class: className } = htmlAttribs;
                return className?.includes('blockquote') ? (
                  <View
                    key={key}
                    onLayout={({
                      nativeEvent: {
                        layout: { height },
                      },
                    }) => {
                      if (className?.includes('first') && height > 150 && !expanderVisible)
                        this.setState({
                          expanderVisible: true,
                          maxQuoteHeight: 150,
                        });
                    }}
                    style={[
                      {
                        padding: 10,
                        borderRadius: 5,
                        maxHeight: maxQuoteHeight,
                        overflow: 'hidden',
                      },
                      classesStyles[
                        className?.includes('odd') ? 'blockquote-odd' : 'blockquote-even'
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
                      this.setState(({ maxQuoteHeight }) => ({
                        maxQuoteHeight: maxQuoteHeight === 150 ? undefined : 150,
                      }))
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
                let { width, height } = htmlAttribs,
                  ar = height / width || 9 / 16;
                return (
                  <View onStartShouldSetResponder={() => true} key={passProps.key}>
                    {iframe(
                      {
                        ...htmlAttribs,
                        src: htmlAttribs.src + '?fs=0&modestbranding=1&rel=0',
                        width: this.state.width > 420 ? 420 : this.state.width,
                        height: this.state.width > 420 ? 420 * ar : this.state.width * ar,
                      },
                      children,
                      convertedCSSStyles,
                      passProps
                    )}
                  </View>
                );
              },
              source: (htmlAttribs, _, __, passProps) => {
                if (!htmlAttribs.src) return null;
                let { width, height } = htmlAttribs,
                  ar = height / width || 9 / 16;
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
                        width: this.state.width,
                        height: this.state.width * ar,
                        backgroundColor: 'black',
                      }}
                    />
                  </View>
                );
              },
              a: ({ href }, children, _, { onLinkPress, key }) => {
                if (!href.includes('http')) return null;
                return (
                  <TouchableOpacity
                    key={key}
                    style={{ marginBottom: -3, marginRight: 2 }}
                    disallowInterruption={true}
                    onPress={() => {
                      let brand = getRootUrl().split('.');
                      brand = [brand.pop(), brand.pop()].reverse().join('.');
                      brand = brand.substring(0, brand.indexOf('.com') + 4);
                      if (href.toLowerCase()?.includes(brand)) return decideWhereToRedirect(href);
                      if (href) onLinkPress(null, href);
                    }}
                  >
                    <Text>{children}</Text>
                  </TouchableOpacity>
                );
              },
            }}
          />
        ) : null}
      </View>
    );
  }
}

const evenOddQuoteClassification = html => {
  let i = 1;
  html = html.replace(/<blockquote>/g, '<blockquote class="">');
  return html
    .split('<blockquote')
    .map(blockquote => {
      if (i === 2) blockquote = blockquote.replace('class="', `class="blockquote-first`);
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
};
