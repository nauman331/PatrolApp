import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '../../navigation/types';

interface AuthState {
    userRole: UserRole;
    token?: string | null;
    guardId?: string | null;
}

const initialState: AuthState = {
    userRole: null,
    token: null,
    guardId: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth(
            state: AuthState,
            action: PayloadAction<{
                role: UserRole;
                token: string | null;
                guardId: string | null;
            }>,
        ) {
            state.userRole = action.payload.role;
            state.token = action.payload.token;
            state.guardId = action.payload.guardId;
        },
        clearAuth(state: AuthState) {
            state.userRole = null;
            state.token = null;
            state.guardId = null;
        },
    },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
