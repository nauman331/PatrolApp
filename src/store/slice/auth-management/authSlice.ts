
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loginApi, LoginPayload, LoginResponse } from '../../../api/auth';

interface AuthState {
  user: {
     id: number | null; 
    email: string | null;
    name: string | null;
    role: string | null;
  };
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
   
      user: {  id: null, email: null, name: null, role: null },
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }
  try {
    const saved = localStorage.getItem('app_user');
    return saved
      ? JSON.parse(saved)
      : {
        
          user: { id: null, email: null, name: null, role: null },
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        };
  } catch {
    return {
      user: { email: null, name: null, role: null },
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }
};

const initialState: AuthState = getInitialState();

export const login = createAsyncThunk<LoginResponse, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await loginApi(payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = {id: null, email: null, name: null, role: null };
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('app_user');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        
       state.user = {
    id: action.payload.user.id,   // ← map id
    email: action.payload.user.email,
    name: action.payload.user.name,
    role: action.payload.user.role,
  };;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        if (typeof window !== 'undefined') {
          localStorage.setItem('app_user', JSON.stringify(state));
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;