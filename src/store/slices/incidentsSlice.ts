import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { getGuardMyIncidents } from '../../services/guardApi';
import {
  mapApiIncidents,
  type MappedIncident,
} from '../../services/incidentsMapper';
import type { RootState } from '../store';

export interface IncidentsState {
  items: MappedIncident[];
  loading: boolean;
  error: string | null;
}

const initialState: IncidentsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchGuardIncidents = createAsyncThunk<
  MappedIncident[],
  void,
  { rejectValue: string }
>('incidents/fetchGuardIncidents', async (_arg, { rejectWithValue }) => {
  const result = await getGuardMyIncidents();
  if (!result.success) {
    return rejectWithValue(result.message ?? 'Failed to load incidents');
  }
  return mapApiIncidents(result.data ?? []);
});

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    clearIncidentsError(state: IncidentsState) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchGuardIncidents.pending, (state: IncidentsState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchGuardIncidents.fulfilled,
        (state: IncidentsState, action: PayloadAction<MappedIncident[]>) => {
          state.loading = false;
          state.items = action.payload;
        },
      )
      .addCase(fetchGuardIncidents.rejected, (state: IncidentsState, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          'Failed to load incidents';
      });
  },
});

export const { clearIncidentsError } = incidentsSlice.actions;
export default incidentsSlice.reducer;

export const selectIncidents = (state: RootState) => state.incidents.items;
export const selectIncidentsLoading = (state: RootState) =>
  state.incidents.loading;
export const selectIncidentsError = (state: RootState) => state.incidents.error;
export const selectIncidentById =
  (id: number) =>
  (state: RootState): MappedIncident | undefined =>
    state.incidents.items.find(item => item.id === id);
