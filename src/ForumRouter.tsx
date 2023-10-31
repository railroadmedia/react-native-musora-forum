import React, { FunctionComponent, useContext } from 'react';
import { Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import DeviceInfo from 'react-native-device-info';

import { Provider } from 'react-redux';
import Search from './commons/Search';
import CRUD from './components/CRUD';
import Forums from './components/Forums';
import Thread from './components/Thread';
import Threads from './components/Threads';
import type { IPost } from './entity/IForum';
import { setForumService } from './services/forum.service';
import { forumStore } from './redux/Store';
import type { AnyAction, Store } from 'redux';

export type ForumRootStackParamList = {
  Forums: undefined;
  Threads: { title: string; forumId: number };
  CRUD: {
    type: 'thread' | 'post';
    action: 'edit' | 'create';
    forumId?: number;
    threadId?: number;
    postId?: number;
    quotes?: IPost[] | [];
    onPostCreated?: (postId?: number) => void;
    onDelete?: () => void;
  };
  Thread: {
    title?: string;
    isForumRules?: boolean;
    threadId?: number;
    postId?: number;
  };
  Search: undefined;
  CoachOverview: { coachId: number };
};

let store: Store<unknown, AnyAction>;
const Stack = createStackNavigator<ForumRootStackParamList>();
const timingAnim = {
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

export interface IForumParams {
  isDark: boolean;
  NetworkContext: any;
  tryCall: any;
  decideWhereToRedirect: any;
  handleOpenUrl: any;
  bottomPadding: number;
  user?: any;
  brand?: string;
  rootUrl: string;
  appColor: string;
  threadTitle?: string;
  threadId?: number;
  postId?: number;
  categoryId?: string;
}

const ForumRouter: FunctionComponent = ({ route: { params } }) => {
  const {
    tryCall,
    rootUrl,
    decideWhereToRedirect,
    handleOpenUrl,
    NetworkContext,
    isDark,
    reduxStore,
    postId,
    threadId,
    categoryId,
    brand,
    user,
    appColor,
  } = params;
  const networkContext = useContext(NetworkContext);
  setForumService({
    tryCall,
    rootUrl,
    networkContext,
    NetworkContext,
    decideWhereToRedirect,
    handleOpenUrl,
    brand,
    user,
    isDark,
    appColor,
  });
  if (!store) {
    store = reduxStore?.injectReducer(forumStore) || forumStore;
  }
  return (
    <Provider store={store}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
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
            initialParams={params}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name='Threads'
            component={Threads}
            initialParams={params}
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
          <Stack.Screen name='Search' component={Search} initialParams={params} />
        </Stack.Navigator>
      </KeyboardAvoidingView>
    </Provider>
  );
};

export default ForumRouter;
