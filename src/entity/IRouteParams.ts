import type { IPost, IUser } from './IForum';

export type IBrand = 'drumeo' | 'pianote' | 'guitareo' | 'singeo';
export interface IForumParams {
  isDark: boolean;
  NetworkContext: any;
  tryCall: any;
  decideWhereToRedirect: (
    url: string,
    selectedBrand: { brandName: IBrand; color: string },
    user: IUser,
    isThemeDark: boolean
  ) => Promise<void>;
  handleOpenUrl: any;
  reduxStore: any;
  bottomPadding: number;
  user?: IUser;
  brand?: IBrand;
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
  quotes?: IPost[] | Array<{ content: string }>;
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
