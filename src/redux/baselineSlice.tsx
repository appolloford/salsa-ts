import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface BaselineState {
  dataPoints: number[][]
  fitValues: number[]
  subtraction: boolean
}

const initialState: BaselineState = {
  dataPoints: [],
  fitValues: [],
  subtraction: false
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
    setSubtraction: (state, action: PayloadAction<boolean>) => {
      state.subtraction = action.payload
    }
  },
})

// Action creators are generated for each case reducer function
export const { setDataPoints, setFitValues, setSubtraction } = baselineSlice.actions

export default baselineSlice.reducer