import { Layout } from "@/components/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";
import { useCreateRequest } from "@/hooks/use-requests";
import { useCreateFile } from "@/hooks/use-files";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Upload, X, FileText, Loader2 } from "lucide-react";
import { Link } from "wouter";

const formSchema = insertRequestSchema.omit({ userId: true, auditorId: true, status: true, priceQuote: true, adminComment: true });

interface PendingFile {
  file: File;
  id: string;
}

export default function NewRequest() {
  const [, setLocation] = useLocation();
  const createRequest = useCreateRequest();
  const createFile = useCreateFile();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: "",
      projectArea: "",
      location: "",
      description: "",
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        file,
        id: crypto.randomUUID()
      }));
      setPendingFiles(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsUploading(true);
      
      // 1. Create the request first to get the ID
      const res = await createRequest.mutateAsync(values);
      const requestId = res.id;
      
      // 2. Upload each file
      for (const { file } of pendingFiles) {
        // Get presigned URL
        const urlRes = await fetch("/api/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            name: file.name, 
            size: file.size, 
            contentType: file.type || "application/octet-stream"
          }),
        });
        const { uploadURL, objectPath } = await urlRes.json();
        
        // Upload file to storage
        await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        
        // Save file record to database
        await createFile.mutateAsync({
          requestId,
          name: file.name,
          url: objectPath,
          type: "project_file",
        });
      }
      
      setLocation(`/requests/${requestId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/requests">
          <Button variant="ghost" className="pl-0 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Submit New Request</h1>
          <p className="text-gray-500 mt-2">Fill in the project details to start the certification process.</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Provide accurate information to receive a quick quote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type / Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Warehouse Construction, Office Renovation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area (m²)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 500" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, District" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the scope of work..." 
                          className="min-h-[120px]"
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Upload Section */}
                <div className="space-y-3">
                  <FormLabel>Project Files (Optional)</FormLabel>
                  <FormDescription>
                    Upload any relevant documents, drawings, or plans for your project.
                  </FormDescription>
                  
                  <div 
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg,.zip"
                    />
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload files</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, Images, DWG, ZIP</p>
                  </div>

                  {/* File List */}
                  {pendingFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {pendingFiles.map(({ file, id }) => (
                        <div 
                          key={id} 
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                            onClick={() => removeFile(id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={createRequest.isPending || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading Files...
                      </>
                    ) : createRequest.isPending ? (
                      "Submitting..."
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
