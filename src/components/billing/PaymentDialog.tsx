import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, DollarSign, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  payment_method: z.string().min(1, "Payment method is required"),
  payment_date: z.date({
    required_error: "Payment date is required",
  }),
  invoice_id: z.string().optional(),
  tenant_id: z.string().optional(),
  description: z.string().optional(),
  payment_type: z.string().optional(),
  paid_by: z.string().min(1, "Paid by name is required"),
  received_by: z.string().min(1, "Received by name is required"),
  payment_time: z.string().min(1, "Payment time is required"),
}).refine((data) => {
  // Add max amount validation dynamically
  return true; // Will be validated in the component
}, {
  message: "Payment amount cannot exceed invoice amount",
  path: ["amount"]
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PaymentFormData) => void;
  isLoading?: boolean;
  initialData?: any;
  invoice?: any;
  tenant?: any;
  onSuccess?: () => void;
}

export const PaymentDialog = ({ open, onOpenChange, initialData, onSubmit, isLoading, invoice, tenant, onSuccess }: PaymentDialogProps) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Calculate pending amount: Total Amount - Paid Amount = Pending Due
  const invoiceAmount = invoice?.amount || 0;
  const paidAmount = invoice?.paidAmount || 0; // This would come from payments data
  const pendingAmount = Math.max(0, invoiceAmount - paidAmount);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      payment_method: initialData?.payment_method || "",
      invoice_id: invoice?.id || initialData?.invoice_id || "",
      tenant_id: tenant?.id || invoice?.tenant_id || initialData?.tenant_id || "",
      description: initialData?.description || "",
      payment_type: initialData?.payment_type || "Rent",
      payment_date: initialData?.payment_date ? new Date(initialData.payment_date) : new Date(),
      paid_by: initialData?.paid_by || "",
      received_by: initialData?.received_by || "",
      payment_time: initialData?.payment_time || new Date().toTimeString().slice(0, 5),
    },
  });

  const watchedAmount = form.watch("amount");

  // Validate amount doesn't exceed pending amount
  useEffect(() => {
    if (watchedAmount > pendingAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Payment amount cannot exceed pending amount of ${formatAmount(pendingAmount)}`
      });
    } else {
      form.clearErrors("amount");
    }
  }, [watchedAmount, pendingAmount, form]);

  const handleSubmit = (data: PaymentFormData) => {
    if (data.amount > pendingAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Payment amount cannot exceed pending amount of ${formatAmount(pendingAmount)}`
      });
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...data,
        payment_date: data.payment_date.toISOString().split('T')[0] as any,
        paid_by: data.paid_by || 'Unknown',
        received_by: data.received_by || 'Unknown',
        payment_time: data.payment_time || new Date().toTimeString().slice(0, 5),
      } as any);
    } else {
      // Default behavior if onSubmit not provided
      console.log('Payment data:', {
        ...data,
        payment_date: data.payment_date.toISOString().split('T')[0],
        paid_by: data.paid_by || 'Unknown',
        received_by: data.received_by || 'Unknown',
        payment_time: data.payment_time || new Date().toTimeString().slice(0, 5),
      });
      onSuccess?.();
    }
    form.reset();
    onOpenChange(false);
  };

  const paymentMethods = [
    "Credit Card",
    "Debit Card",
    "Bank Transfer",
    "Cash",
    "Check",
    "Online Payment",
    "Other"
  ];

  const paymentTypes = [
    "Rent",
    "Utilities",
    "Maintenance",
    "Late Fee",
    "Security Deposit",
    "Other"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto border-0 shadow-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 rounded-t-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Record Payment</h2>
                <p className="text-blue-100 text-sm font-medium">Invoice {invoice?.invoice_number}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20 hover:text-white border-white/20 transition-all duration-200"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="p-8 space-y-8">

        {/* Invoice Summary Card */}
        {invoice && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-4 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">Payment Information</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Tenant Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tenant Details</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">🏠</span>
                        Property
                      </span>
                      <span className="text-sm font-bold text-gray-900 text-right">{tenant?.property_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">🚪</span>
                        Room No
                      </span>
                      <span className="text-sm font-bold text-gray-900 text-right">{tenant?.room_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">👤</span>
                        Tenant Name
                      </span>
                      <span className="text-sm font-bold text-gray-900 text-right">{tenant?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">📱</span>
                        Mobile
                      </span>
                      <span className="text-sm font-bold text-gray-900 text-right">{tenant?.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">✉️</span>
                        Email
                      </span>
                      <span className="text-sm font-bold text-gray-900 text-right">{tenant?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">📅</span>
                        Join Date
                      </span>
                      <span className="text-sm font-bold text-gray-900 text-right">{tenant?.join_date ? new Date(tenant.join_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">💳</span>
                        Payment Type
                      </span>
                      <span className="text-sm font-bold text-gray-900 text-right">{invoice?.payment_type || 'Rent'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">📋</span>
                        Bill Item
                      </span>
                      <span className="text-sm font-bold text-gray-900 text-right">{invoice?.bill_item_name || 'Monthly Rent'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Invoice Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Invoice Details</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-blue-600 font-bold text-sm">#</span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium mb-1">Invoice Number</span>
                      <span className="text-sm font-bold text-blue-700">{invoice.invoice_number}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-green-600 font-bold text-sm">₹</span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium mb-1">Total Amount</span>
                      <span className="text-sm font-bold text-blue-600">{formatAmount(invoiceAmount)}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-emerald-600 font-bold text-sm">✓</span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium mb-1">Paid Amount</span>
                      <span className="text-sm font-bold text-green-600">{formatAmount(paidAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pending Amount */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">₹</span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-orange-700">Pending Amount</span>
                      <div className="text-xs text-orange-600">Due for payment</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-md px-4 py-2 text-sm font-bold">
                    {formatAmount(pendingAmount)}
                  </Badge>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-gray-700">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    {Math.round((paidAmount / invoiceAmount) * 100)}% Paid
                  </span>
                  <span className="flex items-center gap-2 text-gray-700">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    {Math.round((pendingAmount / invoiceAmount) * 100)}% Pending
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2 shadow-sm"
                    style={{ width: `${((paidAmount / invoiceAmount) * 100)}%` }}
                  >
                    {((paidAmount / invoiceAmount) * 100) > 10 && (
                      <span className="text-xs text-white font-bold">
                        {Math.round((paidAmount / invoiceAmount) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">Payment Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md">
                          Max: {formatAmount(pendingAmount)}
                        </div>
                      </div>
                      <div className="flex">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d.]/g, '');
                            const numericValue = parseFloat(value) || 0;
                            field.onChange(numericValue);
                          }}
                          className={`pl-32 pr-20 h-12 bg-white border-gray-300 rounded-l-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm text-black placeholder:text-gray-400 ${watchedAmount > pendingAmount ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-r-none border-l-0 h-12 px-3 bg-white hover:bg-blue-50 border-gray-300 hover:border-blue-400 transition-all duration-200 group"
                            >
                              <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 bg-white border-gray-200 rounded-xl shadow-lg">
                            <DropdownMenuItem 
                              onClick={() => field.onChange(pendingAmount)}
                              className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer transition-colors duration-150 py-3"
                            >
                              <div className="flex flex-col py-1">
                                <span className="font-medium text-gray-900">Full Payment</span>
                                <span className="text-sm text-blue-600 font-semibold">{formatAmount(pendingAmount)}</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => field.onChange(pendingAmount * 0.75)}
                              className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer transition-colors duration-150 py-3"
                            >
                              <div className="flex flex-col py-1">
                                <span className="font-medium text-gray-900">75% Amount</span>
                                <span className="text-sm text-blue-600 font-semibold">{formatAmount(pendingAmount * 0.75)}</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => field.onChange(pendingAmount * 0.5)}
                              className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer transition-colors duration-150 py-3"
                            >
                              <div className="flex flex-col py-1">
                                <span className="font-medium text-gray-900">50% Amount</span>
                                <span className="text-sm text-blue-600 font-semibold">{formatAmount(pendingAmount * 0.5)}</span>
                              </div>
                            </DropdownMenuItem>
                          
                           <DropdownMenuItem 
                              onClick={() => field.onChange(0)}
                              className="hover:bg-red-50 focus:bg-red-100 cursor-pointer border-t border-gray-200 transition-colors duration-150 py-3"
                            >
                              <div className="flex flex-col py-1">
                                <span className="font-medium text-red-600">Clear</span>
                                <span className="text-sm text-red-500">Set to ₹0</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                  {watchedAmount > pendingAmount && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-red-700">⚠️ Payment Limit Exceeded</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-red-600">
                              💰 Entered amount: <span className="font-bold text-red-700">{formatAmount(watchedAmount)}</span>
                            </p>
                            <p className="text-sm font-medium text-red-600">
                              📊 Maximum allowed: <span className="font-bold text-green-600">{formatAmount(pendingAmount)}</span>
                            </p>
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              💡 <span>Please reduce the amount or select "Full Payment" to pay the complete pending amount.</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white border-gray-300 rounded-xl hover:border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200 shadow-sm group">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-gray-200 rounded-xl shadow-lg">
                      {paymentMethods.map((method) => (
                        <SelectItem 
                          key={method} 
                          value={method}
                          className="hover:bg-yellow-50 focus:bg-yellow-100 cursor-pointer transition-colors duration-150 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors duration-200">
                              {method === "Credit Card" && <span className="text-yellow-600">💳</span>}
                              {method === "Debit Card" && <span className="text-yellow-600">💳</span>}
                              {method === "Bank Transfer" && <span className="text-yellow-600">🏦</span>}
                              {method === "Cash" && <span className="text-yellow-600">💵</span>}
                              {method === "Check" && <span className="text-yellow-600">📝</span>}
                              {method === "Online Payment" && <span className="text-yellow-600">🌐</span>}
                              {method === "Other" && <span className="text-yellow-600">📋</span>}
                            </div>
                            <span className="font-medium text-gray-900">{method}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-semibold text-gray-700">Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-12 pl-4 text-left font-normal bg-white border-gray-300 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm",
                            !field.value && "text-gray-500"
                          )}
                        >
                          {field.value ? (
                            <div className="flex items-center gap-3">
                              <span className="text-blue-600">📅</span>
                              <span className="font-medium text-gray-900">{format(field.value, "PPP")}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400">📅</span>
                              <span>Pick a date</span>
                            </div>
                          )}
                          <CalendarIcon className="ml-auto h-5 w-5 text-gray-400" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-gray-200 rounded-xl shadow-lg" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter payment description..."
                      {...field}
                      className="min-h-[120px] bg-white border-gray-300 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm resize-none text-black placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paid_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">Paid By</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter payer name..."
                      {...field}
                      className="h-12 bg-white border-gray-300 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm text-black placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="received_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">Received By</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter receiver name..."
                      {...field}
                      className="h-12 bg-white border-gray-300 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm text-black placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">Payment Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      className="h-12 bg-white border-gray-300 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm text-black"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || watchedAmount > pendingAmount || watchedAmount <= 0}>
                {isLoading ? "Recording..." : `Record Payment ${formatAmount(watchedAmount)}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
