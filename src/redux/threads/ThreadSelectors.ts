import type { IAppState } from '../Store';
import { createSelector } from 'reselect';
import type IThreadsState from './IThreadState';
import type { IPost, IThread } from '../../entity/IForum';

const selectThreadsState = (state: IAppState, _threadId: number, _name: string): IThreadsState =>
  state.threadsState;

const selectPostsState = (state: IAppState, _postId: number): IThreadsState => state.threadsState;

export const selectThread = createSelector(
  [selectThreadsState, (_state, threadId, _name) => threadId, (_state, _threadId, name) => name],
  (threadsState, threadId, name): IThread | undefined =>
    !!threadId && name.match(/^(Thread)$/)
      ? threadsState?.forums?.[threadId] ||
        threadsState?.all?.[threadId] ||
        threadsState?.followed?.[threadId] ||
        threadsState?.search?.[threadId] ||
        ({} as IThread)
      : undefined
);

export const selectPost = createSelector(
  [selectPostsState, (_state, postId) => postId],
  (threadsState, postId): IPost | undefined =>
    !!postId
      ? ({
          ...threadsState.posts?.[postId],
          content: threadsState.posts?.[postId]?.content
            ?.split('</blockquote>')
            .slice(0, -1)
            .join('</blockquote>')
            ? threadsState.posts?.[postId]?.content
                ?.split('</blockquote>')
                .reverse()[0]
                .replace(/^<br>/, '')
            : threadsState.posts?.[postId]?.content,
        } as IPost)
      : undefined
);
