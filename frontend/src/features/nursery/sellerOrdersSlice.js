import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import handelDataFetch from '../../utils/handelDataFetch';

export const fetchSellerOrdersAsync = createAsyncThunk(
  '/nursery/orders/fetch',
  async ({ page = 1, limit = 10, orderSearch = '', status = '' } = {}) => {
    let url = `/api/v2/nursery/orders?page=${page}&limit=${limit}`;
    if (orderSearch) url += `&orderSearch=${orderSearch}`;
    if (status) url += `&status=${status}`;
    
    const response = await handelDataFetch(url, 'GET');
    return response.data;
  }
);

export const fetchSellerOrderByIdAsync = createAsyncThunk(
  '/nursery/orders/fetchById',
  async (orderId) => {
    const response = await handelDataFetch(`/api/v2/nursery/orders/${orderId}`, 'GET');
    return response.data;
  }
);

export const fetchSellerOrderStatsAsync = createAsyncThunk(
  '/nursery/orders/stats',
  async () => {
    const response = await handelDataFetch('/api/v2/nursery/orders/stats', 'GET');
    return response.data;
  }
);

export const updateOrderItemStatusAsync = createAsyncThunk(
  '/nursery/orders/updateStatus',
  async ({ orderId, itemIndex, status, message }) => {
    const data = { status, message };
    const response = await handelDataFetch(
      `/api/v2/nursery/orders/${orderId}/item/${itemIndex}/status`,
      'PATCH',
      data
    );
    return response.data;
  }
);

const sellerOrdersSlice = createSlice({
  name: 'sellerOrders',
  initialState: {
    orders: [],
    currentOrder: null,
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0
    },
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  },
  extraReducers: (builder) => {
    // Fetch Orders
    builder
      .addCase(fetchSellerOrdersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrdersAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status) {
          state.orders = action.payload.result;
          state.currentPage = action.payload.page;
          state.totalPages = action.payload.pages;
          state.totalOrders = action.payload.total;
        }
      })
      .addCase(fetchSellerOrdersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // Fetch Single Order
    builder
      .addCase(fetchSellerOrderByIdAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrderByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status) {
          state.currentOrder = action.payload.result;
        }
      })
      .addCase(fetchSellerOrderByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // Fetch Stats
    builder
      .addCase(fetchSellerOrderStatsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrderStatsAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status) {
          state.stats = action.payload.result;
        }
      })
      .addCase(fetchSellerOrderStatsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // Update Order Status
    builder
      .addCase(updateOrderItemStatusAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderItemStatusAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status) {
          state.currentOrder = action.payload.result;
        }
      })
      .addCase(updateOrderItemStatusAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default sellerOrdersSlice.reducer;
