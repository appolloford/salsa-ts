import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface GaussianState {
  order: number
  isFitting: boolean
  guess: number[][]
  params: number[][]
  fit: number[]
  showGaussianTable: boolean
}

const initialState: GaussianState = {
  order: 0,
  isFitting: false,
  guess: [],
  params: [],
  fit: [],
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
    setGaussianFit: (state, action: PayloadAction<number[]>) => {
      state.fit = action.payload
    },
    setShowGaussianTable: (state, action: PayloadAction<boolean>) => {
      state.showGaussianTable = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setOrder, setIsFitting, setGaussianGuess, setGaussianFit, setShowGaussianTable } = GaussianSlice.actions

export default GaussianSlice.reducer