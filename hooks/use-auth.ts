// Re-export from the centralized AuthProvider
import { useAuth as useAuthContext } from "@/providers/auth-provider";
export type { User } from "@/providers/auth-provider";

type UseAuthOptions = {
  autoFetch?: boolean;
};

// Wrapper that accepts the old options signature for backwards compatibility.
export function useAuth(_options?: UseAuthOptions) {
  return useAuthContext();
}
