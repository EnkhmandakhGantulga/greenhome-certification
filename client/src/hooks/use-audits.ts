import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateAuditInput, type InsertAudit } from "@shared/schema";

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, ...data }: { requestId: number } & CreateAuditInput) => {
      const url = buildUrl(api.audits.create.path, { requestId });
      const validated = api.audits.create.input.parse(data);
      const res = await fetch(url, {
        method: api.audits.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create audit");
      return api.audits.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [api.requests.get.path, vars.requestId] });
    },
  });
}

export function useUpdateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, ...data }: { requestId: number } & Partial<InsertAudit>) => {
      const url = buildUrl(api.audits.update.path, { requestId });
      const validated = api.audits.update.input.parse(data);
      const res = await fetch(url, {
        method: api.audits.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update audit");
      return api.audits.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [api.requests.get.path, vars.requestId] });
    },
  });
}
