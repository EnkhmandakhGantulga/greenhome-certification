import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";
import { useEffect } from "react";

const formSchema = insertProfileSchema.omit({ userId: true });

export default function ProfileSetup() {
  const { user } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "legal_entity",
      organizationName: "",
      phoneNumber: "",
      address: "",
    },
  });

  // Redirect if already set up
  useEffect(() => {
    if (profile) {
      setLocation("/");
    }
  }, [profile, setLocation]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateProfile.mutateAsync(values);
    } catch (error) {
      console.error(error);
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary">
            <Leaf className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-gray-900">НогоонГэр-т тавтай морил</h1>
        <p className="text-gray-500 mt-2">Эхлэхийн тулд профайлаа тохируулна уу.</p>
      </div>

      <Card className="w-full max-w-lg border-none shadow-xl animate-fade-in delay-100">
        <CardHeader>
          <CardTitle>Профайлын мэдээлэл</CardTitle>
          <CardDescription>
            Мэдээллээ оруулна уу. Хуулийн этгээд хүсэлт илгээж, Аудитор хянаж шалгана.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Би бол...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Үүрэг сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="legal_entity">Хуулийн этгээд (Төсөл эзэмшигч)</SelectItem>
                        <SelectItem value="auditor">Аудитор</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Төсөл илгээхийн тулд 'Хуулийн этгээд', хянахын тулд 'Аудитор' сонгоно уу.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Байгууллага / Нэр</FormLabel>
                    <FormControl>
                      <Input placeholder="Компани ХХК эсвэл Нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Утасны дугаар</FormLabel>
                      <FormControl>
                        <Input placeholder="+976 9999..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хаяг</FormLabel>
                      <FormControl>
                        <Input placeholder="Улаанбаатар, ..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Хадгалж байна..." : "Тохиргоо дуусгах"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
