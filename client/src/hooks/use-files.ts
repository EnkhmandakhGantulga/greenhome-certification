import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertFile } from "@shared/schema";

export function useFiles(requestId: number) {
  return useQuery({
    queryKey: [api.files.list.path, requestId],
    queryFn: async () => {
      const url = buildUrl(api.files.list.path, { requestId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch files");
      return api.files.list.responses[200].parse(await res.json());
    },
    enabled: !!requestId,
  });
}

export function useCreateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertFile, "userId">) => {
      const validated = api.files.create.input.parse(data);
      const res = await fetch(api.files.create.path, {
        method: api.files.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save file record");
      return api.files.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.files.list.path, variables.requestId] });
    },
  });
}
