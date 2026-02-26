import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, User, Home, Phone, Mail, FileText, Download, Printer, ArrowLeft, X, Zap, Droplets } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface BillItem {
  type: 'rent' | 'electricity' | 'water' | 'other';
  description: string;
  amount: number;
  units?: number;
  rate?: number;
  startReading?: number;
  endReading?: number;
  unitsDividerRoom?: number;
}

interface LandlordInfo {
  name: string;
  phone: string;
  address: string;
}

interface TenantInfo {
  name: string;
  mobile: string;
  roomNo: string;
  email?: string;
}

interface RentInvoiceProps {
  apartmentName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  landlord: LandlordInfo;
  tenant: TenantInfo;
  billItems: BillItem[];
  onBackToEdit?: () => void;
  onDone?: () => void;
  isLoading?: boolean;
  showCloseButton?: boolean;
  footerMessage?: string;
  hideExportButtons?: boolean;
}

export function RentInvoice({
  apartmentName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  landlord,
  tenant,
  billItems,
  onBackToEdit,
  onDone,
  isLoading = false,
  showCloseButton = false,
  footerMessage = "Thank you for your payment. Please pay before the due date to avoid late fees. For queries, contact: +91 98765 43210",
  hideExportButtons = false,
}: RentInvoiceProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const subtotal = billItems.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = subtotal;

  const handlePrint = () => {
    // Create a temporary container with only the invoice content for printing
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.padding = '20px';
    tempContainer.style.maxWidth = '800px';
    tempContainer.style.margin = '0 auto';
    tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    // Clone the invoice content without header and buttons
    const invoiceContent = document.getElementById('rent-invoice-content')?.cloneNode(true) as HTMLElement;
    if (!invoiceContent) return;
    
    // Remove header and buttons from cloned content
    const header = invoiceContent.querySelector('.sticky');
    if (header) header.remove();
    
    // Apply the main container styling to the cloned content
    invoiceContent.style.background = '#ffffff';
    invoiceContent.style.border = '3px solid #e5e7eb';
    invoiceContent.style.borderRadius = '16px';
    invoiceContent.style.padding = '40px';
    invoiceContent.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    invoiceContent.style.maxWidth = '800px';
    invoiceContent.style.margin = '0 auto';
    invoiceContent.style.width = '100%';
    
    tempContainer.appendChild(invoiceContent);
    document.body.appendChild(tempContainer);
    
    // Create a new window for printing with exact template styling
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      document.body.removeChild(tempContainer);
      return;
    }
    
    // Write the clean invoice content to the new window with template styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rent Invoice - ${invoiceNumber}</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #ffffff;
              color: #1f2937;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            
            /* Main invoice container styling - PRESERVED FOR PRINT */
            #rent-invoice-content {
              background: #ffffff !important;
              border: 3px solid #e5e7eb !important;
              border-radius: 16px !important;
              padding: 40px !important;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              width: 100% !important;
            }
            
            .glass-card {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 32px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .text-2xl {
              font-size: 24px;
              font-weight: 700;
              text-align: center;
            }
            
            .text-lg {
              font-size: 18px;
              font-weight: 600;
            }
            
            .text-sm {
              font-size: 14px;
            }
            
            .text-xs {
              font-size: 12px;
            }
            
            .font-bold {
              font-weight: 700;
            }
            
            .font-semibold {
              font-weight: 600;
            }
            
            .text-primary {
              color: #8b5cf6;
            }
            
            .text-muted-foreground {
              color: #6b7280;
            }
            
            .text-foreground {
              color: #1f2937;
            }
            
            .text-success {
              color: #10b981;
            }
            
            .bg-muted\\/30 {
              background-color: #f3f4f6;
            }
            
            .border-border\\/50 {
              border-color: #e5e7eb;
            }
            
            .rounded {
              border-radius: 6px;
            }
            
            .p-2 {
              padding: 8px;
            }
            
            .p-4 {
              padding: 16px;
            }
            
            .p-6 {
              padding: 24px;
            }
            
            .mb-2 {
              margin-bottom: 8px;
            }
            
            .mb-3 {
              margin-bottom: 12px;
            }
            
            .mb-4 {
              margin-bottom: 16px;
            }
            
            .mb-6 {
              margin-bottom: 24px;
            }
            
            .mt-2 {
              margin-top: 8px;
            }
            
            .mt-3 {
              margin-top: 12px;
            }
            
            .mt-4 {
              margin-top: 16px;
            }
            
            .mt-6 {
              margin-top: 24px;
            }
            
            .space-y-1 > * + * {
              margin-top: 4px;
            }
            
            .space-y-2 > * + * {
              margin-top: 8px;
            }
            
            .space-y-3 > * + * {
              margin-top: 12px;
            }
            
            .space-y-4 > * + * {
              margin-top: 16px;
            }
            
            .flex {
              display: flex;
            }
            
            .justify-between {
              justify-content: space-between;
            }
            
            .items-center {
              align-items: center;
            }
            
            .items-start {
              align-items: flex-start;
            }
            
            .gap-2 {
              gap: 8px;
            }
            
            .gap-3 {
              gap: 12px;
            }
            
            .gap-4 {
              gap: 16px;
            }
            
            .grid {
              display: grid;
            }
            
            .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            
            .grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            
            .grid-cols-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
            
            .border-b {
              border-bottom: 1px solid #e5e7eb;
            }
            
            .w-full {
              width: 100%;
            }
            
            .text-right {
              text-align: right;
            }
            
            .text-left {
              text-align: left;
            }
            
            .capitalize {
              text-transform: capitalize;
            }
            
            /* Invoice specific alignment fixes */
            .invoice-header {
              text-align: center;
              margin-bottom: 32px;
            }
            
            .invoice-info {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 32px;
              gap: 32px;
            }
            
            .info-column {
              flex: 1;
              min-width: 0;
            }
            
            .info-section {
              margin-bottom: 0;
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background-color: #ffffff;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              transition: all 0.2s ease-in-out;
            }
            
            .info-section:hover {
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              transform: translateY(-2px);
            }
            
            .info-title {
              font-weight: 700;
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 2px solid #e5e7eb;
              text-align: center;
              letter-spacing: 0.5px;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 12px;
              align-items: flex-start;
            }
            
            .info-row:last-child {
              margin-bottom: 0;
            }
            
            .info-label {
              font-weight: 600;
              color: #374151;
              min-width: 90px;
              margin-right: 16px;
              flex-shrink: 0;
              font-size: 14px;
            }
            
            .info-value {
              color: #6b7280;
              line-height: 1.6;
              flex: 1;
              word-wrap: break-word;
              font-size: 14px;
            }
            
            .bill-items-container {
              margin: 32px 0;
              clear: both;
            }
            
            .bill-item {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 16px 0;
              border-bottom: 1px solid #e5e7eb;
              width: 100%;
            }
            
            .bill-item:last-child {
              border-bottom: none;
            }
            
            .bill-item-left {
              flex: 1;
              margin-right: 20px;
              min-width: 0;
            }
            
            .bill-item-right {
              text-align: right;
              min-width: 150px;
              flex-shrink: 0;
            }
            
            .bill-item-title {
              font-weight: 600;
              margin-bottom: 6px;
              font-size: 16px;
              line-height: 1.4;
            }
            
            .bill-item-details {
              font-size: 12px;
              color: #6b7280;
              line-height: 1.5;
              margin-top: 4px;
            }
            
            .bill-item-amount {
              font-weight: 700;
              font-size: 20px;
              color: #8b5cf6;
              line-height: 1.2;
            }
            
            .summary-section {
              margin-top: 32px;
              padding-top: 32px;
              border-top: 1px solid #e5e7eb;
              clear: both;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            
            .summary-row.total {
              font-weight: 700;
              font-size: 18px;
              color: #8b5cf6;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
            }
            
            .calculation-box {
              background-color: #f3f4f6;
              padding: 8px;
              border-radius: 6px;
              font-size: 12px;
              margin-top: 4px;
              line-height: 1.4;
            }
            
            @media print {
              body {
                padding: 10px !important;
                font-size: 12px !important;
                background: white !important;
              }
              
              #rent-invoice-content {
                border: 2px solid #d1d5db !important;
                padding: 30px !important;
                box-shadow: none !important;
                margin: 0 auto !important;
                max-width: 100% !important;
                width: 100% !important;
              }
              
              .glass-card {
                padding: 20px !important;
                box-shadow: none !important;
                border: 1px solid #d1d5db !important;
                border-radius: 12px !important;
              }
              
              .info-section {
                border: 1px solid #d1d5db !important;
                box-shadow: none !important;
                padding: 15px !important;
                margin-bottom: 0 !important;
              }
              
              .info-section:hover {
                box-shadow: none !important;
                transform: none !important;
              }
              
              .text-2xl {
                font-size: 20px !important;
              }
              
              .text-lg {
                font-size: 16px !important;
              }
              
              .text-sm {
                font-size: 11px !important;
              }
              
              .text-xs {
                font-size: 10px !important;
              }
              
              .invoice-info {
                flex-direction: column !important;
                gap: 20px !important;
              }
              
              .info-section {
                padding: 12px !important;
                margin-bottom: 16px !important;
              }
              
              .info-title {
                font-size: 14px !important;
                margin-bottom: 8px !important;
                padding-bottom: 6px !important;
              }
              
              .info-label {
                min-width: 70px !important;
                font-size: 10px !important;
              }
              
              .info-value {
                font-size: 10px !important;
              }
              
              .bill-item {
                flex-direction: row !important;
                padding: 12px 0 !important;
              }
              
              .bill-item-left {
                margin-right: 15px !important;
                margin-bottom: 0 !important;
                flex: 1 !important;
                min-width: 0 !important;
              }
              
              .bill-item-right {
                text-align: right !important;
                min-width: 100px !important;
                flex-shrink: 0 !important;
              }
              
              .bill-item-title {
                font-size: 14px !important;
                margin-bottom: 4px !important;
              }
              
              .bill-item-details {
                font-size: 10px !important;
                margin-top: 2px !important;
              }
              
              .bill-item-amount {
                font-size: 16px !important;
              }
            }
          </style>
        </head>
        <body>
          ${tempContainer.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      document.body.removeChild(tempContainer);
    }, 500);
  };

  const handleDownload = async () => {
    try {
      toast.loading('Generating PDF...');
      
      // Create a temporary container with only the invoice content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '20px';
      tempContainer.style.width = '210mm';
      
      // Clone the invoice content without header and buttons
      const invoiceContent = document.getElementById('rent-invoice-content')?.cloneNode(true) as HTMLElement;
      if (!invoiceContent) {
        toast.dismiss();
        toast.error('Invoice content not found');
        return;
      }
      
      // Remove header and buttons from cloned content
      const header = invoiceContent.querySelector('.sticky');
      if (header) header.remove();
      
      tempContainer.appendChild(invoiceContent);
      document.body.appendChild(tempContainer);
      
      // Create canvas from the clean invoice content
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        windowWidth: 794,
        windowHeight: 1123
      });
      
      // Clean up temporary container
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create A4 PDF (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add image to PDF - full A4 size
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      // Save the PDF
      pdf.save(`rent-invoice-${invoiceNumber}.pdf`);
      
      toast.dismiss();
      toast.success('PDF downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const getBillIcon = (type: string) => {
    switch (type) {
      case 'rent': return <Home className="w-4 h-4" />;
      case 'electricity': return <Zap className="w-4 h-4" />;
      case 'water': return <Droplets className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      {!isPrinting && (onBackToEdit || onDone || showCloseButton) && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Rent Invoice Preview</h1>
              </div>
              <div className="flex gap-2">
                {/* PDF Download Button - Hide during creation */}
                {!hideExportButtons && (
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                )}
                
                {/* Print Button - Hide during creation */}
                {!hideExportButtons && (
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                )}
                
                {/* Close Button (for viewing) */}
                {showCloseButton && (
                  <Button variant="outline" className="bg-pink-500 hover:bg-pink-600 text-white border-pink-600" onClick={onDone || onBackToEdit}>
                    Close
                  </Button>
                )}
                
                {/* Back to Edit Button (only for creation) */}
                {onBackToEdit && !showCloseButton && (
                  <Button 
                    variant="outline" 
                    className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600" 
                    onClick={onBackToEdit}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Edit
                  </Button>
                )}
                
                {/* Done/Create Invoice Button */}
                {onDone && !showCloseButton && (
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white" 
                    onClick={() => {
                      console.log('Done button clicked');
                      onDone();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Invoice'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {!isPrinting && !onBackToEdit && !onDone && (
          <div className="max-w-4xl mx-auto mb-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        )}

        {/* Invoice Content */}
        <div id="rent-invoice-content" className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-0 bg-background">
            <CardContent className="p-8">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">RENT INVOICE</h2>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Invoice #: {invoiceNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Date: {format(invoiceDate, "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Due Date: {format(dueDate, "PPP")}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-foreground">{apartmentName}</h3>
                  <p className="text-sm text-muted-foreground">Property Management</p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Property and Tenant Information */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Landlord Information */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Property Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{landlord.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{landlord.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium">{landlord.address}</span>
                    </div>
                  </div>
                </div>

                {/* Tenant Information */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Tenant Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{tenant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{tenant.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room No:</span>
                      <span className="font-medium">{tenant.roomNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{tenant.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Billing Details */}
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-4">Billing Details</h4>
                <div className="space-y-3">
                  {billItems.map((item, index) => (
                    <div key={index} className="border border-border/50 rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getBillIcon(item.type)}
                          <span className="font-medium text-foreground capitalize">
                            {item.type === 'rent' ? 'Room Rent' : 
                             item.type === 'electricity' ? 'Electricity Charges' :
                             item.type === 'water' ? 'Water Charges' : 'Other Charges'}
                          </span>
                        </div>
                        <span className="font-bold text-lg text-primary">₹{item.amount.toFixed(2)}</span>
                      </div>
                      
                      {(item.type === 'electricity' || item.type === 'water') && (
                        <div className="text-xs text-muted-foreground space-y-1 mt-2">
                          {item.rate && <div>Rate: ₹{item.rate}/unit</div>}
                          {item.units && <div>Units: {item.units}</div>}
                          {item.startReading && item.endReading && (
                            <div>Reading: {item.startReading} → {item.endReading}</div>
                          )}
                          {item.type === 'water' && item.unitsDividerRoom && (
                            <div>Units Divider Room: {item.unitsDividerRoom}</div>
                          )}
                          {item.type === 'water' && item.startReading && item.endReading && item.unitsDividerRoom && (
                            <div className="font-medium text-foreground bg-muted/30 p-2 rounded">
                              ({item.endReading} - {item.startReading}) ÷ {item.unitsDividerRoom} = {item.units} units × ₹{item.rate}/unit = ₹{item.amount}
                            </div>
                          )}
                          {item.type === 'electricity' && item.units && item.rate && (
                            <div className="font-medium text-foreground bg-muted/30 p-2 rounded">
                              {item.units} units × ₹{item.rate}/unit = ₹{item.amount}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-bold text-lg">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="glass-card p-6 rounded-xl border border-border/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-foreground">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Message */}
              <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center border border-border/50">
                <p className="text-sm text-foreground whitespace-pre-line">
                  {footerMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
