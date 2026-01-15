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
import { ShieldCheck, Loader2 } from "lucide-react";
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
      // location change handled by useEffect above after query invalidation
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

  if (profile) return null; // Prevent flash

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Welcome to CertifyPlatform</h1>
        <p className="text-gray-500 mt-2">Let's set up your profile to get started.</p>
      </div>

      <Card className="w-full max-w-lg border-none shadow-xl animate-fade-in delay-100">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Please provide your details. Legal entities can submit requests, while Auditors review them.
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
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="legal_entity">Legal Entity (Project Owner)</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        {/* Admin would typically be set manually in DB, but exposing here for demo purposes if needed, OR user can manually set via curl */}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose 'Legal Entity' to submit projects, or 'Auditor' to review them.
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
                    <FormLabel>Organization / Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp OR John Doe" {...field} />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234..." {...field} value={field.value || ''} />
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
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St..." {...field} value={field.value || ''} />
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
                {updateProfile.isPending ? "Saving..." : "Complete Setup"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
