import { Layout } from "@/components/Layout";
import { useRequest, useUpdateRequest } from "@/hooks/use-requests";
import { useFiles, useCreateFile } from "@/hooks/use-files";
import { useCreateAudit, useUpdateAudit } from "@/hooks/use-audits";
import { useAuditors } from "@/hooks/use-auditors";
import { useProfile } from "@/hooks/use-profiles";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useRoute } from "wouter";
import { ArrowLeft, File, Download, Upload, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useState, useRef } from "react";
import { Separator } from "@/components/ui/separator";

export default function RequestDetail() {
  const [, params] = useRoute("/requests/:id");
  const id = Number(params?.id);
  
  const { data: request, isLoading } = useRequest(id);
  const { data: profile } = useProfile();
  const { data: files } = useFiles(id);
  const { data: auditors } = useAuditors();
  
  const updateRequest = useUpdateRequest();
  const createFile = useCreateFile();
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();

  const [quotePrice, setQuotePrice] = useState("");
  const [selectedAuditorId, setSelectedAuditorId] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    fireSafety: false,
    structural: false,
    electrical: false,
    plumbing: false
  });
  const [conclusion, setConclusion] = useState("");
  
  const filePathMapRef = useRef<Map<string, string>>(new Map());

  if (isLoading || !request || !profile) {
    return (
      <Layout>
        <div className="p-8 text-center">Уншиж байна...</div>
      </Layout>
    );
  }

  const getUploadParams = async (file: any) => {
    const res = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
    });
    const { uploadURL, objectPath } = await res.json();
    filePathMapRef.current.set(file.id, objectPath);
    return { method: "PUT" as const, url: uploadURL, headers: { "Content-Type": file.type || "application/octet-stream" } };
  };

  const handleFileUpload = (type: string) => async (result: any) => {
    if (result.successful) {
      for (const file of result.successful) {
        const objectPath = filePathMapRef.current.get(file.id) || file.uploadURL;
        await createFile.mutateAsync({
          requestId: id,
          name: file.name,
          url: objectPath,
          type: type as any,
        });
        filePathMapRef.current.delete(file.id);
      }
    }
  };

  const handleSendQuote = async () => {
    await updateRequest.mutateAsync({ 
      id, 
      priceQuote: Number(quotePrice),
      status: "quoted" 
    });
  };

  const handleUploadContract = handleFileUpload("contract");
  
  const handleContractSigned = async () => {
    await updateRequest.mutateAsync({ id, status: "contract_signed" });
  };

  const handleProjectFilesUploaded = async () => {
    await updateRequest.mutateAsync({ id, status: "files_uploaded" });
  };

  const handleAssignAuditor = async () => {
    if (!selectedAuditorId) return;
    await updateRequest.mutateAsync({ 
      id, 
      auditorId: selectedAuditorId,
      status: "auditor_assigned" 
    });
  };

  const handleSubmitAudit = async () => {
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
  
  const handleCertificateIssued = async () => {
    await updateRequest.mutateAsync({ id, status: "certificate_issued" });
  };

  const isAuditor = profile.role === 'auditor';
  const isAdmin = profile.role === 'admin';
  const isUser = profile.role === 'legal_entity';

  const fileTypeLabels: Record<string, string> = {
    project_file: "Төслийн файл",
    contract: "Гэрээ",
    certificate: "Гэрчилгээ",
    audit_report: "Аудит тайлан"
  };

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
                Үнэ: ₮{request.priceQuote.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl w-full justify-start h-auto">
            <TabsTrigger value="details" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Дэлгэрэнгүй</TabsTrigger>
            <TabsTrigger value="files" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Файл & Баримт</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Аудит & Үр дүн</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="details" className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Төслийн мэдээлэл</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-500">Тайлбар</Label>
                    <p className="mt-1 text-gray-900">{request.description}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Талбай</Label>
                    <p className="mt-1 text-gray-900">{request.projectArea} м²</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Байршил</Label>
                    <p className="mt-1 text-gray-900">{request.location}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Илгээсэн</Label>
                    <p className="mt-1 text-gray-900">{request.user?.organizationName}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Actions for Admin */}
              {isAdmin && request.status === "submitted" && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Админ үйлдэл: Үнийн санал илгээх</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Input 
                      type="number" 
                      placeholder="Үнийн санал оруулах..." 
                      className="max-w-xs bg-white"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                    />
                    <Button onClick={handleSendQuote} disabled={!quotePrice}>Үнийн санал илгээх</Button>
                  </CardContent>
                </Card>
              )}
              
              {isAdmin && request.status === "quoted" && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Админ үйлдэл: Гэрээ оруулах</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <ObjectUploader
                         onGetUploadParameters={getUploadParams}
                         onComplete={handleFileUpload("contract")}
                      >
                        <Upload className="mr-2 h-4 w-4" /> Гэрээний PDF оруулах
                      </ObjectUploader>
                      
                      <Button onClick={handleContractSigned}>Гэрээ байгуулсан гэж тэмдэглэх</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isAdmin && request.status === "files_uploaded" && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Админ үйлдэл: Аудитор томилох
                    </CardTitle>
                    <CardDescription>Энэ төслийг хянах аудитор сонгоно уу.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Аудитор сонгох</Label>
                        <Select value={selectedAuditorId} onValueChange={setSelectedAuditorId}>
                          <SelectTrigger data-testid="select-auditor">
                            <SelectValue placeholder="Аудитор сонгох..." />
                          </SelectTrigger>
                          <SelectContent>
                            {auditors?.length === 0 && (
                              <div className="p-2 text-sm text-gray-500">Аудитор олдсонгүй</div>
                            )}
                            {auditors?.map((auditor) => (
                              <SelectItem key={auditor.id} value={auditor.id}>
                                {auditor.firstName && auditor.lastName 
                                  ? `${auditor.firstName} ${auditor.lastName}` 
                                  : auditor.email || `Аудитор ${auditor.id.slice(0, 8)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleAssignAuditor} 
                        disabled={!selectedAuditorId}
                        data-testid="button-assign-auditor"
                      >
                        Аудитор томилох
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            <TabsContent value="files" className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Төслийн файлууд</h3>
                
                {isUser && request.status === "contract_signed" && (
                  <ObjectUploader
                     onGetUploadParameters={getUploadParams}
                     onComplete={async (res) => {
                       await handleFileUpload("project_file")(res);
                       await handleProjectFilesUploaded();
                     }}
                  >
                    <Upload className="h-4 w-4 mr-2" /> Төслийн файл оруулах
                  </ObjectUploader>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files?.length === 0 && <p className="text-gray-500 col-span-full">Файл оруулаагүй байна.</p>}
                {files?.map((file) => (
                  <Card key={file.id} className="group hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                          <File className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                          {fileTypeLabels[file.type] || file.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(file.createdAt!), "yyyy.MM.dd")}
                        </p>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="mt-auto">
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" /> Татах
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audit" className="space-y-6 animate-fade-in">
              {(isAuditor || isAdmin || request.status === "audit_submitted" || request.status === "approved" || request.status === "certificate_issued") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Аудитын шалгах хуудас</CardTitle>
                    <CardDescription>Аюулгүй байдал, нийцлийн шалгалт.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      {[
                        { id: "fireSafety", label: "Галын аюулгүй байдлын стандарт хангасан" },
                        { id: "structural", label: "Бүтцийн бүрэн бүтэн байдал шалгагдсан" },
                        { id: "electrical", label: "Цахилгааны систем нийцсэн" },
                        { id: "plumbing", label: "Сантехникийн систем нийцсэн" },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                          <Checkbox 
                            id={item.id} 
                            checked={
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
                      <Label>Аудиторын дүгнэлт</Label>
                      <Input 
                        value={request.audit?.conclusion || conclusion}
                        onChange={(e) => setConclusion(e.target.value)}
                        placeholder="Шалгалтын дүгнэлт..."
                        disabled={!isAuditor || request.status !== 'auditor_assigned'}
                      />
                    </div>

                    {isAuditor && request.status === "auditor_assigned" && (
                      <Button onClick={handleSubmitAudit} className="w-full">Аудит тайлан илгээх</Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {isAdmin && request.status === "audit_submitted" && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="text-orange-900">Админ хяналт</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Зөвшөөрч гэрчилгээ олгох
                    </Button>
                    <Button variant="destructive" onClick={handleReject}>
                      <AlertCircle className="h-4 w-4 mr-2" /> Татгалзах
                    </Button>
                  </CardContent>
                </Card>
              )}

              {isAdmin && request.status === "approved" && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-green-900">Гэрчилгээ олгох</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <ObjectUploader
                         onGetUploadParameters={getUploadParams}
                         onComplete={async (res) => {
                           await handleIssueCertificate(res);
                           await handleCertificateIssued();
                         }}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Эцсийн гэрчилгээ оруулах
                    </ObjectUploader>
                  </CardContent>
                </Card>
              )}

              {request.status === "certificate_issued" && (
                <div className="p-6 bg-green-100 border border-green-200 rounded-xl text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-900">Гэрчилгээ олгогдлоо!</h3>
                  <p className="text-green-700 mb-4">Төсөл амжилттай гэрчилгээжлээ.</p>
                  {files?.find(f => f.type === 'certificate') && (
                     <a href={files.find(f => f.type === 'certificate')?.url} target="_blank" rel="noopener noreferrer">
                       <Button className="bg-green-600 hover:bg-green-700">Гэрчилгээ татах</Button>
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
