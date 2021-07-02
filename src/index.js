import React, { useContext } from 'react';
import { Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';

import CRUD from './components/CRUD';
import Threads from './components/Threads';
import Thread from './components/Thread';
import Forums from './components/Forums';
import Search from './commons/Search.js';

import NavigationHeader from './commons/NavigationHeader';

import { setForumService } from './services/forum.service';

import threadsReducer from './redux/ThreadReducer';

let store;
const Stack = createStackNavigator();
const timingAnim = {
  animation: 'timing',
  config: { duration: 250, easing: Easing.out(Easing.circle) }
};

export default ({
  route: {
    params,
    params: {
      tryCall,
      rootUrl,
      NetworkContext,
      isDark,
      reduxStore,
      postId,
      threadTitle
    }
  }
}) => {
  const networkContext = useContext(NetworkContext);
  setForumService({ tryCall, rootUrl, networkContext, NetworkContext });
  if (!store)
    store =
      reduxStore?.injectReducer('threads', threadsReducer.threads) ||
      createStore(combineReducers({ ...threadsReducer }));
  return (
    <Provider store={store}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{ flex: 1, backgroundColor: isDark ? '#00101d' : 'white' }}
      >
        <Stack.Navigator
          initialRouteName={postId ? 'Thread' : 'Forums'}
          headerMode={'screen'}
          screenOptions={{
            gestureEnabled: false,
            transitionSpec: { open: timingAnim, close: timingAnim }
          }}
        >
          <Stack.Screen
            name='Forums'
            component={Forums}
            options={props => ({
              header: () => <NavigationHeader {...props} title={'Forums'} />
            })}
            initialParams={params}
          />
          <Stack.Screen
            name='Threads'
            component={Threads}
            options={props => ({
              header: () => (
                <NavigationHeader {...props} title={props.route.params.title} />
              )
            })}
            initialParams={params}
          />
          <Stack.Screen
            name='CRUD'
            component={CRUD}
            initialParams={params}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name='Thread'
            component={Thread}
            initialParams={params}
            options={props => ({
              header: () => (
                <NavigationHeader
                  {...props}
                  title={props.route.params.title || threadTitle}
                />
              )
            })}
          />
          <Stack.Screen
            name='Search'
            component={Search}
            initialParams={params}
          />
        </Stack.Navigator>
      </KeyboardAvoidingView>
    </Provider>
  );
};
