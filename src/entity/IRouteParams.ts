import type { IPost, IUser } from './IForum';

export interface IForumParams {
  isDark: boolean;
  NetworkContext: any;
  tryCall: any;
  decideWhereToRedirect: any;
  handleOpenUrl: any;
  reduxStore: any;
  bottomPadding: number;
  user?: IUser;
  brand?: string;
  rootUrl: string;
  appColor: string;
  threadTitle?: string;
  threadId?: number;
  postId?: number;
  categoryId?: string;
}

export interface IThreadsParams {
  title: string;
  forumId: number;
}

export interface ICRUDParams {
  type: 'thread' | 'post';
  action: 'edit' | 'create';
  forumId?: number;
  threadId?: number;
  postId?: number;
  quotes?: IPost[] & Array<{ content: string }>;
  onPostCreated?: (postId?: number) => void;
  onDelete?: (postId: number) => void;
}

export interface IThreadParams {
  title?: string;
  isForumRules?: boolean;
  threadId?: number;
  postId?: number;
  page?: number;
}

export type ForumRootStackParamList = {
  Forums: undefined;
  Threads: IThreadsParams;
  CRUD: ICRUDParams;
  Thread: IThreadParams;
  CoachOverview: { coachId: number };
};
