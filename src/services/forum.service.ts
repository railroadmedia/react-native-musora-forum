import type { IForum, ISearchItem, IThread } from '../entity/IForum';
import type { IResponse, IResponseBody } from '../entity/IResponse';
import type { IBrand } from '../entity/IRouteParams';

export const setForumService = function (
  this: any,
  options: {
    tryCall: any;
    networkContext: any;
    NetworkContext: any;
    brand: IBrand;
  }
): void {
  // setting tryCall, NetworkContext etc
  Object.assign(this, options);
};
export const connection = (alert: boolean): boolean | undefined => {
  if ((this as any)?.networkContext?.isConnected) {
    return true;
  }
  if (alert) {
    (this as any)?.networkContext?.showNoConnectionAlert();
  }
};
export const NetworkContext = function (this: any): any {
  return (this as any)?.NetworkContext;
};

interface IForumsRes extends IResponseBody {
  results: IForum[];
}
export const getForums = (): IResponse<IForumsRes> =>
  (this as any)?.tryCall?.get(`/forums/api/discussions/index?brand=${(this as any)?.brand}`);

interface IThreadsRes extends IResponseBody {
  results: IThread[];
}
export const getAllThreads = (forumId: number, page = 1): IResponse<IThreadsRes> =>
  (this as any)?.tryCall.get(
    `/forums/api/thread/index?amount=10&page=${page}&brand=${(this as any)?.brand}&category_id=${
      forumId || ''
    }`
  );

interface IFollowedThreadsRes extends IResponseBody {
  results: IThread[];
}
export const getFollowedThreads = (
  forumId?: number,
  page?: number
): IResponse<IFollowedThreadsRes> =>
  (this as any)?.tryCall.get(
    `/forums/api/thread/index?amount=10&page=${page || 1}&brand=${(this as any)
      ?.brand}&followed=1&category_id=${forumId || ''}`
  );

export const getThread = (
  threadId: number | undefined,
  page = 1,
  isForumRules: boolean | undefined,
  postId: number | undefined
): IResponse<IThread> =>
  (this as any)?.tryCall.get(
    isForumRules
      ? `/forums/api/rules?brand=${(this as any)?.brand}`
      : postId
        ? `/forums/api/jump-to-post/${postId}?brand=${(this as any)?.brand}`
        : `/forums/api/thread/show/${threadId}?amount=10&page=${page}&brand=${(this as any)?.brand}`
  );

interface ISearchRes extends IResponseBody {
  results: ISearchItem[];
}
export const search = (text: string, page: number): IResponse<ISearchRes> =>
  (this as any)?.tryCall.get(
    `/forums/api/search?amount=10&term=${text}&page=${page || 1}&brand=${(this as any)?.brand}`
  );

export const followThread = (id: number): IResponse =>
  (this as any)?.tryCall.put(`/forums/api/thread/follow/${id}?brand=${(this as any)?.brand}`);

export const unfollowThread = (id: number): IResponse =>
  (this as any)?.tryCall.delete(`/forums/api/thread/unfollow/${id}?brand=${(this as any)?.brand}`);

export const createThread = (
  title: string,
  content: string,
  category_id: number
): IResponse<{ id: number }> =>
  (this as any)?.tryCall.put(`/forums/api/thread/store?brand=${(this as any)?.brand}`, {
    title,
    first_post_content: content,
    category_id,
  });

export const updateThread = (
  id: number,
  body: { title?: string; locked?: boolean; pinned?: boolean }
): IResponse<{ id: number }> =>
  (this as any)?.tryCall.patch(
    `/forums/api/thread/update/${id}?brand=${(this as any)?.brand}`,
    body
  );

export const deleteThread = (id: number): IResponse<{ id: number }> =>
  (this as any)?.tryCall.delete(`/forums/api/thread/delete/${id}?brand=${(this as any)?.brand}`);

export const likePost = (id: number): IResponse =>
  (this as any)?.tryCall.put(`/forums/api/post/like/${id}?brand=${(this as any)?.brand}`);

export const disLikePost = (id: number): IResponse =>
  (this as any)?.tryCall.delete(`/forums/api/post/unlike/${id}?brand=${(this as any)?.brand}`);

export const reportPost = (id: number): IResponse =>
  (this as any)?.tryCall.put(`/forums/api/post/report/${id}?brand=${(this as any)?.brand}`);

export const createPost = (body: {
  content: string;
  thread_id: number;
  parent_ids: number[] | undefined;
}): IResponse<{ id: number }> =>
  (this as any)?.tryCall.put(`/forums/api/post/store?brand=${(this as any)?.brand}`, body);

export const editPost = (id: number, content: string): IResponse<{ id: number }> =>
  (this as any)?.tryCall.patch(`/forums/api/post/update/${id}?brand=${(this as any)?.brand}`, {
    content,
  });

export const deletePost = (id: number): IResponse =>
  (this as any)?.tryCall.delete(`/forums/api/post/delete/${id}?brand=${(this as any)?.brand}`);

export const reportUser = (id: number): IResponse<{ success: boolean }> =>
  (this as any)?.tryCall.put(
    `/user-management-system/user/report/${id}?brand=${(this as any)?.brand}`
  );

export const blockUser = (id: number): IResponse<{ success: boolean }> =>
  (this as any)?.tryCall.put(`/user-management-system/user/block/${id}`);
