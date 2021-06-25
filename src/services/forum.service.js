export const setForumService = function (options) {
  // setting tryCall, rootUrl, NetworkContext etc
  Object.assign(this, options);
};
export const connection = function (alert) {
  if (this.networkContext.isConnected) return true;
  if (alert) this.networkContext.showNoConnectionAlert();
};
export const NetworkContext = function () {
  return this.NetworkContext;
};
export const getForums = function () {
  return this.tryCall({ url: `${this.rootUrl}/forums/api/discussions/index` });
};
export const getAllThreads = function (forumId, page = 1) {
  return this.tryCall({
    url: `${
      this.rootUrl
    }/forums/api/thread/index?amount=10&page=${page}&category_id=${
      forumId || ''
    }`
  });
};
export const getThread = function (threadId, page = 1, isForumRules, postId) {
  return this.tryCall({
    url: isForumRules
      ? `${this.rootUrl}/forums/api/rules`
      : postId
      ? `${this.rootUrl}/forums/api/jump-to-post/${postId}`
      : `${this.rootUrl}/forums/api/thread/show/${threadId}?amount=10&page=${page}`
  });
};
export const search = function (text, page = 1) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/search?amount=10&term=${text}&page=${page}`
  });
};
export const followThread = function (id) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/thread/follow/${id}`,
    method: 'PUT'
  });
};
export const unfollowThread = function (id) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/thread/unfollow/${id}`,
    method: 'DELETE'
  });
};
export const createThread = function (title, content, category_id) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/thread/store`,
    method: 'PUT',
    body: {
      title,
      first_post_content: content,
      category_id
    }
  });
};
export const updateThread = function (id, body) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/thread/update/${id}`,
    method: 'PATCH',
    body
  });
};
export const deleteThread = function (id) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/thread/delete/${id}`,
    method: 'DELETE'
  });
};
export const getFollowedThreads = function (forumId, page = 1) {
  return this.tryCall({
    url: `${
      this.rootUrl
    }/forums/api/thread/index?amount=10&page=${page}&followed=1&category_id=${
      forumId || ''
    }`
  });
};
export const likePost = function (id) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/post/like/${id}`,
    method: 'PUT'
  });
};
export const disLikePost = function (id) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/post/unlike/${id}`,
    method: 'DELETE'
  });
};
export const reportPost = function (id) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/post/report/${id}`,
    method: 'PUT'
  });
};
export const createPost = function (body) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/post/store`,
    method: 'PUT',
    body
  });
};
export const editPost = function (id, content) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/post/update/${id}`,
    method: 'PATCH',
    body: {
      content
    }
  });
};
export const deletePost = function (id) {
  return this.tryCall({
    url: `${this.rootUrl}/forums/api/post/delete/${id}`,
    method: 'DELETE'
  });
};
