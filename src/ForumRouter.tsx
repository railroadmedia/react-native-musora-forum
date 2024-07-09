import React, { FunctionComponent, useContext } from 'react';
import { Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import CRUD from './components/CRUD';
import Forums from './components/Forums';
import Thread from './components/Thread';
import Threads from './components/Threads';
import { setForumService } from './services/forum.service';
import { forumStore } from './redux/Store';
import type { AnyAction, Store } from 'redux';
import { RouteProp, useRoute } from '@react-navigation/native';
import type {
  StackNavigationOptions,
  TransitionSpec,
} from '@react-navigation/stack/lib/typescript/src/types';
import type { ForumRootStackParamList, IForumParams } from './entity/IRouteParams';

let store: Store<unknown, AnyAction>;
const Stack = createStackNavigator<ForumRootStackParamList>();
const timingAnim: TransitionSpec = {
  animation: 'timing',
  config: { duration: 250, easing: Easing.out(Easing.circle) },
};
const screenOptions: StackNavigationOptions = {
  gestureEnabled: true,
  transitionSpec: { open: timingAnim, close: timingAnim },
  animationEnabled: false,
  headerMode: 'screen',
  headerShown: false,
};

const ForumRouter: FunctionComponent<{ isDark: boolean }> = ({ isDark }) => {
  const { params }: RouteProp<{ params: IForumParams }, 'params'> = useRoute();
  const { tryCall, NetworkContext, reduxStore, postId, threadId, categoryId, brand } = params;
  const networkContext = useContext(NetworkContext);

  setForumService({
    tryCall,
    NetworkContext,
    networkContext,
    brand: brand || 'drumeo',
  });

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
          screenOptions={screenOptions}
        >
          <Stack.Screen name='Forums' initialParams={params as any}>
            {screenProps => <Forums {...screenProps} isDark={isDark} />}
          </Stack.Screen>
          <Stack.Screen
            name='Threads'
            component={Threads}
            initialParams={{ ...params, isDark: isDark } as any}
          />
          <Stack.Screen
            name='CRUD'
            component={CRUD}
            initialParams={{ ...params, isDark: isDark } as any}
          />
          <Stack.Screen
            name='Thread'
            component={Thread}
            initialParams={{ ...params, isDark: isDark } as any}
          />
        </Stack.Navigator>
      </KeyboardAvoidingView>
    </Provider>
  );
};

export default ForumRouter;
