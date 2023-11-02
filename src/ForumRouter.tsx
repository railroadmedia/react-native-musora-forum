import React, { FunctionComponent, useContext, useEffect } from 'react';
import { Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import DeviceInfo from 'react-native-device-info';
import { Provider } from 'react-redux';
import CRUD from './components/CRUD';
import Forums from './components/Forums';
import Thread from './components/Thread';
import Threads from './components/Threads';
import { setForumService } from './services/forum.service';
import { forumStore } from './redux/Store';
import type { AnyAction, Store } from 'redux';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';
import type { ForumRootStackParamList, IForumParams } from './entity/IRouteParams';

let store: Store<unknown, AnyAction>;
const Stack = createStackNavigator<ForumRootStackParamList>();
const timingAnim: TransitionSpec = {
  animation: 'timing',
  config: { duration: 250, easing: Easing.out(Easing.circle) },
};

export const IS_TABLET = DeviceInfo.isTablet();

export const setTestID = (testID: string): string => {
  if (Platform.OS === 'ios') {
    return testID;
  } else {
    return `com.musoraapp:id/${testID}`;
  }
};

const ForumRouter: FunctionComponent = () => {
  const { params }: RouteProp<{ params: IForumParams }, 'params'> = useRoute();
  const { tryCall, NetworkContext, isDark, reduxStore, postId, threadId, categoryId } = params;
  const networkContext = useContext(NetworkContext);

  useEffect(() => {
    setForumService({
      tryCall,
      NetworkContext,
      networkContext,
    });
  }, [tryCall, NetworkContext]);

  if (!store) {
    store = reduxStore?.injectReducer(forumStore) || forumStore;
  }
  return (
    <Provider store={store}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: isDark ? '#00101d' : 'white' }}
      >
        <Stack.Navigator
          initialRouteName={categoryId ? 'Threads' : postId || threadId ? 'Thread' : 'Forums'}
          screenOptions={{
            gestureEnabled: true,
            transitionSpec: { open: timingAnim, close: timingAnim },
            animationEnabled: false,
            headerMode: 'screen',
          }}
        >
          <Stack.Screen
            name='Forums'
            component={Forums}
            initialParams={params as any}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name='Threads'
            component={Threads}
            initialParams={params as any}
            options={{ headerShown: false }}
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
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </KeyboardAvoidingView>
    </Provider>
  );
};

export default ForumRouter;
