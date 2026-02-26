import { useState } from "react";
import { useTableSchema, useAddColumn, useDeleteColumn } from "@/hooks/useDatabaseManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Columns, AlertTriangle } from "lucide-react";

const TABLES = [
  "profiles", "organizations", "properties", "units", "tenants",
  "invoices", "payments", "maintenance_tickets", "expenses",
  "activity_log", "user_roles", "tenant_documents", "ticket_comments",
  "notifications", "user_permissions", "tenants_profile",
  "tenant_bills", "tenant_family_members", "tenant_payment_records", "tenant_rooms",
];

const COLUMN_TYPES = [
  "text", "integer", "bigint", "numeric", "boolean", "uuid",
  "date", "timestamp with time zone", "jsonb", "json",
];

const PROTECTED_COLUMNS = ["id", "created_at", "updated_at", "organization_id", "user_id"];

export const DbSchemaTab = () => {
  const [selectedTable, setSelectedTable] = useState("");
  const { data: schema, isLoading } = useTableSchema(selectedTable);
  const addColumn = useAddColumn();
  const deleteColumn = useDeleteColumn();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCol, setNewCol] = useState({ name: "", type: "text", nullable: true, default: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; column: string }>({ open: false, column: "" });

  const columns = schema?.columns || [];

  const handleAddColumn = () => {
    addColumn.mutate(
      { table: selectedTable, columnName: newCol.name, columnType: newCol.type, nullable: newCol.nullable, defaultValue: newCol.default || null },
      { onSuccess: () => { setAddDialogOpen(false); setNewCol({ name: "", type: "text", nullable: true, default: "" }); } }
    );
  };

  const handleDeleteColumn = () => {
    deleteColumn.mutate(
      { table: selectedTable, columnName: deleteConfirm.column },
      { onSuccess: () => setDeleteConfirm({ open: false, column: "" }) }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedTable} onValueChange={setSelectedTable}>
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
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1">
            <Plus className="w-4 h-4" /> Add Column
          </Button>
        )}
      </div>

      {!selectedTable ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Columns className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Select a table to inspect its schema
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Loading schema...
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono">{selectedTable}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nullable</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((col: any) => {
                  const isProtected = PROTECTED_COLUMNS.includes(col.column_name);
                  return (
                    <TableRow key={col.column_name}>
                      <TableCell className="font-mono text-sm">
                        {col.column_name}
                        {isProtected && <Badge variant="outline" className="ml-2 text-xs">protected</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{col.data_type}</TableCell>
                      <TableCell>
                        <Badge variant={col.is_nullable === "YES" ? "outline" : "secondary"}>
                          {col.is_nullable === "YES" ? "nullable" : "required"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{col.column_default || "—"}</TableCell>
                      <TableCell>
                        {!isProtected && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm({ open: true, column: col.column_name })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Column Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Column to {selectedTable}</DialogTitle>
            <DialogDescription>This will alter the table schema. Use with caution.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Column Name</Label>
              <Input value={newCol.name} onChange={(e) => setNewCol({ ...newCol, name: e.target.value })} placeholder="e.g. phone_number" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select value={newCol.type} onValueChange={(v) => setNewCol({ ...newCol, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newCol.nullable} onCheckedChange={(v) => setNewCol({ ...newCol, nullable: v })} />
              <Label>Nullable</Label>
            </div>
            <div className="space-y-2">
              <Label>Default Value (optional)</Label>
              <Input value={newCol.default} onChange={(e) => setNewCol({ ...newCol, default: e.target.value })} placeholder="e.g. 0" className="font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddColumn} disabled={!newCol.name || addColumn.isPending}>
              {addColumn.isPending ? "Adding..." : "Add Column"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirmation */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(o) => setDeleteConfirm({ ...deleteConfirm, open: o })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Column
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the column <strong className="font-mono">{deleteConfirm.column}</strong> from <strong>{selectedTable}</strong>.
              <br /><br />
              <span className="text-destructive font-semibold">⚠ All data in this column will be lost. This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteColumn.isPending ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
