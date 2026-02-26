import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, Clock, AlertCircle, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QRCodePaymentProps {
  amount: number;
  billIds: string[];
  onSuccess: (paymentReference: string) => void;
  onCancel: () => void;
}

export function QRCodePayment({ amount, billIds, onSuccess, onCancel }: QRCodePaymentProps) {
  const [paymentReference, setPaymentReference] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [isExpired, setIsExpired] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateQRPayment = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to continue');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qr-payment-generator`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            bill_ids: billIds,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate QR payment');
      }

      setPaymentReference(result.data.payment_reference);
      setQrCodeUrl(result.data.qr_code_url);
      setUpiId(result.data.upi_id);
      setBusinessName(result.data.business_name);
      setExpiresAt(new Date(result.data.expires_at));

      toast.success('QR code generated successfully!');
    } catch (error: any) {
      console.error('Failed to generate QR payment:', error);
      toast.error(error.message || 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPaymentReference = () => {
    navigator.clipboard.writeText(paymentReference);
    toast.success('Payment reference copied!');
  };

  const upiPaymentString = `upi://pay?pa=${upiId}&pn=${businessName}&am=${amount}&cu=INR&tn=${paymentReference}`;

  // Auto-generate QR code on component mount
  useEffect(() => {
    if (!paymentReference && !isGenerating) {
      generateQRPayment();
    }
  }, []);

  // Check if QR code has expired
  const checkIfExpired = () => expiresAt && new Date() > expiresAt;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="font-semibold flex items-center justify-center gap-2">
            <Smartphone className="w-5 h-5" />
            Scan QR Code to Pay
          </h3>
          <p className="text-sm text-muted-foreground">
            Pay ₹{amount.toFixed(2)} using any UPI app
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          {qrCodeUrl && !checkIfExpired() ? (
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
              <img 
                src={qrCodeUrl} 
                alt="QR Code for Payment" 
                className="w-48 h-48"
              />
            </div>
          ) : checkIfExpired() ? (
            <div className="text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
              <div>
                <p className="text-orange-600 font-medium">QR Code Expired</p>
                <p className="text-sm text-muted-foreground">Please generate a new QR code</p>
              </div>
              <Button onClick={generateQRPayment} disabled={isGenerating}>
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Generate New QR Code
              </Button>
            </div>
          ) : (
            <Button onClick={generateQRPayment} disabled={isGenerating}>
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </Button>
          )}
        </div>

        {paymentReference && !isExpired && (
          <>
            {/* Payment Details */}
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold text-lg">₹{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reference:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {paymentReference}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyPaymentReference}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires in:</span>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    <Countdown target={expiresAt!} onExpire={() => {}} />
                  </Badge>
                </div>
              </div>

              {/* UPI ID */}
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">UPI ID</p>
                    <p className="font-mono text-sm">{upiId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyUpiId}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-900 mb-2">How to pay:</p>
              <ol className="text-blue-800 space-y-1 text-xs">
                <li>1. Open any UPI app (GPay, PhonePe, Paytm)</li>
                <li>2. Scan the QR code above</li>
                <li>3. Verify payment details (₹{amount.toFixed(2)})</li>
                <li>4. Complete payment</li>
                <li>5. Take a screenshot of payment confirmation</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => onSuccess(paymentReference)} className="flex-1">
                I've Paid
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Countdown component
function Countdown({ target }: { target: Date }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{timeLeft}</span>;
}
