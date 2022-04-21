import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CursorState {
  position: number[]
  drag: string
}

const initialState: CursorState = {
  position: [0, 0],
  drag: "zoom"
}

export const cursorSlice = createSlice({
  name: 'cursor',
  initialState,
  reducers: {
    setPosition: (state, action: PayloadAction<number[]>) => {
      state.position = action.payload
    },
    setDrag: (state, action: PayloadAction<string>) => {
      state.drag = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setPosition, setDrag } = cursorSlice.actions

export default cursorSlice.reducer