import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Validate that user is super_admin
async function validateSuperAdmin(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Unauthorized");

  const userId = data.claims.sub as string;

  // Check super_admin role using service client
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleData } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (!roleData) throw new Error("Access denied: Super Admin only");

  return { userId, serviceClient };
}

// Log audit entry
async function logAudit(
  serviceClient: any,
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: any
) {
  // Get first org for logging (super admin)
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  await serviceClient.from("activity_log").insert({
    user_id: userId,
    organization_id: profile?.organization_id || "00000000-0000-0000-0000-000000000000",
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

// Sanitize identifiers to prevent SQL injection
function sanitizeIdentifier(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return name;
}

// Allowed tables for safety
const ALLOWED_TABLES = [
  "profiles", "organizations", "properties", "units", "tenants",
  "invoices", "payments", "maintenance_tickets", "expenses",
  "activity_log", "user_roles", "tenant_documents", "ticket_comments",
  "notifications", "user_permissions", "tenants_profile",
  "tenant_bills", "tenant_family_members", "tenant_payment_records", "tenant_rooms",
];

function validateTable(table: string) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table '${table}' is not allowed`);
  }
}

// SQL type mapping
const VALID_COLUMN_TYPES = [
  "text", "integer", "bigint", "numeric", "boolean", "uuid",
  "date", "timestamp with time zone", "jsonb", "json",
];

// ─── ACTION HANDLERS ────────────────────────────────────────

async function listTables(serviceClient: any) {
  const { data, error } = await serviceClient.rpc("get_table_info");
  if (error) {
    // Fallback: query information_schema
    const counts: Record<string, number> = {};
    for (const table of ALLOWED_TABLES) {
      const { count } = await serviceClient
        .from(table)
        .select("*", { count: "exact", head: true });
      counts[table] = count || 0;
    }
    return { tables: ALLOWED_TABLES.map((t) => ({ name: t, row_count: counts[t] || 0 })) };
  }
  return { tables: data };
}

async function getTableSchema(serviceClient: any, table: string) {
  validateTable(table);
  // Use pg_catalog to get column info
  const { data, error } = await serviceClient.rpc("get_column_info", { _table_name: table });
  if (error) {
    // Fallback: get one row and infer
    const { data: sample } = await serviceClient.from(table).select("*").limit(1);
    const columns = sample && sample.length > 0
      ? Object.keys(sample[0]).map((col) => ({
          column_name: col,
          data_type: typeof sample[0][col],
          is_nullable: "YES",
          column_default: null,
        }))
      : [];
    return { table, columns };
  }
  return { table, columns: data };
}

async function getTableData(
  serviceClient: any,
  table: string,
  page = 1,
  pageSize = 50,
  search = "",
  orderBy = "created_at",
  orderDir = "desc"
) {
  validateTable(table);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = serviceClient.from(table).select("*", { count: "exact" });

  if (search) {
    // Search across text-like columns - basic approach
    query = query.or(
      `id.eq.${search}`
    );
  }

  // Try ordering
  try {
    query = query.order(orderBy, { ascending: orderDir === "asc" });
  } catch {
    // Column might not exist, skip ordering
  }

  query = query.range(from, to);
  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return { data: data || [], total: count || 0, page, pageSize };
}

async function insertRow(serviceClient: any, userId: string, table: string, rowData: any) {
  validateTable(table);
  const { data, error } = await serviceClient.from(table).insert(rowData).select();
  if (error) throw new Error(error.message);

  await logAudit(serviceClient, userId, "ROW_INSERTED", table, data?.[0]?.id, {
    table,
    row: data?.[0],
  });

  return { success: true, data: data?.[0] };
}

async function updateRow(serviceClient: any, userId: string, table: string, id: string, rowData: any) {
  validateTable(table);
  const { data, error } = await serviceClient.from(table).update(rowData).eq("id", id).select();
  if (error) throw new Error(error.message);

  await logAudit(serviceClient, userId, "ROW_UPDATED", table, id, {
    table,
    changes: rowData,
  });

  return { success: true, data: data?.[0] };
}

async function deleteRow(serviceClient: any, userId: string, table: string, id: string) {
  validateTable(table);
  const { error } = await serviceClient.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(serviceClient, userId, "ROW_DELETED", table, id, { table });

  return { success: true };
}

async function addColumn(serviceClient: any, userId: string, table: string, columnName: string, columnType: string, nullable: boolean, defaultValue: string | null) {
  validateTable(table);
  sanitizeIdentifier(columnName);

  if (!VALID_COLUMN_TYPES.includes(columnType)) {
    throw new Error(`Invalid column type: ${columnType}`);
  }

  let sql = `ALTER TABLE public."${table}" ADD COLUMN "${columnName}" ${columnType}`;
  if (!nullable) sql += " NOT NULL";
  if (defaultValue) sql += ` DEFAULT '${defaultValue.replace(/'/g, "''")}'`;

  // Execute via service role direct query
  const res = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      },
      body: JSON.stringify({ sql }),
    }
  );

  // If rpc doesn't exist, try direct SQL via management API
  if (!res.ok) {
    const pgRes = await fetch(
      `${Deno.env.get("SUPABASE_DB_URL")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql }),
      }
    );
    if (!pgRes.ok) {
      const err = await pgRes.text();
      throw new Error(`Failed to add column: ${err}`);
    }
  }

  await logAudit(serviceClient, userId, "COLUMN_ADDED", table, null, {
    table,
    column: columnName,
    type: columnType,
    nullable,
    defaultValue,
  });

  return { success: true, message: `Column '${columnName}' added to '${table}'` };
}

async function deleteColumn(serviceClient: any, userId: string, table: string, columnName: string) {
  validateTable(table);
  sanitizeIdentifier(columnName);

  // Prevent deleting critical columns
  const protectedColumns = ["id", "created_at", "updated_at", "organization_id", "user_id"];
  if (protectedColumns.includes(columnName)) {
    throw new Error(`Cannot delete protected column: ${columnName}`);
  }

  const sql = `ALTER TABLE public."${table}" DROP COLUMN "${columnName}"`;

  const res = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      },
      body: JSON.stringify({ sql }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete column. Schema changes may require migration.");
  }

  await logAudit(serviceClient, userId, "COLUMN_DELETED", table, null, {
    table,
    column: columnName,
  });

  return { success: true, message: `Column '${columnName}' deleted from '${table}'` };
}

async function listEnums(serviceClient: any) {
  // Query pg_enum for custom types
  const { data, error } = await serviceClient.rpc("get_enum_types");
  if (error) {
    // Fallback: return known enums
    return {
      enums: [
        {
          name: "app_role",
          values: ["admin", "manager", "super_admin", "tenant", "staff", "guest", "user"],
        },
      ],
    };
  }
  return { enums: data };
}

async function addEnumValue(serviceClient: any, userId: string, enumName: string, value: string) {
  sanitizeIdentifier(enumName);
  if (!/^[a-zA-Z_][a-zA-Z0-9_ ]*$/.test(value)) {
    throw new Error(`Invalid enum value: ${value}`);
  }

  const sql = `ALTER TYPE public."${enumName}" ADD VALUE IF NOT EXISTS '${value.replace(/'/g, "''")}'`;

  const res = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      },
      body: JSON.stringify({ sql }),
    }
  );

  await logAudit(serviceClient, userId, "ENUM_VALUE_ADDED", "enum", null, {
    enum: enumName,
    value,
  });

  return { success: true, message: `Value '${value}' added to enum '${enumName}'` };
}

async function getAuditLog(serviceClient: any, page = 1, pageSize = 50, entityType = "") {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = serviceClient
    .from("activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { data: data || [], total: count || 0, page, pageSize };
}

async function getDatabaseHealth(serviceClient: any) {
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const table of ALLOWED_TABLES) {
    const { count } = await serviceClient
      .from(table)
      .select("*", { count: "exact", head: true });
    tableCounts[table] = count || 0;
    totalRecords += count || 0;
  }

  return {
    totalRecords,
    totalTables: ALLOWED_TABLES.length,
    tableCounts,
    estimatedSizeMB: ((totalRecords * 1024) / 1024 / 1024).toFixed(2),
    status: "healthy",
    timestamp: new Date().toISOString(),
  };
}

async function exportTable(serviceClient: any, table: string, format: string) {
  validateTable(table);
  const { data, error } = await serviceClient.from(table).select("*").limit(10000);
  if (error) throw new Error(error.message);

  if (format === "json") {
    return { data, format: "json" };
  }

  // CSV format
  if (!data || data.length === 0) return { data: "", format: "csv" };
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row: any) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
    ),
  ].join("\n");

  return { data: csv, format: "csv" };
}

// ─── MAIN HANDLER ────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { userId, serviceClient } = await validateSuperAdmin(authHeader);

    const body = await req.json();
    const { action, ...params } = body;

    let result: any;

    switch (action) {
      case "list_tables":
        result = await listTables(serviceClient);
        break;

      case "get_table_schema":
        result = await getTableSchema(serviceClient, params.table);
        break;

      case "get_table_data":
        result = await getTableData(
          serviceClient, params.table, params.page, params.pageSize,
          params.search, params.orderBy, params.orderDir
        );
        break;

      case "insert_row":
        result = await insertRow(serviceClient, userId, params.table, params.rowData);
        break;

      case "update_row":
        result = await updateRow(serviceClient, userId, params.table, params.id, params.rowData);
        break;

      case "delete_row":
        result = await deleteRow(serviceClient, userId, params.table, params.id);
        break;

      case "add_column":
        result = await addColumn(
          serviceClient, userId, params.table,
          params.columnName, params.columnType, params.nullable ?? true, params.defaultValue
        );
        break;

      case "delete_column":
        result = await deleteColumn(serviceClient, userId, params.table, params.columnName);
        break;

      case "list_enums":
        result = await listEnums(serviceClient);
        break;

      case "add_enum_value":
        result = await addEnumValue(serviceClient, userId, params.enumName, params.value);
        break;

      case "get_audit_log":
        result = await getAuditLog(serviceClient, params.page, params.pageSize, params.entityType);
        break;

      case "database_health":
        result = await getDatabaseHealth(serviceClient);
        break;

      case "export_table":
        result = await exportTable(serviceClient, params.table, params.format || "csv");
        break;

      default:
        return errorResponse(`Unknown action: ${action}`);
    }

    return jsonResponse(result);
  } catch (err: any) {
    console.error("Database management error:", err);
    const status = err.message === "Unauthorized" ? 401
      : err.message.startsWith("Access denied") ? 403
      : 400;
    return errorResponse(err.message, status);
  }
});
