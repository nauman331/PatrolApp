import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getManagerGuards, type ManagerGuardsListData, type ManagerGuardStatusFilter } from '../../services/managerApi';
import type { RootState } from '../store';

export interface ManagerGuardsState {
  data: ManagerGuardsListData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  // Filters
  search: string;
  statusFilter: ManagerGuardStatusFilter;
}

const initialState: ManagerGuardsState = {
  data: null,
  loading: false,
  refreshing: false,
  error: null,
  search: '',
  statusFilter: 'all',
};

export const fetchManagerGuards = createAsyncThunk<
  ManagerGuardsListData,
  any,
  { rejectValue: string }
>('managerGuards/fetch', async (params, { rejectWithValue }) => {
  const result = await getManagerGuards(params);
  if (!result.success || !result.data) {
    return rejectWithValue(result.message ?? 'Failed to load guards');
  }
  return result.data;
});

const managerGuardsSlice = createSlice({
  name: 'managerGuards',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<ManagerGuardStatusFilter>) {
      state.statusFilter = action.payload;
    },
    resetFilters(state) {
      state.search = '';
      state.statusFilter = 'all';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagerGuards.pending, (state) => {
        if (!state.data) {
          state.loading = true;
        } else {
          state.refreshing = true;
        }
        state.error = null;
      })
      .addCase(fetchManagerGuards.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.data = action.payload;
      })
      .addCase(fetchManagerGuards.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload ?? 'Failed to load guards';
      });
  },
});

export const { setSearch, setStatusFilter, resetFilters } = managerGuardsSlice.actions;
export default managerGuardsSlice.reducer;

export const selectManagerGuardsData = (state: RootState) => state.managerGuards.data;
export const selectManagerGuardsLoading = (state: RootState) => state.managerGuards.loading;
export const selectGuardsSearch = (state: RootState) => state.managerGuards.search;
export const selectGuardsStatusFilter = (state: RootState) => state.managerGuards.statusFilter;
export const selectGuardsFilters = (state: RootState) => ({
  search: state.managerGuards.search,
  statusFilter: state.managerGuards.statusFilter,
});
