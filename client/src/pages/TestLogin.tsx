import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Leaf, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  legal_entity: "Хуулийн этгээд",
  admin: "Админ",
  auditor: "Аудитор"
};

const roleColors: Record<string, string> = {
  legal_entity: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  auditor: "bg-orange-100 text-orange-700"
};

export default function TestLogin() {
  const [users, setUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/test/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = async (userId: string) => {
    setLoggingIn(userId);
    try {
      const res = await fetch(`/api/test/login/${userId}`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      }
    } catch (e) {
      console.error(e);
    }
    setLoggingIn(null);
  };

  const groupedUsers = users.reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, TestUser[]>);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary">
            <Leaf className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Тест нэвтрэлт</h1>
        <p className="text-gray-500 mt-2">Тестийн зорилгоор хэрэглэгч сонгоно уу.</p>
      </div>

      <Card className="w-full max-w-2xl border-none shadow-xl">
        <CardHeader>
          <CardTitle>Тест хэрэглэгчид</CardTitle>
          <CardDescription>
            Нэг хэрэглэгч дээр дарж шууд нэвтэрнэ үү.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Уншиж байна...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Тест хэрэглэгч олдсонгүй.</div>
          ) : (
            Object.entries(groupedUsers).map(([role, roleUsers]) => (
              <div key={role} className="space-y-3">
                <h3 className="font-semibold text-gray-700">{roleLabels[role] || role}</h3>
                <div className="grid gap-3">
                  {roleUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleLogin(user.id)}
                      disabled={loggingIn !== null}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[user.role] || "bg-gray-100"}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                      {loggingIn === user.id && (
                        <span className="text-sm text-primary">Нэвтэрч байна...</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Нүүр хуудас руу буцах
          </Button>
        </Link>
      </div>
    </div>
  );
}
