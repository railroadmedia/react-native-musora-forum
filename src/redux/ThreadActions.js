export const setForumsThreads = threads => ({
  threads,
  type: 'SETFORUMS',
});

export const setAllThreads = threads => ({ threads, type: 'SETALL' });

export const setSearchThreads = threads => ({ threads, type: 'SETSEARCH' });

export const setFollowedThreads = threads => ({ threads, type: 'SETFOLLOWED' });

export const updateThreads = thread => ({ thread, type: 'UPDATETHREADS' });

export const toggleSignShown = () => ({ type: 'TOGGLESIGN' });

export const setPosts = posts => ({ posts, type: 'SETPOSTS' });

export const updatePosts = post => ({ post, type: 'UPDATEPOSTS' });

export const setForumRules = forumRules => ({
  forumRules,
  type: 'SETFORUMRULES',
});
