import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface DeleteState {
  isDeleting: boolean;
  lastDeletedId: string | null;
  error: string | null;
}

const initialState: DeleteState = {
  isDeleting: false,
  lastDeletedId: null,
  error: null,
};
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

/**
 * Async Thunk to handle the DELETE request
 * Route: DELETE https://apis-nfc.arrowbyte.com.au/api/nfc-checkpoints/{id}
 */
export const deleteNFC = createAsyncThunk(
  'nfcDelete/execute',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`https://apis-nfc.arrowbyte.com.au/api/nfc-checkpoints/${id}`,{
        headers: authHeaders()
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete the NFC checkpoint'
      );
    }
  }
);

const nfcDeleteSlice = createSlice({
  name: 'nfcDelete',
  initialState,
  reducers: {
    // Reset the deletion state (useful for clearing success messages/errors)
    resetDeleteStatus: (state) => {
      state.isDeleting = false;
      state.lastDeletedId = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteNFC.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteNFC.fulfilled, (state, action: PayloadAction<string>) => {
        state.isDeleting = false;
        state.lastDeletedId = action.payload;
        state.error = null;
      })
      .addCase(deleteNFC.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetDeleteStatus } = nfcDeleteSlice.actions;
export default nfcDeleteSlice.reducer;