import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const AuthContext = createContext(null);

// ─── Generate/retrieve a persistent guest ID ───────────────────────────────
function getGuestId() {
  let id = localStorage.getItem('arg_gym_uid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('arg_gym_uid', id);
  }
  return id;
}

export function AuthProvider({ children }) {
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);

  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const guestUser = useQuery(
    api.users.getUserByGuestId,
    !isAuthenticated ? { guestId: getGuestId() } : 'skip'
  );

  // ── Initialize guest user on first load ───
  useEffect(() => {
    if (convexAuthLoading) return;

    const init = async () => {
      if (!isAuthenticated) {
        // Guest mode
        try {
          const u = await getOrCreateUser({
            guestId: getGuestId(),
            name: localStorage.getItem('arg_gym_name') || 'Anonymous',
          });
          setUser(u);
          setIsGuest(true);
        } catch (e) {
          console.error('[auth] guest init failed:', e);
        }
      }
      setLoading(false);
    };

    init();
  }, [convexAuthLoading, isAuthenticated]);

  // ── Update user when guest query changes ───
  useEffect(() => {
    if (guestUser && isGuest) {
      setUser(guestUser);
    }
  }, [guestUser, isGuest]);

  // ── Handle Google sign-in completion ───
  useEffect(() => {
    if (isAuthenticated && isGuest) {
      // User just signed in with Google — create/merge account
      const handleGoogleAuth = async () => {
        try {
          const u = await getOrCreateUser({
            tokenIdentifier: 'google-auth',
            name: localStorage.getItem('arg_gym_name') || 'Anonymous',
          });
          setUser(u);
          setIsGuest(false);
        } catch (e) {
          console.error('[auth] google init failed:', e);
        }
      };
      handleGoogleAuth();
    }
  }, [isAuthenticated]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signIn('google');
    } catch (e) {
      console.error('[auth] Google sign-in failed:', e);
    }
  }, [signIn]);

  const signInAsGuest = useCallback(async () => {
    try {
      const u = await getOrCreateUser({
        guestId: getGuestId(),
        name: localStorage.getItem('arg_gym_name') || 'Anonymous',
      });
      setUser(u);
      setIsGuest(true);
    } catch (e) {
      console.error('[auth] guest sign-in failed:', e);
    }
  }, [getOrCreateUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // Revert to guest
      const u = await getOrCreateUser({
        guestId: getGuestId(),
        name: localStorage.getItem('arg_gym_name') || 'Anonymous',
      });
      setUser(u);
      setIsGuest(true);
    } catch (e) {
      console.error('[auth] sign-out failed:', e);
    }
  }, [signOut, getOrCreateUser]);

  const updateName = useCallback(
    async (name) => {
      localStorage.setItem('arg_gym_name', name);
      if (user) {
        try {
          const updated = await getOrCreateUser({
            ...(isGuest ? { guestId: getGuestId() } : { tokenIdentifier: 'google-auth' }),
            name,
          });
          setUser(updated);
        } catch (_) {}
      }
    },
    [user, isGuest, getOrCreateUser]
  );

  const value = {
    user,
    isGuest,
    isLoggedIn: isAuthenticated && !isGuest,
    loading: loading || convexAuthLoading,
    signInWithGoogle,
    signInAsGuest,
    signOut: handleSignOut,
    updateName,
    getUserId: () => user?._id || null,
    getPlayerId: () => (isGuest ? getGuestId() : user?._id || getGuestId()),
    getPlayerName: () => user?.name || localStorage.getItem('arg_gym_name') || 'Anonymous',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
