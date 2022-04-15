import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CursorState {
  position: number[]
}

const initialState: CursorState = {
  position: [0, 0],
}

export const cursorSlice = createSlice({
  name: 'cursor',
  initialState,
  reducers: {
    setPosition: (state, action: PayloadAction<number[]>) => {
      state.position = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setPosition } = cursorSlice.actions

export default cursorSlice.reducer