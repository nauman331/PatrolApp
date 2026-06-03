import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface EditState {
  selectedNfc: any | null;
  isUpdating: boolean;
  error: string | null;
}
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

export const fetchNfcById = createAsyncThunk('nfcEdit/fetchById', async (id: string) => {
  const response = await axios.get(`https://apis-nfc.arrowbyte.com.au/api/nfc-checkpoints/${id}`,{
    headers: authHeaders()
  });
  return response.data;
});

export const updateNFC = createAsyncThunk('nfcEdit/update', async ({ id, data }: { id: string, data: any }) => {
  const response = await axios.put(`https://apis-nfc.arrowbyte.com.au/api/nfc-checkpoints/${id}`, data, {
    headers: authHeaders()
  });
  return response.data;
});

const nfcEditSlice = createSlice({
  name: 'nfcEdit',
  initialState: { selectedNfc: null, isUpdating: false, error: null } as EditState,
  reducers: {
    clearSelectedNfc: (state) => { state.selectedNfc = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNfcById.fulfilled, (state, action) => { state.selectedNfc = action.payload; })
      .addCase(updateNFC.pending, (state) => { state.isUpdating = true; })
      .addCase(updateNFC.fulfilled, (state) => {
        state.isUpdating = false;
        state.selectedNfc = null;
      })
      .addCase(updateNFC.rejected, (state, action) => {
  state.isUpdating = false;
  state.error = 'Failed to update';
});
  },
});

export const { clearSelectedNfc } = nfcEditSlice.actions;
export default nfcEditSlice.reducer;