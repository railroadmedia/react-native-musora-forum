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
  return this.tryCall.get(`/forums/api/discussions/index?brand=${this.brand}`);
};
export const getAllThreads = function (forumId, page = 1) {
  return this.tryCall.get(
    `/forums/api/thread/index?amount=10&page=${page}&brand=${
      this.brand
    }&category_id=${forumId || ''}`
  );
};
export const getThread = function (threadId, page = 1, isForumRules, postId) {
  return this.tryCall.get(
    isForumRules
      ? `/forums/api/rules?brand=${this.brand}`
      : postId
      ? `/forums/api/jump-to-post/${postId}?brand=${this.brand}`
      : `/forums/api/thread/show/${threadId}?amount=10&page=${page}&brand=${this.brand}`
  );
};
export const search = function (text, page = 1) {
  return this.tryCall.get(
    `/forums/api/search?amount=10&term=${text}&page=${page}&brand=${this.brand}`
  );
};
export const followThread = function (id) {
  return this.tryCall.put(
    `/forums/api/thread/follow/${id}?brand=${this.brand}`
  );
};
export const unfollowThread = function (id) {
  return this.tryCall.delete(
    `/forums/api/thread/unfollow/${id}?brand=${this.brand}`
  );
};
export const createThread = function (title, content, category_id) {
  return this.tryCall.put(`/forums/api/thread/store?brand=${this.brand}`, {
    title,
    first_post_content: content,
    category_id,
  });
};
export const updateThread = function (id, body) {
  return this.tryCall.patch(
    `/forums/api/thread/update/${id}?brand=${this.brand}`,
    body
  );
};
export const deleteThread = function (id) {
  return this.tryCall.delete(
    `/forums/api/thread/delete/${id}?brand=${this.brand}`
  );
};
export const getFollowedThreads = function (forumId, page = 1) {
  return this.tryCall.get(
    `/forums/api/thread/index?amount=10&page=${page}&brand=${
      this.brand
    }&followed=1&category_id=${forumId || ''}`
  );
};
export const likePost = function (id) {
  return this.tryCall.put(`/forums/api/post/like/${id}?brand=${this.brand}`);
};
export const disLikePost = function (id) {
  return this.tryCall.delete(
    `/forums/api/post/unlike/${id}?brand=${this.brand}`
  );
};
export const reportPost = function (id) {
  return this.tryCall.put(`/forums/api/post/report/${id}?brand=${this.brand}`);
};
export const createPost = function (body) {
  return this.tryCall.put(`/forums/api/post/store?brand=${this.brand}`, body);
};
export const editPost = function (id, content) {
  return this.tryCall.patch(
    `/forums/api/post/update/${id}?brand=${this.brand}`,
    { content }
  );
};
export const deletePost = function (id) {
  return this.tryCall.delete(
    `/forums/api/post/delete/${id}?brand=${this.brand}`
  );
};
export const reportUser = function (id) {
  return this.tryCall.put(
    `/user-management-system/user/report/${id}?brand=${this.brand}`
  );
};
export const blockUser = function (id) {
  return this.tryCall.put(`/user-management-system/user/block/${id}`);
};
export const getRootUrl = () => {
  return this.rootUrl;
};
export const decideWhereToRedirect = urlToOpen => {
  let urlBrand = urlToOpen.substring(urlToOpen.indexOf('.com') + 5);
  if (urlBrand?.includes('/')) {
    urlBrand = urlBrand.substring(0, urlBrand.indexOf('/'));
  }
  if (this.brand !== urlBrand) {
    return this.handleOpenUrl(urlToOpen)
  }
  return this.decideWhereToRedirect(urlToOpen, {brandName: this.brand, color: this.appColor}, this.user, this.isDark);
};
