import { useState } from "react";
import { useTableData, useInsertRow, useUpdateRow, useDeleteRow, useExportTable } from "@/hooks/useDatabaseManagement";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Edit, Trash2, Download, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

const TABLES = [
  "profiles", "organizations", "properties", "units", "tenants",
  "invoices", "payments", "maintenance_tickets", "expenses",
  "activity_log", "user_roles", "tenant_documents", "ticket_comments",
  "notifications", "user_permissions", "tenants_profile",
  "tenant_bills", "tenant_family_members", "tenant_payment_records", "tenant_rooms",
];

export const DbTablesTab = () => {
  const qc = useQueryClient();
  const [selectedTable, setSelectedTable] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [isNewRow, setIsNewRow] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: tableResult, isLoading } = useTableData(selectedTable, page, pageSize);
  const insertRow = useInsertRow();
  const updateRow = useUpdateRow();
  const deleteRow = useDeleteRow();
  const exportTable = useExportTable();

  const rows = tableResult?.data || [];
  const total = tableResult?.total || 0;
  const totalPages = Math.ceil(total / pageSize);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const openNewRow = () => {
    setIsNewRow(true);
    setEditingRow(null);
    setFormData({});
    setEditDialogOpen(true);
  };

  const openEditRow = (row: any) => {
    setIsNewRow(false);
    setEditingRow(row);
    const fd: Record<string, string> = {};
    Object.entries(row).forEach(([k, v]) => {
      fd[k] = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    });
    setFormData(fd);
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    // Parse JSON fields back
    const parsed: Record<string, any> = {};
    Object.entries(formData).forEach(([k, v]) => {
      if (k === "id" && !isNewRow) return; // skip id on updates
      try {
        parsed[k] = JSON.parse(v);
      } catch {
        parsed[k] = v === "" ? null : v;
      }
    });

    if (isNewRow) {
      insertRow.mutate({ table: selectedTable, rowData: parsed }, {
        onSuccess: () => setEditDialogOpen(false),
      });
    } else {
      updateRow.mutate({ table: selectedTable, id: editingRow.id, rowData: parsed }, {
        onSuccess: () => setEditDialogOpen(false),
      });
    }
  };

  const handleDelete = () => {
    deleteRow.mutate({ table: selectedTable, id: deleteConfirm.id }, {
      onSuccess: () => setDeleteConfirm({ open: false, id: "" }),
    });
  };

  return (
    <div className="space-y-4">
      {/* Table selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedTable} onValueChange={(v) => { setSelectedTable(v); setPage(1); }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a table..." />
          </SelectTrigger>
          <SelectContent>
            {TABLES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTable && (
          <>
            <Button variant="outline" size="sm" onClick={openNewRow} className="gap-1">
              <Plus className="w-4 h-4" /> Add Row
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportTable.mutate({ table: selectedTable, format: "csv" })} className="gap-1">
              <Download className="w-4 h-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportTable.mutate({ table: selectedTable, format: "json" })} className="gap-1">
              <Download className="w-4 h-4" /> JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["db-table-data", selectedTable] })}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Badge variant="outline" className="ml-auto">{total} records</Badge>
          </>
        )}
      </div>

      {!selectedTable ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Select a table to view and manage its data
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading data...
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Actions</TableHead>
                    {columns.map((col) => (
                      <TableHead key={col} className="text-xs font-mono whitespace-nowrap">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row: any, idx: number) => (
                      <TableRow key={row.id || idx}>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRow(row)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ open: true, id: row.id })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col} className="text-xs max-w-48 truncate">
                            {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
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

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNewRow ? "Insert New Row" : "Edit Row"}</DialogTitle>
            <DialogDescription>
              {isNewRow ? `Add a new record to ${selectedTable}` : `Editing record in ${selectedTable}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
            {(isNewRow ? (columns.length > 0 ? columns.filter(c => c !== "id" && c !== "created_at" && c !== "updated_at") : []) : columns).map((col) => (
              <div key={col} className="space-y-1">
                <Label className="text-xs font-mono">{col}</Label>
                {(formData[col] || "").length > 80 ? (
                  <Textarea
                    value={formData[col] || ""}
                    onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                    rows={3}
                    className="text-xs font-mono"
                    disabled={col === "id" && !isNewRow}
                  />
                ) : (
                  <Input
                    value={formData[col] || ""}
                    onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                    className="text-xs font-mono"
                    disabled={col === "id" && !isNewRow}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={insertRow.isPending || updateRow.isPending}>
              {insertRow.isPending || updateRow.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(o) => setDeleteConfirm({ ...deleteConfirm, open: o })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this record from <strong>{selectedTable}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteRow.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
