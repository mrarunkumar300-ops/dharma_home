import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Table2, Columns, Tag, ScrollText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { DbOverviewTab } from "@/components/database/DbOverviewTab";
import { DbTablesTab } from "@/components/database/DbTablesTab";
import { DbSchemaTab } from "@/components/database/DbSchemaTab";
import { DbEnumsTab } from "@/components/database/DbEnumsTab";
import { DbAuditTab } from "@/components/database/DbAuditTab";

const SuperAdminDatabase = () => {
  const qc = useQueryClient();

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Database Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Full database control — CRUD, schema, enums, and audit trail
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => qc.invalidateQueries()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh All
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-1.5">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-1.5">
              <Table2 className="w-4 h-4" />
              <span className="hidden sm:inline">Tables</span>
            </TabsTrigger>
            <TabsTrigger value="schema" className="gap-1.5">
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Schema</span>
            </TabsTrigger>
            <TabsTrigger value="enums" className="gap-1.5">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Enums</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <ScrollText className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Log</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DbOverviewTab />
          </TabsContent>
          <TabsContent value="tables">
            <DbTablesTab />
          </TabsContent>
          <TabsContent value="schema">
            <DbSchemaTab />
          </TabsContent>
          <TabsContent value="enums">
            <DbEnumsTab />
          </TabsContent>
          <TabsContent value="audit">
            <DbAuditTab />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDatabase;
