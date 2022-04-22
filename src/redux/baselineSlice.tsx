import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface BaselineState {
  dataPoints: number[][]
  fitValues: number[]
}

const initialState: BaselineState = {
  dataPoints: [],
  fitValues: []
}

export const baselineSlice = createSlice({
  name: 'baseline',
  initialState,
  reducers: {
    setDataPoints: (state, action: PayloadAction<number[][]>) => {
      state.dataPoints = action.payload
    },
    setFitValues: (state, action: PayloadAction<number[]>) => {
      state.fitValues = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setDataPoints, setFitValues } = baselineSlice.actions

export default baselineSlice.reducer