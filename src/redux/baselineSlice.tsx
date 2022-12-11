import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface BaselineState {
  dataPoints: number[][]
  fitValues: number[]
  showSubtraction: boolean
  showBaselineTable: boolean
}

const initialState: BaselineState = {
  dataPoints: [],
  fitValues: [],
  showSubtraction: false,
  showBaselineTable: false
}

export const baselineSlice = createSlice({
  name: 'baseline',
  initialState,
  reducers: {
    setBaselinePoints: (state, action: PayloadAction<number[][]>) => {
      state.dataPoints = action.payload
    },
    setBaselineFit: (state, action: PayloadAction<number[]>) => {
      state.fitValues = action.payload
    },
    setShowSubtraction: (state, action: PayloadAction<boolean>) => {
      state.showSubtraction = action.payload
    },
    setShowBaselineTable: (state, action: PayloadAction<boolean>) => {
      state.showBaselineTable = action.payload
    }
  },
})

// Action creators are generated for each case reducer function
export const { setBaselinePoints, setBaselineFit, setShowSubtraction, setShowBaselineTable } = baselineSlice.actions

export default baselineSlice.reducer