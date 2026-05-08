import { createSlice } from '@reduxjs/toolkit';

interface ApiState {
    lastError?: string | null;
}

const initialState: ApiState = {
    lastError: null,
};

const apiSlice = createSlice({
    name: 'api',
    initialState,
    reducers: {
        setLastError(state: ApiState, action: any) {
            state.lastError = action.payload;
        },
        clearLastError(state: ApiState) {
            state.lastError = null;
        },
    },
});

export const { setLastError, clearLastError } = apiSlice.actions;
export default apiSlice.reducer;
