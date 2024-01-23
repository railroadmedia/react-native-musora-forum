import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IThreadsAction,
  SETALL,
  SETFOLLOWED,
  SETFORUMRULES,
  SETFORUMS,
  SETPOSTS,
  SETSEARCH,
  TOGGLESIGN,
  UPDATEPOSTS,
  UPDATETHREADS,
} from './ThreadActions';
import type IThreadsState from './IThreadState';

const threadsReducer = (
  state: IThreadsState = { signShown: false },
  action: IThreadsAction
): IThreadsState => {
  switch (action.type) {
    case SETFORUMS:
      return {
        ...state,
        forums: Object.assign({}, ...action.threads?.map(t => ({ [t.id]: t }))),
      };
    case SETFORUMRULES:
      return { ...state, forumRules: action.forumRules };
    case SETALL:
      return {
        ...state,
        all: Object.assign({}, ...action.threads?.map(t => ({ [t.id]: t }))),
      };
    case SETSEARCH:
      return {
        ...state,
        search: Object.assign({}, ...action.threads?.map(t => ({ [t.id]: t }))),
      };
    case SETFOLLOWED:
      return {
        ...state,
        followed: Object.assign({}, ...action.threads?.map(t => ({ [t.id]: t }))),
      };
    case UPDATETHREADS:
      let forums = {};
      let followed = {};
      let search = {};
      let all = {};
      const thread = action.thread;
      if (state.all?.[thread.id]) {
        all = { [thread.id]: thread };
      }
      if (state?.forums?.[thread.id]) {
        forums = { [thread.id]: thread };
      }
      if (state.followed?.[thread.id]) {
        followed = { [thread.id]: thread };
      }
      if (state.search?.[thread.id]) {
        search = { [thread.id]: thread };
      }
      return {
        ...state,
        all: { ...state.all, ...all },
        forums: { ...state?.forums, ...forums },
        followed: { ...state.followed, ...followed },
        search: { ...state.search, ...search },
      };
    case TOGGLESIGN:
      AsyncStorage.setItem('signShown', state.signShown ? '' : '1');
      return {
        ...state,
        signShown: !state.signShown,
      };
    case SETPOSTS:
      return {
        ...state,
        posts: Object.assign({}, ...action.posts?.map(p => ({ [p.id]: p }))),
      };
    case UPDATEPOSTS:
      return { ...state, posts: { ...state.posts, [action.post.id]: action.post } };
    default:
      return state;
  }
};

export default threadsReducer;
