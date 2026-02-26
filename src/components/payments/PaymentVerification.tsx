import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentVerificationProps {
  paymentReference: string;
  onSubmit: (data: { screenshot: File; notes: string }) => void;
  onCancel?: () => void;
}

export function PaymentVerification({ paymentReference, onSubmit, onCancel }: PaymentVerificationProps) {
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      toast.error('Please upload a payment screenshot');
      return;
    }

    setUploading(true);
    try {
      // Upload screenshot to Supabase storage
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `payment-${paymentReference}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      // Update payment record with screenshot URL
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qr-payment-verification`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_reference: paymentReference,
            screenshot_url: publicUrl,
            verification_notes: notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload screenshot');
      }

      toast.success('Payment screenshot uploaded successfully!');
      onSubmit({ screenshot, notes });

    } catch (error: any) {
      console.error('Screenshot upload failed:', error);
      toast.error(error.message || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Payment Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Upload payment confirmation screenshot
          </p>
          
          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            {preview ? (
              <div className="space-y-3">
                <img 
                  src={preview} 
                  alt="Payment screenshot" 
                  className="max-w-full h-auto rounded border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeScreenshot}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <label htmlFor="screenshot" className="cursor-pointer">
                  <span className="text-sm text-blue-600 hover:underline">
                    Click to upload screenshot
                  </span>
                  <input
                    ref={fileInputRef}
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Additional Notes (Optional)</label>
          <Textarea
            placeholder="Any additional information about the payment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="bg-green-50 p-4 rounded-lg text-sm">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Next steps:</span>
          </div>
          <ol className="text-green-700 space-y-1 text-xs">
            <li>1. Submit your payment screenshot</li>
            <li>2. Admin will verify within 24 hours</li>
            <li>3. You'll receive confirmation once verified</li>
            <li>4. Your bills will be marked as paid</li>
          </ol>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-blue-800 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Payment Reference:</span>
          </div>
          <p className="font-mono text-blue-700">{paymentReference}</p>
        </div>

        <div className="flex gap-2 pt-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={!screenshot || uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Submit for Verification'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
