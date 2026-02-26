import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Mail, Phone, MoreHorizontal, Edit, Trash2, User, RefreshCw, Filter, Home, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTenants } from "@/hooks/useTenants";
import { useCurrency } from "@/hooks/useCurrency";
import { TenantDialog } from "@/components/tenants/TenantDialog";
import { TenantCard } from "@/components/tenants/TenantCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Tenants = () => {
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: tenants = [], isLoading, createTenant, updateTenant, deleteTenant, isAdmin, refetch } = useTenants();

  const filtered = tenants.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: tenants.length,
    active: tenants.filter(t => t.status === "active").length,
    inactive: tenants.filter(t => t.status === "inactive").length,
    expiring: tenants.filter(t => t.status === "expiring").length,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Tenant data refreshed");
    } catch (error) {
      toast.error("Failed to refresh tenant data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    const dataToExport = filtered.map(t => ({
      name: t.name,
      email: t.email || '',
      phone: t.phone || '',
      status: t.status,
      property: Array.isArray(t.units) && t.units[0]?.properties?.name || 'Not assigned',
      unit: t.units?.[0]?.unit_number || 'Not assigned',
      rent: formatAmount(t.units?.[0]?.rent || 0),
      leaseStart: t.lease_start || '',
      leaseEnd: t.lease_end || '',
    }));
    
    const csv = [
      ['Name', 'Email', 'Phone', 'Status', 'Property', 'Unit', 'Rent', 'Lease Start', 'Lease End'],
      ...dataToExport.map(t => [t.name, t.email, t.phone, t.status, t.property, t.unit, t.rent, t.leaseStart, t.leaseEnd])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Tenants data exported');
  };

  const handleEdit = (tenant: any) => {
    setEditingTenant(tenant);
    setDialogOpen(true);
  };

  const handleViewAgreement = (tenant: any) => {
    if (tenant.agreement_document_url) {
      window.open(tenant.agreement_document_url, '_blank');
    } else {
      toast.error("No agreement document available");
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      await updateTenant.mutateAsync({
        id: tenantId,
        status: newStatus,
      });
      toast.success(`Tenant status updated to ${newStatus}`);
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update tenant status");
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate', tenantIds: string[]) => {
    try {
      if (action === 'delete') {
        const promises = tenantIds.map(id => deleteTenant.mutateAsync(id));
        await Promise.all(promises);
        toast.success(`${tenantIds.length} tenants deleted`);
      } else if (action === 'activate') {
        const promises = tenantIds.map(id => 
          updateTenant.mutateAsync({ id, status: 'active' })
        );
        await Promise.all(promises);
        toast.success(`${tenantIds.length} tenants activated`);
      } else if (action === 'deactivate') {
        const promises = tenantIds.map(id => 
          updateTenant.mutateAsync({ id, status: 'inactive' })
        );
        await Promise.all(promises);
        toast.success(`${tenantIds.length} tenants deactivated`);
      }
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const confirmDelete = async () => {
    if (deletingTenant) {
      try {
        await deleteTenant.mutateAsync(deletingTenant.id);
        setDeleteDialogOpen(false);
        setDeletingTenant(null);
        toast.success(`Tenant ${deletingTenant.name} deleted successfully`);
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error(`Failed to delete tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTenant(null);
  };

  const handleDelete = (tenant: any) => {
    setDeletingTenant(tenant);
    setDeleteDialogOpen(true);
  };

  const getTenantStats = () => {
    const total = tenants.length;
    const active = tenants.filter(t => t.status === 'active').length;
    const inactive = tenants.filter(t => t.status === 'inactive').length;
    const withUnits = tenants.filter(t => t.units && (Array.isArray(t.units) ? t.units.length > 0 : !!t.units)).length;
    const withUserAccounts = tenants.filter(t => t.create_user_account).length;
    
    return { total, active, inactive, withUnits, withUserAccounts };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
            <p className="text-muted-foreground mt-1">
              {getTenantStats().active} of {getTenantStats().total} active tenants
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              onClick={handleExport}
              variant="outline" 
              className="gap-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="rounded-xl gap-2 glow-primary">
              <Plus className="w-4 h-4" />
              Add Tenant
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl bg-muted/50 border-border/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
          <div className="flex gap-1">
            {['all', 'active', 'inactive', 'expiring'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="gap-1"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status as keyof typeof statusCounts]})
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 border border-border/50 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tenant, i) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onEdit={handleEdit}
                onViewAgreement={handleViewAgreement}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        <TenantDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          tenant={editingTenant}
          onSubmit={async (data) => {
            if (editingTenant) {
              const { password, ...updateData } = data;
              await updateTenant.mutateAsync({ id: editingTenant.id, ...updateData });
            } else {
              const tenantData: any = {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                lease_start: data.lease_start,
                lease_end: data.lease_end,
                status: data.status,
                property_id: data.property_id || null,
                unit_id: data.unit_id || null,
                rent_amount: data.rent_amount,
                create_user_account: data.create_user_account,
              };
              
              // Only include password when creating user account
              if (data.create_user_account) {
                tenantData.password = data.password;
              }
              
              await createTenant.mutateAsync(tenantData);
            }
          }}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deletingTenant?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Tenants;
