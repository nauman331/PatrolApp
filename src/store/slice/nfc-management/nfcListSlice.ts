import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface NFCCheckpoint {
  id: string;
  tag_uid: string;
  label: string;
  location_description: string;
  is_active: boolean;
}

interface ListState {
  data: NFCCheckpoint[];
  loading: boolean;
  error: string | null;
}

const initialState: ListState = {
  data: [],
  loading: false,
  error: null,
};
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

export const fetchAllNFCs = createAsyncThunk('nfcList/fetchAll', async () => {
  const response = await axios.get('https://apis-nfc.arrowbyte.com.au/api/nfc-checkpoints',
    {
        headers: authHeaders()
    }
  );
  return response.data.data ?? response.data; // handle both shapes
});



const nfcListSlice = createSlice({
  name: 'nfcList',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllNFCs.pending, (state) => { state.loading = true; })
      .addCase(fetchAllNFCs.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAllNFCs.rejected, (state, action) => {
  state.loading = false;
  state.error = 'Failed to fetch NFC checkpoints';
});
  },
});

export default nfcListSlice.reducer;