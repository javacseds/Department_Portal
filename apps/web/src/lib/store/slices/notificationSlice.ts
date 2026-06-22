import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  items: Notification[];
  unreadCount: number;
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0 } as NotificationState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) state.unreadCount++;
    },
    markAsRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead(state) {
      state.items.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, markAsRead, markAllAsRead } =
  notificationSlice.actions;
export default notificationSlice.reducer;
