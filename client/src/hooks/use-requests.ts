import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateRequestInput, UpdateRequestInput } from "@shared/schema";

export function useRequests(filters?: { status?: string; role?: string }) {
  const queryKey = [api.requests.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = filters 
        ? `${api.requests.list.path}?${new URLSearchParams(filters as any).toString()}`
        : api.requests.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch requests");
      return api.requests.list.responses[200].parse(await res.json());
    },
  });
}

export function useRequest(id: number) {
  return useQuery({
    queryKey: [api.requests.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.requests.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch request");
      return api.requests.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequestInput) => {
      const validated = api.requests.create.input.parse(data);
      const res = await fetch(api.requests.create.path, {
        method: api.requests.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create request");
      return api.requests.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateRequestInput) => {
      const url = buildUrl(api.requests.update.path, { id });
      const validated = api.requests.update.input.parse(data);
      const res = await fetch(url, {
        method: api.requests.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update request");
      return api.requests.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.requests.get.path, variables.id] });
    },
  });
}
