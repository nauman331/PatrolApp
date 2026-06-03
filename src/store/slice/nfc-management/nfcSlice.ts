import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface NFCState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface NFCPayload {
  tag_uid: string;
  label: string;
  location_description: string;
  is_active: boolean;
}

const initialState: NFCState = {
  loading: false,
  error: null,
  success: false,
};

export const createNFCCheckpoint = createAsyncThunk(
  'nfc/createCheckpoint',
  async (data: NFCPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/nfc-checkpoints`, data,{
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create checkpoint');
    }
  }
);

const nfcSlice = createSlice({
  name: 'nfc',
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNFCCheckpoint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNFCCheckpoint.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createNFCCheckpoint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetStatus } = nfcSlice.actions;
export default nfcSlice.reducer;