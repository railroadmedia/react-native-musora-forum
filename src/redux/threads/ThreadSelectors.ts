import type { IAppState } from '../Store';
import { createSelector } from 'reselect';
import type IThreadsState from './IThreadState';

const selectThreadsState = (state: IAppState, _threadId: number, _name: string): IThreadsState =>
  state.threadsState;

// const selectThreadId = (threadId: number): number => threadId;

export const selectThread = createSelector(
  [selectThreadsState, (_state, threadId, _name) => threadId, (_state, _threadId, name) => name],
  (threadsState, threadId, name) =>
    (!!threadId && name.match(/^(Thread)$/) && threadsState?.forums?.[threadId]) ||
    threadsState?.all?.[threadId] ||
    threadsState?.followed?.[threadId] ||
    threadsState?.search?.[threadId] ||
    {}
);
