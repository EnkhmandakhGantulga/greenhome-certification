import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAuditors() {
  return useQuery({
    queryKey: [api.auditors.list.path],
    queryFn: async () => {
      const res = await fetch(api.auditors.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch auditors");
      return api.auditors.list.responses[200].parse(await res.json());
    },
  });
}
