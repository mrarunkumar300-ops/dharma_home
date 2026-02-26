import { useState } from "react";
import { useAuditLog } from "@/hooks/useDatabaseManagement";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, RefreshCw, ScrollText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export const DbAuditTab = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState("");
  const pageSize = 30;
  const { data: auditData, isLoading } = useAuditLog(page, pageSize, entityFilter);

  const logs = auditData?.data || [];
  const total = auditData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const actionColor = (action: string) => {
    if (action.includes("DELETE")) return "destructive";
    if (action.includes("INSERT") || action.includes("CREATE") || action.includes("ADDED")) return "default";
    if (action.includes("UPDATE")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by entity..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            <SelectItem value="profiles">Profiles</SelectItem>
            <SelectItem value="organizations">Organizations</SelectItem>
            <SelectItem value="properties">Properties</SelectItem>
            <SelectItem value="tenants">Tenants</SelectItem>
            <SelectItem value="enum">Enums</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["db-audit-log"] })}>
          <RefreshCw className="w-4 h-4" />
        </Button>

        <Badge variant="outline" className="ml-auto">{total} entries</Badge>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading audit log...
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No audit entries found
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM dd, HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.profiles?.full_name || log.profiles?.email || log.user_id?.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionColor(log.action) as any} className="text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{log.entity_type || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-64 truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
