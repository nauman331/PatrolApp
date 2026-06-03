import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface AddUserPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  security_license_no: string;
  user_type: string;
  status: string;
}

export interface EditUserPayload {
  id: number;
  name: string;
  email: string;
  phone: string;
  security_license_no: string;
  user_type: string;
  status: string;
  password?: string;
}

export interface CreatedUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  security_license_no: string | null;
  user_type: string;
  status: number;
}

interface UserState {
  loading: boolean;
  editLoading: boolean;
  deleteLoadingId: number | null; // track which user is being deleted
  error: string | null;
  success: boolean;
  createdUser: CreatedUser | null;
  users: CreatedUser[];
  fetchingUsers: boolean;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const initialState: UserState = {
  loading: false,
  editLoading: false,
  deleteLoadingId: null,
  error: null,
  success: false,
  createdUser: null,
  users: [],
  fetchingUsers: false,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  },
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

interface FetchUsersResponse {
  data: CreatedUser[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Fetch all users
export const fetchUsers = createAsyncThunk(
  "user/fetchUsers",
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-users?page=${page}`, {
        headers: authHeaders(),
      });
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      } as FetchUsersResponse;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// Add user
export const addUser = createAsyncThunk(
  "user/addUser",
  async (payload: AddUserPayload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("You must be logged in to add a user");
      const response = await axios.post(
        `${API_BASE_URL}/store-user`,
        { ...payload, status: payload.status === "active" ? 1 : 0 },
        { headers: authHeaders() }
      );
      return response.data.data as CreatedUser;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to add user"
      );
    }
  }
);

// Edit user
export const editUser = createAsyncThunk(
  "user/editUser",
  async (payload: EditUserPayload, { rejectWithValue }) => {
    try {
      const { id, ...body } = payload;
      if (!body.password) delete body.password;
      const response = await axios.put(
        `${API_BASE_URL}/update-user/${id}`,
        { ...body, status: body.status === "active" ? 1 : 0 },
        { headers: authHeaders() }
      );
      return response.data.data as CreatedUser;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update user"
      );
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete-user/${id}`, {
        headers: authHeaders(),
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete user"
      );
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.loading = false;
      state.editLoading = false;
      state.error = null;
      state.success = false;
      state.createdUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => { state.fetchingUsers = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.fetchingUsers = false;
        state.users = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state) => { state.fetchingUsers = false; })

      // addUser
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.createdUser = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.createdUser = action.payload;
        state.users.unshift(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // editUser
      .addCase(editUser.pending, (state) => {
        state.editLoading = true;
        state.error = null;
      })
      .addCase(editUser.fulfilled, (state, action) => {
        state.editLoading = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      .addCase(editUser.rejected, (state, action) => {
        state.editLoading = false;
        state.error = action.payload as string;
      })

      // deleteUser
      .addCase(deleteUser.pending, (state, action) => {
        state.deleteLoadingId = action.meta.arg; // the id being deleted
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteLoadingId = null;
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteLoadingId = null;
        state.error = action.payload as string;
      });
  },
});

export const { resetUserState } = userSlice.actions;
export default userSlice.reducer;