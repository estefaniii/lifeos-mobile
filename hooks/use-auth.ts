// Re-export from the centralized AuthProvider so existing imports continue to work.
// All auth state is now managed via React Context in providers/auth-provider.tsx.
import { useAuth as useAuthContext } from "@/providers/auth-provider";

type UseAuthOptions = {
  autoFetch?: boolean;
};

// Wrapper that accepts the old options signature for backwards compatibility.
// With the context-based approach, autoFetch is no longer needed (the provider always fetches).
export function useAuth(_options?: UseAuthOptions) {
  return useAuthContext();
}
