import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  MapPin,
  Home,
  MoreHorizontal,
  Loader2,
  Trash2,
  Edit2,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperties, Property } from "@/hooks/useProperties";
import { useUnits } from "@/hooks/useUnits";
import { useCurrency } from "@/hooks/useCurrency";
import { PropertyDialog } from "@/components/properties/PropertyDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const Properties = () => {
  const { formatAmount } = useCurrency();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const { properties, isLoading, createProperty, updateProperty, deleteProperty } = useProperties();
  const { units: allUnits } = useUnits("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();

  const stats = useMemo(() => {
    const propertyStats: Record<string, { total: number; occupied: number; vacant: number; revenue: number }> = {};

    properties?.forEach(prop => {
      const propUnits = allUnits?.filter(u => u.property_id === prop.id) || [];
      const occupied = propUnits.filter(u => u.availability === "occupied");

      propertyStats[prop.id] = {
        total: propUnits.length,
        occupied: occupied.length,
        vacant: propUnits.length - occupied.length,
        revenue: occupied.reduce((sum, u) => sum + (u.rent || 0), 0)
      };
    });

    return propertyStats;
  }, [properties, allUnits]);

  const filtered = properties?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase()) ||
    p.custom_id?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAdd = (data: any) => {
    createProperty.mutate(data, {
      onSuccess: () => setDialogOpen(false)
    });
  };

  const handleEdit = (data: any) => {
    if (editingProperty) {
      updateProperty.mutate({ id: editingProperty.id, ...data }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingProperty(undefined);
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      deleteProperty.mutate(id);
    }
  };

  const openEditDialog = (property: Property) => {
    setEditingProperty(property);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingProperty(undefined);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground mt-1">
              {properties?.length || 0} properties in your portfolio
            </p>
          </div>
          <Button onClick={openAddDialog} className="rounded-xl gap-2 glow-primary">
            <Plus className="w-4 h-4" />
            Add Property
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-muted/50 border-border/50"
            />
          </div>
          <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                view === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] glass-card p-12 border-dashed border-2">
            <Home className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Start by adding your first property to manage units, tenants, and bills.
            </p>
            <Button onClick={openAddDialog} variant="outline" className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add First Property
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.map((property, i) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card-hover p-5 group relative"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {property.image_emoji || "🏢"}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                            {property.custom_id || `ID: ${property.id.slice(0, 8)}`}
                          </p>
                          <h3 className="font-bold text-lg leading-none">{property.name}</h3>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border-border/50">
                          <DropdownMenuItem onClick={() => openEditDialog(property)} className="gap-2">
                            <Edit2 className="w-3.5 h-3.5" /> Edit Property
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(property.id)} className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" /> Delete Property
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{property.address || "No address provided"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[9px] font-bold uppercase text-muted-foreground mb-0.5">Owner</p>
                        <p className="text-xs font-medium truncate flex items-center gap-1">
                          <User className="w-3 h-3 text-primary/60" />
                          {property.owner_name || "No Owner"}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[9px] font-bold uppercase text-muted-foreground mb-0.5">Status</p>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                          property.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        )}>
                          {property.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Home className="w-3.5 h-3.5 text-primary" />
                          <span>{stats[property.id]?.total || 0} Total Units</span>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          {formatAmount(stats[property.id]?.revenue || 0)}/mo
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-success" />
                          {stats[property.id]?.occupied || 0} Occupied
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {stats[property.id]?.vacant || 0} Vacant
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">Property</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">Location</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">Owner</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">Units</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">Status</th>
                        <th className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((property) => (
                        <tr key={property.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{property.image_emoji || "🏢"}</span>
                              <div>
                                <p className="text-sm font-bold">{property.name}</p>
                                <p className="text-[10px] text-muted-foreground">{property.custom_id || property.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {property.address || "No address"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium">{property.owner_name || "No Owner"}</span>
                              <div className="flex items-center gap-2">
                                {property.mobile && <Phone className="w-2.5 h-2.5 text-muted-foreground" />}
                                {property.email && <Mail className="w-2.5 h-2.5 text-muted-foreground" />}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold">{stats[property.id]?.total || 0} Units</span>
                              <div className="w-20 bg-muted rounded-full h-1">
                                <div
                                  className="bg-primary h-1 rounded-full"
                                  style={{ width: `${((stats[property.id]?.occupied || 0) / (stats[property.id]?.total || 1)) * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                              property.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                            )}>
                              {property.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button onClick={() => openEditDialog(property)} variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button onClick={() => handleDelete(property.id)} variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <PropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={editingProperty ? handleEdit : handleAdd}
        initialData={editingProperty}
        title={editingProperty ? "Edit Property" : "Add New Property"}
      />
    </DashboardLayout>
  );
};

export default Properties;
