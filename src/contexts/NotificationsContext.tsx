"use client";

import { createContext, useContext } from "react";

interface NotificationsContextValue {
  openNotifications: () => void;
}

export const NotificationsContext = createContext<NotificationsContextValue>({
  openNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationsContext);
