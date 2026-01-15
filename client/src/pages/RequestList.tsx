import { Layout } from "@/components/Layout";
import { useRequests } from "@/hooks/use-requests";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profiles";

export default function RequestList() {
  const { data: profile } = useProfile();
  const { data: requests, isLoading } = useRequests();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Хүсэлтүүд</h1>
            <p className="text-gray-500">Төслийн гэрчилгээжилтийг удирдах, хянах.</p>
          </div>
          {profile?.role === "legal_entity" && (
            <Link href="/requests/new">
              <Button className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Шинэ хүсэлт
              </Button>
            </Link>
          )}
        </div>

        {/* Filters Bar */}
        <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Хүсэлт хайх..." className="pl-10 border-gray-200" />
          </div>
          <Button variant="outline" className="border-gray-200">
            <Filter className="h-4 w-4 mr-2" />
            Шүүлт
          </Button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Уншиж байна...</div>
          ) : requests?.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Хүсэлт олдсонгүй.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-left">
                  <tr>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Төслийн мэдээлэл</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Төлөв</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Илгээсэн</th>
                    {profile?.role === 'admin' && (
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Эзэмшигч</th>
                    )}
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests?.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{req.projectType}</div>
                        <div className="text-sm text-gray-500">{req.location}</div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {req.createdAt ? format(new Date(req.createdAt), "yyyy.MM.dd") : "-"}
                      </td>
                      {profile?.role === 'admin' && (
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {req.user?.organizationName || "Тодорхойгүй"}
                        </td>
                      )}
                      <td className="py-4 px-6 text-right">
                        <Link href={`/requests/${req.id}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Дэлгэрэнгүй
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
