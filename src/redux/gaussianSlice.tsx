import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface GaussianState {
  order: number
  isFitting: boolean
  guess: number[][]
  gaussianParams: number[][]
  gaussianSingleFit: number[][]
  gaussianStack: number[]
  showGaussianSingles: boolean
  showGaussianTable: boolean
}

const initialState: GaussianState = {
  order: 0,
  isFitting: false,
  guess: [],
  gaussianParams: [],
  gaussianSingleFit: [],
  gaussianStack: [],
  showGaussianSingles: false,
  showGaussianTable: false
}

export const GaussianSlice = createSlice({
  name: 'gaussian',
  initialState,
  reducers: {
    setOrder: (state, action: PayloadAction<number>) => {
      state.order = action.payload
    },
    setIsFitting: (state, action: PayloadAction<boolean>) => {
      state.isFitting = action.payload
    },
    setGaussianGuess: (state, action: PayloadAction<number[][]>) => {
      state.guess = action.payload
    },
    setGaussianParams: (state, action: PayloadAction<number[][]>) => {
      state.gaussianParams = action.payload
    },
    setGaussianSingleFit: (state, action: PayloadAction<number[][]>) => {
      state.gaussianSingleFit = action.payload
    },
    setGaussianStack: (state, action: PayloadAction<number[]>) => {
      state.gaussianStack = action.payload
    },
    setShowGaussianSingles: (state, action: PayloadAction<boolean>) => {
      state.showGaussianSingles = action.payload
    },
    setShowGaussianTable: (state, action: PayloadAction<boolean>) => {
      state.showGaussianTable = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setOrder, setIsFitting, setGaussianGuess, setGaussianParams, setGaussianSingleFit, setGaussianStack, setShowGaussianSingles, setShowGaussianTable } = GaussianSlice.actions

export default GaussianSlice.reducer