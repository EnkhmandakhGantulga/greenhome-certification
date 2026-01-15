import { cn } from "@/lib/utils";
import { type RequestStatus } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  submitted: { label: "Илгээсэн", className: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200" },
  quoted: { label: "Үнийн санал", className: "bg-purple-100 text-purple-700 hover:bg-purple-100/80 border-purple-200" },
  contract_signed: { label: "Гэрээ байгуулсан", className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100/80 border-indigo-200" },
  files_uploaded: { label: "Файл оруулсан", className: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100/80 border-cyan-200" },
  auditor_assigned: { label: "Аудитор томилсон", className: "bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200" },
  audit_in_progress: { label: "Аудит хийгдэж байна", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200" },
  audit_submitted: { label: "Аудит илгээсэн", className: "bg-pink-100 text-pink-700 hover:bg-pink-100/80 border-pink-200" },
  approved: { label: "Баталгаажсан", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200" },
  rejected: { label: "Татгалзсан", className: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200" },
  certificate_issued: { label: "Гэрчилгээ олгосон", className: "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200 shadow-sm" },
};

export function StatusBadge({ status }: { status: RequestStatus | string }) {
  const config = statusConfig[status as RequestStatus] || { label: status, className: "bg-gray-100 text-gray-700" };
  
  return (
    <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium border", config.className)}>
      {config.label}
    </Badge>
  );
}
