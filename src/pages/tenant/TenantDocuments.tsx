import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenantProfile } from "@/hooks/useTenantProfile";
import { motion } from "framer-motion";
import { FileText, Download, Upload, File, Calendar, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";

const TenantDocuments = () => {
  const { data: dashboardData, isLoading } = useTenantProfile();
  const documents = dashboardData?.documents || [];

  const docTypeIcons: Record<string, string> = {
    "ID Proof": "🪪",
    "Agreement": "📄",
    "Address Proof": "📍",
    "Photo": "📸",
    "Contract": "📋",
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Documents</h1>
            <p className="text-muted-foreground mt-1">View and manage your uploaded documents</p>
          </div>
          <Button className="gap-2">
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Documents", value: documents.length, icon: FileText },
            { label: "Recent Uploads", value: documents.filter(d => {
              const uploaded = new Date(d.uploaded_at);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return uploaded > thirtyDaysAgo;
            }).length, icon: Upload },
            { label: "Document Types", value: new Set(documents.map(d => d.document_type)).size, icon: File },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Documents List */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>Your uploaded files and documents</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                  <Button className="mt-4 gap-2"><Upload className="w-4 h-4" /> Upload Your First Document</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                          {docTypeIcons[doc.document_type || ""] || "📄"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.document_type || "Document"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(doc.uploaded_at), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.document_url && (
                          <>
                            <Button variant="ghost" size="sm" className="gap-1" asChild>
                              <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4" /> View
                              </a>
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1" asChild>
                              <a href={doc.document_url} download>
                                <Download className="w-4 h-4" /> Download
                              </a>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default TenantDocuments;
