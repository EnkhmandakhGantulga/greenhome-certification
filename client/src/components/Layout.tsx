import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  Leaf,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  legal_entity: "Хуулийн этгээд",
  admin: "Админ",
  auditor: "Аудитор"
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || !profile) return null;

  const role = profile.role;

  const navItems = [
    { label: "Хяналтын самбар", href: "/", icon: LayoutDashboard },
    { label: "Хүсэлтүүд", href: "/requests", icon: FileText },
  ];

  if (role === "admin") {
    // Admin specific links could go here if separate from Requests
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:transform-none flex flex-col",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Leaf className="h-8 w-8 text-primary mr-2" />
          <span className="font-display font-bold text-xl tracking-tight text-gray-900">
            Ногоон<span className="text-primary">Гэр</span>
          </span>
          <button 
            className="ml-auto lg:hidden text-gray-500"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                location === item.href 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}>
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {profile.organizationName?.[0] || user.firstName?.[0] || "U"}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}` : profile.organizationName}
              </p>
              <p className="text-xs text-gray-500 truncate">{roleLabels[role] || role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Гарах
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 lg:hidden flex items-center px-4">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-gray-500">
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 font-display font-bold text-lg">НогоонГэр</span>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
