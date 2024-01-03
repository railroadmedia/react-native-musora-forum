import type { IThread, IPost } from '../../entity/IForum';

export const SETFORUMS = 'SETFORUMS';
export const SETFORUMRULES = 'SETFORUMRULES';
export const SETALL = 'SETALL';
export const SETSEARCH = 'SETSEARCH';
export const SETFOLLOWED = 'SETFOLLOWED';
export const UPDATETHREADS = 'UPDATETHREADS';
export const TOGGLESIGN = 'TOGGLESIGN';
export const SETPOSTS = 'SETPOSTS';
export const UPDATEPOSTS = 'UPDATEPOSTS';

export type IThreadsAction =
  | { type: typeof SETFORUMS; threads: IThread[] }
  | { type: typeof SETFORUMRULES; forumRules: IThread }
  | { type: typeof SETALL; threads: IThread[] }
  | { type: typeof SETSEARCH; threads: IThread[] }
  | { type: typeof SETFOLLOWED; threads: IThread[] }
  | { type: typeof UPDATETHREADS; thread: IThread }
  | { type: typeof TOGGLESIGN }
  | { type: typeof SETPOSTS; posts: IPost[] }
  | { type: typeof UPDATEPOSTS; post: IPost };

export const setForumsThreads = (threads: IThread[]): IThreadsAction => ({
  threads,
  type: SETFORUMS,
});

export const setAllThreads = (threads: IThread[]): IThreadsAction => ({ threads, type: SETALL });

export const setSearchThreads = (threads: IThread[]): IThreadsAction => ({
  threads,
  type: SETSEARCH,
});

export const setFollowedThreads = (threads: IThread[]): IThreadsAction => ({
  threads,
  type: SETFOLLOWED,
});

export const updateThreads = (thread: IThread): IThreadsAction => ({ thread, type: UPDATETHREADS });

export const toggleSignShown = (): IThreadsAction => ({ type: TOGGLESIGN });

export const setPosts = (posts: IPost[]): IThreadsAction => ({ posts, type: SETPOSTS });

export const updatePosts = (post: IPost): IThreadsAction => ({ post, type: UPDATEPOSTS });

export const setForumRules = (forumRules: IThread): IThreadsAction => ({
  forumRules,
  type: SETFORUMRULES,
});
