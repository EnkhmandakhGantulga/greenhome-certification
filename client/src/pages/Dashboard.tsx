import { Layout } from "@/components/Layout";
import { useProfile } from "@/hooks/use-profiles";
import { useRequests } from "@/hooks/use-requests";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, ArrowRight, Activity, Clock, FileCheck } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: requests, isLoading } = useRequests(
    // Fetch requests relevant to user role. 
    // Backend API already filters by userId for 'legal_entity' and 'auditor' implicitly via relations logic 
    // but we can pass explicit filters if needed.
    // For now assuming list API returns correct set.
  );

  if (!profile) return null;

  const stats = [
    { label: "Total Requests", value: requests?.length || 0, icon: Activity, color: "text-blue-600 bg-blue-100" },
    { label: "Pending Actions", value: requests?.filter(r => r.status !== 'certificate_issued' && r.status !== 'rejected').length || 0, icon: Clock, color: "text-orange-600 bg-orange-100" },
    { label: "Completed", value: requests?.filter(r => r.status === 'certificate_issued').length || 0, icon: FileCheck, color: "text-green-600 bg-green-100" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">
              Welcome back, {profile.organizationName || "User"}
            </h1>
            <p className="text-gray-500 mt-1">Here's what's happening with your projects today.</p>
          </div>
          {profile.role === "legal_entity" && (
            <Link href="/requests/new">
              <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30">
                <Plus className="h-5 w-5 mr-2" />
                New Request
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold font-display mt-2">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Recent Activity</h2>
            <Link href="/requests">
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : requests?.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>No requests found.</p>
                {profile.role === "legal_entity" && (
                  <Link href="/requests/new" className="text-primary hover:underline mt-2 inline-block">
                    Create your first request
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {requests?.slice(0, 5).map((req) => (
                  <Link key={req.id} href={`/requests/${req.id}`}>
                    <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {req.projectType.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                              {req.projectType}
                            </p>
                            <p className="text-sm text-gray-500">
                              {req.location} • Created {req.createdAt ? format(new Date(req.createdAt), "MMM d, yyyy") : ""}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
