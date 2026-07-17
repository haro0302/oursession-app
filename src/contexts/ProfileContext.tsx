"use client";

import { createContext, useContext } from "react";

interface ProfileContextValue {
  openProfile: (userId: string) => void;
}

export const ProfileContext = createContext<ProfileContextValue>({
  openProfile: () => {},
});

export const useProfile = () => useContext(ProfileContext);
