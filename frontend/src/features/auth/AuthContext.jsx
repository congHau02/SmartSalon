import React, { useState, useEffect, useCallback } from "react";
import { axiosClient } from "../../api/axiosClient";
import { tokenStorage } from "../../lib/tokenStorage";
import { AuthContext } from "./context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUserInfo());
  const [accessToken, setAccessToken] = useState(() => tokenStorage.getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  // Sync state on remote logout / expired token event
  useEffect(() => {
    const handleRemoteLogout = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener("auth:logout", handleRemoteLogout);
    return () => window.removeEventListener("auth:logout", handleRemoteLogout);
  }, []);

  // Validate and refresh user profile on initial mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await axiosClient.get("/auth/me");
        if (isMounted && response?.result) {
          const freshUser = response.result;
          setUser(freshUser);
          tokenStorage.setTokens(null, null, freshUser);
        }
      } catch (err) {
        console.warn("Failed to fetch fresh user profile on init:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });

      const { accessToken: newAccess, refreshToken: newRefresh, user: authUser } = response.result;
      tokenStorage.setTokens(newAccess, newRefresh, authUser);

      setAccessToken(newAccess);
      setUser(authUser);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async ({ username, password, fullName, phone, email }) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post("/auth/register", {
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
      });

      const { accessToken: newAccess, refreshToken: newRefresh, user: authUser } = response.result;
      tokenStorage.setTokens(newAccess, newRefresh, authUser);

      setAccessToken(newAccess);
      setUser(authUser);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const currentRefresh = tokenStorage.getRefreshToken();
    if (!currentRefresh) {
      tokenStorage.clearTokens();
      setUser(null);
      setAccessToken(null);
      return null;
    }

    try {
      const response = await axiosClient.post("/auth/refresh", {
        refreshToken: currentRefresh,
      });

      const { accessToken: newAccess, refreshToken: newRefresh, user: authUser } = response.result;
      tokenStorage.setTokens(newAccess, newRefresh, authUser);
      setAccessToken(newAccess);
      if (authUser) setUser(authUser);
      return newAccess;
    } catch (err) {
      tokenStorage.clearTokens();
      setUser(null);
      setAccessToken(null);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const currentRefresh = tokenStorage.getRefreshToken();
    try {
      if (currentRefresh) {
        await axiosClient.post("/auth/logout", { refreshToken: currentRefresh });
      }
    } catch (e) {
      console.warn("Server logout notification failed:", e);
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const hasRole = useCallback(
    (role) => {
      return Boolean(user?.roles?.includes(role));
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles = []) => {
      if (!user?.roles || !Array.isArray(user.roles)) return false;
      return roles.some((r) => user.roles.includes(r));
    },
    [user]
  );

  const value = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: Boolean(user && accessToken),
    login,
    register,
    refreshToken,
    logout,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

