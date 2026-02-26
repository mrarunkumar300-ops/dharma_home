import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Home, Building2 } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { Unit } from "@/hooks/useUnits";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    property_id: z.string().min(1, "Property is required"),
    unit_number: z.string().min(1, "Unit name/number is required"),
    room_type: z.enum(["Single", "Double", "1BHK", "2BHK"]),
    rent: z.coerce.number().min(0, "Rent must be positive"),
    availability: z.enum(["vacant", "occupied", "maintenance"]).default("vacant"),
    status: z.enum(["active", "inactive"]).default("active"),
});

interface UnitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: z.infer<typeof formSchema>) => void;
    initialData?: Unit;
    title: string;
}

export const UnitDialog = ({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    title,
}: UnitDialogProps) => {
    const { properties } = useProperties();
    const [propertySearch, setPropertySearch] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            property_id: "",
            unit_number: "",
            room_type: "Single",
            rent: 0,
            availability: "vacant",
            status: "active",
        },
    });

    const selectedPropertyId = form.watch("property_id");
    const isFieldsDisabled = !selectedPropertyId;

    useEffect(() => {
        if (initialData) {
            form.reset({
                property_id: initialData.property_id,
                unit_number: initialData.unit_number,
                room_type: initialData.room_type || "Single",
                rent: initialData.rent,
                availability: (initialData.availability as any) || "vacant",
                status: initialData.status === "inactive" ? "inactive" : "active",
            });
        } else {
            form.reset({
                property_id: "",
                unit_number: "",
                room_type: "Single",
                rent: 0,
                availability: "vacant",
                status: "active",
            });
        }
    }, [initialData, form, open]);

    const filteredProperties = properties?.filter(p =>
        p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
        p.custom_id?.toLowerCase().includes(propertySearch.toLowerCase())
    ) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] glass-card border-border/50">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Home className="w-5 h-5 text-primary" />
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="property_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Property (Compulsory)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-muted/30 h-12">
                                                <SelectValue placeholder="Search & Select Property" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="glass-card">
                                            <div className="flex items-center px-3 pb-2 border-b border-border/50">
                                                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search property ID or name..."
                                                    className="h-8 border-none bg-transparent focus-visible:ring-0 px-0"
                                                    value={propertySearch}
                                                    onChange={(e) => setPropertySearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-[200px] overflow-y-auto mt-1">
                                                {filteredProperties.length === 0 ? (
                                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                                        No properties found.
                                                    </div>
                                                ) : (
                                                    filteredProperties.map((prop) => (
                                                        <SelectItem key={prop.id} value={prop.id}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{prop.name}</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                                                    {prop.custom_id || prop.id.slice(0, 8)}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="unit_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={cn(isFieldsDisabled && "text-muted-foreground/50")}>
                                            Unit Name / Number
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. 101, A-1"
                                                {...field}
                                                disabled={isFieldsDisabled}
                                                className="bg-muted/30"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="room_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={cn(isFieldsDisabled && "text-muted-foreground/50")}>
                                            Room Type
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isFieldsDisabled}>
                                            <FormControl>
                                                <SelectTrigger className="bg-muted/30">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Single">Single</SelectItem>
                                                <SelectItem value="Double">Double</SelectItem>
                                                <SelectItem value="1BHK">1BHK</SelectItem>
                                                <SelectItem value="2BHK">2BHK</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="rent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Rent</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                {...field}
                                                disabled={isFieldsDisabled}
                                                className="bg-muted/30"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="availability"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Availability</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isFieldsDisabled}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-muted/30">
                                                        <SelectValue placeholder="Select availability" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass-card">
                                                    <SelectItem value="vacant">Vacant</SelectItem>
                                                    <SelectItem value="occupied">Occupied</SelectItem>
                                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isFieldsDisabled}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-muted/30">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass-card">
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isFieldsDisabled}
                                className="rounded-xl glow-primary"
                            >
                                Save Unit
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
