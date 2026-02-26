import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUnits, Unit } from "@/hooks/useUnits";
import { useProperties } from "@/hooks/useProperties";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Search,
    Filter,
    Home,
    Users,
    Loader2,
    Building2,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    Edit2,
    Trash2,
    UserPlus,
    UserMinus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { UnitDialog } from "@/components/units/UnitDialog";
import { AssignTenantDialog } from "@/components/units/AssignTenantDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrencyIcon } from "@/components/CurrencyIcon";

const StatusBadge = ({ status, availability }: { status?: string, availability: string }) => {
    const isInactive = status === "inactive";

    if (isInactive) {
        return (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                <XCircle className="w-3 h-3" /> Inactive
            </Badge>
        );
    }

    const styles: Record<string, string> = {
        occupied: "bg-success/10 text-success border-success/20",
        vacant: "bg-primary/10 text-primary border-primary/20",
        maintenance: "bg-warning/10 text-warning border-warning/20",
    };

    return (
        <Badge variant="outline" className={cn("gap-1", styles[availability.toLowerCase()] || "")}>
            {availability === "occupied" && <CheckCircle2 className="w-3 h-3" />}
            {availability.charAt(0).toUpperCase() + availability.slice(1)}
        </Badge>
    );
};

import { cn } from "@/lib/utils";

const Units = () => {
    const { formatAmount } = useCurrency();
    const [selectedPropId, setSelectedPropId] = useState<string>("all");
    const [search, setSearch] = useState("");
    const { units, isLoading, createUnit, updateUnit, deleteUnit, assignTenant, unassignTenant } = useUnits(selectedPropId);
    const { properties } = useProperties();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | undefined>();
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>();

    const filteredUnits = useMemo(() => {
        return units?.filter(unit =>
            unit.unit_number.toLowerCase().includes(search.toLowerCase()) ||
            unit.properties?.name.toLowerCase().includes(search.toLowerCase())
        ) || [];
    }, [units, search]);

    const handleAdd = (data: any) => {
        createUnit.mutate(data, {
            onSuccess: () => setDialogOpen(false)
        });
    };

    const handleEdit = (data: any) => {
        if (editingUnit) {
            updateUnit.mutate({ id: editingUnit.id, ...data }, {
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingUnit(undefined);
                }
            });
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this unit?")) {
            deleteUnit.mutate(id);
        }
    };

    const handleAssignTenant = (unit: Unit) => {
        setSelectedUnit(unit);
        setAssignDialogOpen(true);
    };

    const handleUnassignTenant = (unit: Unit) => {
        if (unit.tenant_id && confirm("Are you sure you want to unassign this tenant?")) {
            unassignTenant.mutate({ 
                unitId: unit.id, 
                tenantId: unit.tenant_id 
            });
        }
    };

    const handleTenantAssignment = async (data: any) => {
        if (selectedUnit) {
            await assignTenant.mutateAsync({
                unitId: selectedUnit.id,
                tenantId: data.tenant_id,
                leaseStart: data.lease_start,
                leaseEnd: data.lease_end,
            });
        }
    };

    const openEditDialog = (unit: Unit) => {
        setEditingUnit(unit);
        setDialogOpen(true);
    };

    const openAddDialog = () => {
        setEditingUnit(undefined);
        setDialogOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Units Inventory</h1>
                        <p className="text-muted-foreground mt-1">Manage individual units and rooms across your portfolio.</p>
                    </div>
                    <Button onClick={openAddDialog} className="glow-primary rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Unit
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by unit number or property..."
                            className="pl-10 rounded-xl bg-muted/50 border-border/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <Select value={selectedPropId} onValueChange={setSelectedPropId}>
                            <SelectTrigger className="rounded-xl border-border/50 bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <SelectValue placeholder="All Properties" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="glass-card">
                                <SelectItem value="all">All Properties</SelectItem>
                                {properties?.map((prop) => (
                                    <SelectItem key={prop.id} value={prop.id}>
                                        {prop.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" className="rounded-xl border-border/50">
                        <Filter className="w-4 h-4 mr-2" />
                        Sort By
                    </Button>
                </div>

                {/* Units Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredUnits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] glass-card p-12 border-2 border-dashed">
                        <Home className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No units found</h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-6">
                            {selectedPropId !== "all"
                                ? "This property doesn't have any units yet."
                                : "Start by adding your first unit to the inventory."}
                        </p>
                        <Button onClick={openAddDialog} variant="outline" className="rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Unit
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredUnits.map((unit, index) => (
                                <motion.div
                                    key={unit.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="glass-card-hover p-5 space-y-4 group relative"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Home className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-none">Unit {unit.unit_number}</h3>
                                                <Badge variant="secondary" className="mt-1.5 text-[10px] h-4 px-1.5 bg-muted/50 text-muted-foreground uppercase font-bold tracking-tighter">
                                                    {unit.room_type || "Standard"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge availability={unit.availability} status={unit.status} />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="glass-card border-border/50">
                                                    <DropdownMenuItem onClick={() => openEditDialog(unit)} className="gap-2">
                                                        <Edit2 className="w-3.5 h-3.5" /> Edit Unit
                                                    </DropdownMenuItem>
                                                    {unit.availability === 'vacant' ? (
                                                        <DropdownMenuItem onClick={() => handleAssignTenant(unit)} className="gap-2">
                                                            <UserPlus className="w-3.5 h-3.5" /> Assign Tenant
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleUnassignTenant(unit)} className="gap-2 text-destructive focus:text-destructive">
                                                            <UserMinus className="w-3.5 h-3.5" /> Unassign Tenant
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleDelete(unit.id)} className="gap-2 text-destructive focus:text-destructive">
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete Unit
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Building2 className="w-3 h-3" />
                                            <span className="truncate">{unit.properties?.name}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Planned Rent</p>
                                            <div className="flex items-center gap-1 text-sm font-bold">
                                                <CurrencyIcon className="w-3 h-3 text-success" />
                                                {formatAmount(unit.rent)}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Current Tenant</p>
                                            <div className="flex items-center gap-1 text-sm font-medium truncate">
                                                <Users className="w-3 h-3 text-primary/70" />
                                                <span className="truncate">{unit.tenants?.name || "Ready to Lease"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                            UID: {unit.id.slice(0, 8)}
                                        </span>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider hover:bg-primary/10 hover:text-primary rounded-lg transition-all">
                                            Manage state
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <UnitDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={editingUnit ? handleEdit : handleAdd}
                initialData={editingUnit}
                title={editingUnit ? "Edit Unit Details" : "Add Unit to Inventory"}
            />

            <AssignTenantDialog
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                onSubmit={handleTenantAssignment}
                isLoading={assignTenant.isPending}
                unitId={selectedUnit?.id}
                currentTenantId={selectedUnit?.tenant_id}
            />
        </DashboardLayout>
    );
};

export default Units;
