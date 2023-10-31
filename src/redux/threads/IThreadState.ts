import type { IThread, IPost } from '../../entity/IForum';

export default interface IThreadsState {
  signShown: boolean;
  threads?: Record<string, IThread>;
  forumRules?: IThread;
  all?: Record<string, IThread>;
  search?: Record<string, IThread>;
  followed?: Record<string, IThread>;
  forums?: Record<string, IThread>;
  posts?: Record<string, IPost>;
}
