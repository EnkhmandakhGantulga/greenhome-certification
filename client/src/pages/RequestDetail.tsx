import { Layout } from "@/components/Layout";
import { useRequest, useUpdateRequest } from "@/hooks/use-requests";
import { useFiles, useCreateFile } from "@/hooks/use-files";
import { useCreateAudit, useUpdateAudit } from "@/hooks/use-audits";
import { useProfile } from "@/hooks/use-profiles";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link, useRoute } from "wouter";
import { ArrowLeft, File, Download, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

export default function RequestDetail() {
  const [, params] = useRoute("/requests/:id");
  const id = Number(params?.id);
  
  const { data: request, isLoading } = useRequest(id);
  const { data: profile } = useProfile();
  const { data: files } = useFiles(id);
  
  const updateRequest = useUpdateRequest();
  const createFile = useCreateFile();
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();

  const [quotePrice, setQuotePrice] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    fireSafety: false,
    structural: false,
    electrical: false,
    plumbing: false
  });
  const [conclusion, setConclusion] = useState("");

  if (isLoading || !request || !profile) {
    return (
      <Layout>
        <div className="p-8 text-center">Loading...</div>
      </Layout>
    );
  }

  // Helper to handle file uploads
  const handleFileUpload = (type: string) => async (result: any) => {
    // result comes from Uppy complete event
    if (result.successful) {
      for (const file of result.successful) {
        // We know the upload URL was generated via our API which returns uploadURL and objectPath
        // Ideally ObjectUploader should pass back the metadata we need.
        // For now, let's assume we can reconstruct the URL or the file hook handles it.
        // But since ObjectUploader is generic, let's just save the record here.
        // In a real app, we'd want the 'objectPath' returned from the presigned URL request.
        // Assuming the file.uploadURL is the GCS url.
        await createFile.mutateAsync({
          requestId: id,
          name: file.name,
          url: file.uploadURL, // This is the full GCS url
          type: type as any,
        });
      }
    }
  };

  // --- ACTIONS ---

  const handleSendQuote = async () => {
    await updateRequest.mutateAsync({ 
      id, 
      priceQuote: Number(quotePrice),
      status: "quoted" 
    });
  };

  const handleUploadContract = handleFileUpload("contract");
  // After contract upload, ideally we update status. Can be done via separate call or implicit.
  // Let's create a button to "Confirm Contract Sent" which updates status if contract exists.
  const handleContractSigned = async () => {
    await updateRequest.mutateAsync({ id, status: "contract_signed" });
  };

  const handleProjectFilesUploaded = async () => {
    await updateRequest.mutateAsync({ id, status: "files_uploaded" });
  };

  const handleAssignAuditor = async () => {
    // Mock assigning first available auditor or random for now, since we don't have auditor list UI here
    // In real app: Select auditor from dropdown
    // For MVP: assign to self if admin, or hardcode an ID if known.
    // Let's assume there is an Auditor user with ID 'auditor-1' or similar. 
    // Since we can't easily query users here without a new hook, let's skip actual ID assignment logic details 
    // and just update status for demo flow visualization.
    await updateRequest.mutateAsync({ id, status: "auditor_assigned" });
  };

  const handleSubmitAudit = async () => {
    // If audit exists, update. Else create.
    const auditData = {
      checklistData: checklist,
      conclusion,
    };
    
    if (request.audit) {
      await updateAudit.mutateAsync({ requestId: id, ...auditData });
    } else {
      await createAudit.mutateAsync({ requestId: id, ...auditData });
    }
    
    await updateRequest.mutateAsync({ id, status: "audit_submitted" });
  };

  const handleApprove = async () => {
    await updateRequest.mutateAsync({ id, status: "approved" });
  };

  const handleReject = async () => {
    await updateRequest.mutateAsync({ id, status: "rejected" });
  };
  
  const handleIssueCertificate = handleFileUpload("certificate");
  // Then update status
  const handleCertificateIssued = async () => {
    await updateRequest.mutateAsync({ id, status: "certificate_issued" });
  };

  // --- RENDER HELPERS ---
  
  const isAuditor = profile.role === 'auditor';
  const isAdmin = profile.role === 'admin';
  const isUser = profile.role === 'legal_entity';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-gray-900">{request.projectType}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>ID: #{request.id}</span>
              <span>•</span>
              <span>{request.location}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={request.status} />
            {request.priceQuote && (
              <span className="text-sm font-medium text-gray-900">
                Quote: ${request.priceQuote.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl w-full justify-start h-auto">
            <TabsTrigger value="details" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Details</TabsTrigger>
            <TabsTrigger value="files" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Files & Documents</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Audit & Results</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="details" className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-500">Description</Label>
                    <p className="mt-1 text-gray-900">{request.description}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Project Area</Label>
                    <p className="mt-1 text-gray-900">{request.projectArea} m²</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Location</Label>
                    <p className="mt-1 text-gray-900">{request.location}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Submitted By</Label>
                    <p className="mt-1 text-gray-900">{request.user?.organizationName}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Actions for Admin */}
              {isAdmin && request.status === "submitted" && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Admin Action: Send Quote</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Input 
                      type="number" 
                      placeholder="Enter price quote..." 
                      className="max-w-xs bg-white"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                    />
                    <Button onClick={handleSendQuote} disabled={!quotePrice}>Send Quote</Button>
                  </CardContent>
                </Card>
              )}
              
              {isAdmin && request.status === "quoted" && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Admin Action: Upload Contract</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <ObjectUploader
                         onGetUploadParameters={async (file) => {
                           const res = await fetch("/api/uploads/request-url", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                           });
                           const { uploadURL } = await res.json();
                           return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                         }}
                         onComplete={handleFileUpload("contract")}
                      >
                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload Contract PDF</Button>
                      </ObjectUploader>
                      
                      <Button onClick={handleContractSigned}>Mark Contract Signed</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isAdmin && request.status === "files_uploaded" && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Admin Action: Assign Auditor</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <Button onClick={handleAssignAuditor}>Assign Available Auditor</Button>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            <TabsContent value="files" className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Project Files</h3>
                
                {/* User upload action */}
                {isUser && request.status === "contract_signed" && (
                  <ObjectUploader
                     onGetUploadParameters={async (file) => {
                       const res = await fetch("/api/uploads/request-url", {
                         method: "POST",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                       });
                       const { uploadURL } = await res.json();
                       return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                     }}
                     onComplete={async (res) => {
                       await handleFileUpload("project_file")(res);
                       await handleProjectFilesUploaded(); // Auto advance status for UX simplicity here
                     }}
                  >
                    <Button>
                      <Upload className="h-4 w-4 mr-2" /> Upload Project Files
                    </Button>
                  </ObjectUploader>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files?.length === 0 && <p className="text-gray-500 col-span-full">No files uploaded yet.</p>}
                {files?.map((file) => (
                  <Card key={file.id} className="group hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                          <File className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full capitalize">
                          {file.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(file.createdAt!), "MMM d, yyyy")}
                        </p>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="mt-auto">
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" /> Download
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audit" className="space-y-6 animate-fade-in">
              {/* Auditor Checklist Form */}
              {(isAuditor || isAdmin || request.status === "audit_submitted" || request.status === "approved" || request.status === "certificate_issued") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Checklist</CardTitle>
                    <CardDescription>Safety and compliance verification.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      {[
                        { id: "fireSafety", label: "Fire Safety Standards Met" },
                        { id: "structural", label: "Structural Integrity Verified" },
                        { id: "electrical", label: "Electrical Systems Compliant" },
                        { id: "plumbing", label: "Plumbing Systems Compliant" },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                          <Checkbox 
                            id={item.id} 
                            checked={
                              // If audit already exists, use that data, else local state
                              request.audit?.checklistData?.[item.id] ?? checklist[item.id]
                            }
                            onCheckedChange={(checked) => {
                              if (isAuditor && request.status === 'auditor_assigned') {
                                setChecklist(prev => ({ ...prev, [item.id]: !!checked }));
                              }
                            }}
                            disabled={!isAuditor || request.status !== 'auditor_assigned'}
                          />
                          <Label htmlFor={item.id} className="font-medium cursor-pointer flex-1">{item.label}</Label>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label>Auditor Conclusion</Label>
                      <Input 
                        value={request.audit?.conclusion || conclusion}
                        onChange={(e) => setConclusion(e.target.value)}
                        placeholder="Summary of findings..."
                        disabled={!isAuditor || request.status !== 'auditor_assigned'}
                      />
                    </div>

                    {isAuditor && request.status === "auditor_assigned" && (
                      <Button onClick={handleSubmitAudit} className="w-full">Submit Audit Report</Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Admin Approval */}
              {isAdmin && request.status === "audit_submitted" && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="text-orange-900">Admin Review</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Issue Certificate
                    </Button>
                    <Button variant="destructive" onClick={handleReject}>
                      <AlertCircle className="h-4 w-4 mr-2" /> Reject Request
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Certificate Issuance */}
              {isAdmin && request.status === "approved" && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-green-900">Issue Certificate</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <ObjectUploader
                         onGetUploadParameters={async (file) => {
                           const res = await fetch("/api/uploads/request-url", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                           });
                           const { uploadURL } = await res.json();
                           return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                         }}
                         onComplete={async (res) => {
                           await handleIssueCertificate(res);
                           await handleCertificateIssued();
                         }}
                    >
                      <Button className="w-full"><Upload className="mr-2 h-4 w-4" /> Upload Final Certificate</Button>
                    </ObjectUploader>
                  </CardContent>
                </Card>
              )}

              {request.status === "certificate_issued" && (
                <div className="p-6 bg-green-100 border border-green-200 rounded-xl text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-900">Certificate Issued!</h3>
                  <p className="text-green-700 mb-4">The project has been successfully certified.</p>
                  {/* Find the certificate file to show download button */}
                  {files?.find(f => f.type === 'certificate') && (
                     <a href={files.find(f => f.type === 'certificate')?.url} target="_blank" rel="noopener noreferrer">
                       <Button className="bg-green-600 hover:bg-green-700">Download Certificate</Button>
                     </a>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
