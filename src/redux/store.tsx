import { configureStore } from '@reduxjs/toolkit'
import cursorReducer from './cursorSlice'
import baselineReducer from './baselineSlice'
import gaussianReducer from './gaussianSlice'

export const store = configureStore({
  reducer: {
    cursor: cursorReducer,
    baseline: baselineReducer,
    gaussian: gaussianReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch