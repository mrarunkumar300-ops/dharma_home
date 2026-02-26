import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
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
import { Textarea } from "@/components/ui/textarea";
import { Property } from "@/hooks/useProperties";
import {
    Building2,
    MapPin,
    User,
    Phone,
    Mail,
    Type,
    Hash,
    FileText,
    ShieldCheck
} from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Property name is required"),
    custom_id: z.string().optional(),
    address: z.string().optional(),
    owner_name: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    status: z.string().default("active"),
    notes: z.string().optional(),
    image_emoji: z.string().default("🏢"),
});

interface PropertyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: z.infer<typeof formSchema>) => void;
    initialData?: Property;
    title: string;
}

export const PropertyDialog = ({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    title,
}: PropertyDialogProps) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            custom_id: "",
            address: "",
            owner_name: "",
            mobile: "",
            email: "",
            status: "active",
            notes: "",
            image_emoji: "🏢",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                custom_id: initialData.custom_id || "",
                address: initialData.address || "",
                owner_name: initialData.owner_name || "",
                mobile: initialData.mobile || "",
                email: initialData.email || "",
                status: initialData.status,
                notes: initialData.notes || "",
                image_emoji: initialData.image_emoji || "🏢",
            });
        } else {
            form.reset({
                name: "",
                custom_id: "",
                address: "",
                owner_name: "",
                mobile: "",
                email: "",
                status: "active",
                notes: "",
                image_emoji: "🏢",
            });
        }
    }, [initialData, form, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden glass-card border-border/50 shadow-2xl">
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="flex flex-col h-full"
                        >
                            <div className="p-6 pb-0">
                                <DialogHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl">
                                            {form.watch("image_emoji") || "🏢"}
                                        </div>
                                        <DialogTitle className="text-2xl font-bold tracking-tight">{title}</DialogTitle>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Fill in the details to {initialData ? "update" : "create"} your property record.</p>
                                </DialogHeader>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        <Type className="w-3.5 h-3.5 text-primary" /> Property Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Riverside Apartments" {...field} className="bg-muted/30 h-11 rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="custom_id"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        <Hash className="w-3.5 h-3.5 text-primary" /> Custom ID
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. PROP-001" {...field} className="bg-muted/30 h-11 rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    <MapPin className="w-3.5 h-3.5 text-primary" /> Full Address
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="123 Luxury Ave, Business District" {...field} className="bg-muted/30 h-11 rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-muted/20 border border-border/50">
                                        <FormField
                                            control={form.control}
                                            name="owner_name"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        <User className="w-3.5 h-3.5 text-primary" /> Owner Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="John Doe" {...field} className="bg-background/50 h-10 rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="mobile"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        <Phone className="w-3.5 h-3.5 text-primary" /> Mobile
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+1 234 567 890" {...field} className="bg-background/50 h-10 rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        <Mail className="w-3.5 h-3.5 text-primary" /> Email
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="owner@example.com" {...field} className="bg-background/50 h-10 rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Status
                                                    </FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-background/50 h-10 rounded-xl">
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

                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    <FileText className="w-3.5 h-3.5 text-primary" /> Internal Notes
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Additional details, gate codes, etc."
                                                        className="bg-muted/30 min-h-[80px] rounded-xl resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter className="pt-2 gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => onOpenChange(false)}
                                            className="rounded-xl h-11 flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="rounded-xl h-11 flex-1 glow-primary font-bold">
                                            {initialData ? "Update Property" : "Create Property"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};
