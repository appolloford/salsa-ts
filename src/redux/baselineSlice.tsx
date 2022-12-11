import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface BaselineState {
  baselinePoints: number[][]
  baselineFitOrder: number
  baselineFitValues: number[]
  showSubtraction: boolean
  showBaselineTable: boolean
}

const initialState: BaselineState = {
  baselinePoints: [],
  baselineFitOrder: 2,
  baselineFitValues: [],
  showSubtraction: false,
  showBaselineTable: false
}

export const baselineSlice = createSlice({
  name: 'baseline',
  initialState,
  reducers: {
    setBaselinePoints: (state, action: PayloadAction<number[][]>) => {
      state.baselinePoints = action.payload
    },
    setBaselineFit: (state, action: PayloadAction<number[]>) => {
      state.baselineFitValues = action.payload
    },
    setBaselineFitOrder: (state, action: PayloadAction<number>) => {
      state.baselineFitOrder = action.payload
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
export const { setBaselinePoints, setBaselineFit, setBaselineFitOrder, setShowSubtraction, setShowBaselineTable } = baselineSlice.actions

export default baselineSlice.reducer