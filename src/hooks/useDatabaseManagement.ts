import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-management`;

async function callDbApi(action: string, params: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function useDatabaseHealth() {
  return useQuery({
    queryKey: ["db-health"],
    queryFn: () => callDbApi("database_health"),
    staleTime: 30000,
  });
}

export function useTableData(table: string, page: number, pageSize: number) {
  return useQuery({
    queryKey: ["db-table-data", table, page, pageSize],
    queryFn: () => callDbApi("get_table_data", { table, page, pageSize }),
    enabled: !!table,
  });
}

export function useTableSchema(table: string) {
  return useQuery({
    queryKey: ["db-table-schema", table],
    queryFn: () => callDbApi("get_table_schema", { table }),
    enabled: !!table,
  });
}

export function useEnums() {
  return useQuery({
    queryKey: ["db-enums"],
    queryFn: () => callDbApi("list_enums"),
  });
}

export function useAuditLog(page: number, pageSize: number, entityType = "") {
  return useQuery({
    queryKey: ["db-audit-log", page, pageSize, entityType],
    queryFn: () => callDbApi("get_audit_log", { page, pageSize, entityType }),
  });
}

export function useInsertRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ table, rowData }: { table: string; rowData: any }) =>
      callDbApi("insert_row", { table, rowData }),
    onSuccess: (_, vars) => {
      toast.success("Row inserted successfully");
      qc.invalidateQueries({ queryKey: ["db-table-data", vars.table] });
      qc.invalidateQueries({ queryKey: ["db-health"] });
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useUpdateRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ table, id, rowData }: { table: string; id: string; rowData: any }) =>
      callDbApi("update_row", { table, id, rowData }),
    onSuccess: (_, vars) => {
      toast.success("Row updated successfully");
      qc.invalidateQueries({ queryKey: ["db-table-data", vars.table] });
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ table, id }: { table: string; id: string }) =>
      callDbApi("delete_row", { table, id }),
    onSuccess: (_, vars) => {
      toast.success("Row deleted successfully");
      qc.invalidateQueries({ queryKey: ["db-table-data", vars.table] });
      qc.invalidateQueries({ queryKey: ["db-health"] });
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useAddColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { table: string; columnName: string; columnType: string; nullable: boolean; defaultValue: string | null }) =>
      callDbApi("add_column", params),
    onSuccess: (_, vars) => {
      toast.success(`Column '${vars.columnName}' added`);
      qc.invalidateQueries({ queryKey: ["db-table-schema", vars.table] });
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ table, columnName }: { table: string; columnName: string }) =>
      callDbApi("delete_column", { table, columnName }),
    onSuccess: (_, vars) => {
      toast.success(`Column '${vars.columnName}' deleted`);
      qc.invalidateQueries({ queryKey: ["db-table-schema", vars.table] });
      qc.invalidateQueries({ queryKey: ["db-table-data", vars.table] });
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useAddEnumValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enumName, value }: { enumName: string; value: string }) =>
      callDbApi("add_enum_value", { enumName, value }),
    onSuccess: () => {
      toast.success("Enum value added");
      qc.invalidateQueries({ queryKey: ["db-enums"] });
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useExportTable() {
  return useMutation({
    mutationFn: ({ table, format }: { table: string; format: "csv" | "json" }) =>
      callDbApi("export_table", { table, format }),
    onSuccess: (result, vars) => {
      const content = vars.format === "json" ? JSON.stringify(result.data, null, 2) : result.data;
      const mime = vars.format === "json" ? "application/json" : "text/csv";
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${vars.table}-${new Date().toISOString().split("T")[0]}.${vars.format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${vars.table} as ${vars.format.toUpperCase()}`);
    },
    onError: (err: any) => toast.error(err.message),
  });
}
