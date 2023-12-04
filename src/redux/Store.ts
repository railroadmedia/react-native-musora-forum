import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import threadsReducer from './threads/ThreadReducer';

export const forumStore = configureStore({
  reducer: {
    threadsState: threadsReducer,
  },
});

export type AppDispatch = typeof forumStore.dispatch;
export type IAppState = ReturnType<typeof forumStore.getState>;

// Hooks
type DispatchFunc = () => AppDispatch;
export const useAppDispatch: DispatchFunc = useDispatch;
export const useAppSelector: TypedUseSelectorHook<IAppState> = useSelector;
