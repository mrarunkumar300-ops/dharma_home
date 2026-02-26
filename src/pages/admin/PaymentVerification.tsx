import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, CheckCircle, XCircle, Clock, AlertCircle, Loader2, RefreshCw, User, FileText, Home, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useCurrency } from '@/hooks/useCurrency';

interface PendingPayment {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone?: string;
  tenant_code: string;
  property_name?: string;
  unit_number?: string;
  bill_ids: string[];
  bill_details: BillDetail[];
  amount: number;
  payment_reference: string;
  status: string;
  payment_screenshot_url: string;
  verification_notes: string;
  created_at: string;
  expires_at: string;
  time_ago: string;
}

interface BillDetail {
  id: string;
  bill_type: string;
  bill_number?: string;
  amount: number;
  due_date: string;
  bill_period_start: string;
  bill_period_end: string;
  status: string;
}

export default function PaymentVerification() {
  const { formatAmount } = useCurrency();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingPayments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the original function for now, then we'll enhance it
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qr-payment-verification`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch pending payments');
      }

      // Transform the data to match our enhanced interface
      const transformedPayments = (result.data || []).map((payment: any) => ({
        ...payment,
        tenant_phone: payment.tenant_phone || null,
        tenant_code: payment.tenant_code || 'N/A',
        property_name: payment.property_name || null,
        unit_number: payment.unit_number || null,
        bill_details: payment.bill_details || []
      }));

      setPendingPayments(transformedPayments as PendingPayment[]);
    } catch (error: any) {
      console.error('Failed to fetch pending payments:', error);
      toast.error(error.message || 'Failed to load pending payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const verifyPayment = async (paymentId: string, status: 'approved' | 'rejected') => {
    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qr-payment-verification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_id: paymentId,
            status,
            admin_notes: adminNotes || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify payment');
      }

      toast.success(`Payment ${status} successfully!`);
      
      // Refresh pending payments
      await fetchPendingPayments();
      
      // Close dialog and reset state
      setSelectedPayment(null);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Verification failed:', error);
      toast.error(error.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case 'paid':
        return (
          <Badge className="gap-1 bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Paid
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="gap-1 text-orange-600">
            <AlertCircle className="w-3 h-3" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingPayments();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payment Verification</h1>
            <p className="text-muted-foreground">Review and verify QR code payments</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {pendingPayments.length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount Pending</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Screenshots</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pendingPayments.filter(p => p.payment_screenshot_url).length}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No pending payments</p>
                <p className="text-sm text-muted-foreground">All caught up! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-lg">
                            {formatAmount(payment.amount)}
                          </span>
                          {getStatusBadge(payment.status)}
                          {payment.payment_screenshot_url && (
                            <Badge variant="secondary" className="gap-1">
                              <Eye className="w-3 h-3" />
                              Screenshot
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Reference</p>
                            <p className="font-mono">{payment.payment_reference}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tenant</p>
                            <p className="font-medium">{payment.tenant_name}</p>
                            <p className="text-xs text-muted-foreground">{payment.tenant_email}</p>
                            {payment.tenant_phone && (
                              <p className="text-xs text-muted-foreground">{payment.tenant_phone}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-muted-foreground">Property/Unit</p>
                            <p className="font-medium">
                              {payment.property_name || 'Not assigned'}
                              {payment.unit_number && ` - ${payment.unit_number}`}
                            </p>
                            <p className="text-xs text-muted-foreground">Code: {payment.tenant_code}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p className="font-medium">{payment.time_ago}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payment.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>

                        {payment.verification_notes && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Tenant Notes:</p>
                            <p className="text-sm">{payment.verification_notes}</p>
                          </div>
                        )}
                        
                        {/* Bill Details Summary */}
                        {payment.bill_details && payment.bill_details.length > 0 && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Bills being paid ({payment.bill_details.length}):</p>
                            <div className="space-y-1">
                              {payment.bill_details.slice(0, 3).map((bill, index) => (
                                <div key={bill.id} className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {bill.bill_type.charAt(0).toUpperCase() + bill.bill_type.slice(1)}
                                    {bill.bill_number && ` (${bill.bill_number})`}
                                  </span>
                                  <span className="font-medium">{formatAmount(bill.amount)}</span>
                                </div>
                              ))}
                              {payment.bill_details.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{payment.bill_details.length - 3} more bills
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                        className="ml-4"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Modal */}
        {selectedPayment && (
          <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Payment Verification Details</DialogTitle>
                <DialogDescription>
                  Review payment details and verify the transaction
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Payment Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-lg">{formatAmount(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-mono text-sm">{selectedPayment.payment_reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenant</p>
                    <p className="font-medium">{selectedPayment.tenant_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedPayment.tenant_email}</p>
                    {selectedPayment.tenant_phone && (
                      <p className="text-xs text-muted-foreground">{selectedPayment.tenant_phone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">{selectedPayment.time_ago}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedPayment.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Tenant & Property Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Tenant Information
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tenant Code:</span>
                        <span className="font-medium">{selectedPayment.tenant_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{selectedPayment.tenant_email}</span>
                      </div>
                      {selectedPayment.tenant_phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{selectedPayment.tenant_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Property Details
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Property:</span>
                        <span className="font-medium">{selectedPayment.property_name || 'Not assigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit:</span>
                        <span className="font-medium">{selectedPayment.unit_number || 'Not assigned'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Screenshot */}
                {selectedPayment.payment_screenshot_url ? (
                  <div>
                    <p className="text-sm font-medium mb-2">Payment Screenshot</p>
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={selectedPayment.payment_screenshot_url} 
                        alt="Payment screenshot"
                        className="max-w-full h-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No screenshot uploaded</p>
                    <p className="text-sm text-muted-foreground">Tenant has not uploaded payment proof yet</p>
                  </div>
                )}

                {/* Bill Details */}
                {selectedPayment.bill_details && selectedPayment.bill_details.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Bill Details ({selectedPayment.bill_details.length} bills)
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedPayment.bill_details.map((bill) => (
                        <div key={bill.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {bill.bill_type.charAt(0).toUpperCase() + bill.bill_type.slice(1)}
                              </span>
                              {bill.bill_number && (
                                <span className="text-sm text-muted-foreground">({bill.bill_number})</span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatAmount(bill.amount)}</p>
                              <Badge 
                                variant={bill.status === 'paid' ? 'default' : bill.status === 'overdue' ? 'destructive' : 'outline'}
                                className="text-xs"
                              >
                                {bill.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Period: {format(new Date(bill.bill_period_start), 'MMM d')} - {format(new Date(bill.bill_period_end), 'MMM d, yyyy')}</span>
                            </div>
                            <div>
                              Due: {format(new Date(bill.due_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tenant Notes */}
                {selectedPayment.verification_notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Tenant Notes</p>
                    <div className="bg-muted p-3 rounded text-sm">
                      {selectedPayment.verification_notes}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <p className="text-sm font-medium mb-2">Admin Notes (Optional)</p>
                  <Textarea
                    placeholder="Add any notes about this verification..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Verification Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPayment(null)}
                  >
                    Close
                  </Button>
                  <div className="flex-1 flex justify-end gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => verifyPayment(selectedPayment.id, 'rejected')}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      onClick={() => verifyPayment(selectedPayment.id, 'approved')}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
