import AsyncStorage from '@react-native-async-storage/async-storage';

const threadsReducer = (
  state = { signShown: false },
  { type, threads, thread, posts, post, forumRules }
) => {
  switch (type) {
    case 'SETFORUMS':
      return {
        ...state,
        forums: Object.assign({}, ...threads.map(t => ({ [t.id]: t }))),
      };
    case 'SETFORUMRULES':
      return { ...state, forumRules };
    case 'SETALL':
      return {
        ...state,
        all: Object.assign({}, ...threads.map(t => ({ [t.id]: t }))),
      };
    case 'SETSEARCH':
      return {
        ...state,
        search: Object.assign({}, ...threads.map(t => ({ [t.id]: t }))),
      };
    case 'SETFOLLOWED':
      return {
        ...state,
        followed: Object.assign({}, ...threads.map(t => ({ [t.id]: t }))),
      };
    case 'UPDATETHREADS':
      let forums = {},
        followed = {},
        search = {},
        all = {};
      if (state.all?.[thread.id]) all = { [thread.id]: thread };
      if (state.forums?.[thread.id]) forums = { [thread.id]: thread };
      if (state.followed?.[thread.id]) followed = { [thread.id]: thread };
      if (state.search?.[thread.id]) search = { [thread.id]: thread };
      return {
        ...state,
        all: { ...state.all, ...all },
        forums: { ...state.forums, ...forums },
        followed: { ...state.followed, ...followed },
        search: { ...state.search, ...search },
      };
    case 'TOGGLESIGN':
      AsyncStorage.setItem('signShown', state.signShown ? '' : '1');
      return {
        ...state,
        signShown: !state.signShown,
      };
    case 'SETPOSTS':
      return {
        ...state,
        posts: Object.assign({}, ...posts.map(p => ({ [p.id]: p }))),
      };
    case 'UPDATEPOSTS':
      return { ...state, posts: { ...state.posts, [post.id]: post } };
    default:
      return state;
  }
};

export default { threads: threadsReducer };
