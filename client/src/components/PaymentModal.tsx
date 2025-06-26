import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Loader2, CheckCircle } from "lucide-react";

const paymentFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credits: number) => void;
}

interface PaystackResponse {
  status: boolean;
  reference: string;
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("POST", "/api/initialize-payment", {
        email: data.email,
        amount: 100, // $1 in cents
      });
      return await response.json();
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      const response = await apiRequest("POST", "/api/verify-payment", {
        reference,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Payment Successful!",
          description: `You've received ${data.creditsAdded} additional downloads.`,
        });
        onSuccess(data.creditsAdded);
        onClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Please contact support if you were charged.",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = (response: PaystackResponse) => {
    if (response.status) {
      verifyPaymentMutation.mutate(response.reference);
    }
  };

  const handlePaymentClose = () => {
    setIsProcessing(false);
    toast({
      title: "Payment Cancelled",
      description: "Your payment was cancelled. No charges were made.",
      variant: "destructive",
    });
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsProcessing(true);
      const result = await initializePaymentMutation.mutateAsync(data);
      
      if (result.success && result.data) {
        // Load Paystack script dynamically
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => {
          const handler = (window as any).PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: data.email,
            amount: 100, // $1 in kobo (cents)
            currency: 'USD',
            ref: result.data.reference,
            callback: handlePaymentSuccess,
            onClose: handlePaymentClose,
          });
          handler.openIframe();
        };
        document.head.appendChild(script);
      } else {
        throw new Error("Failed to initialize payment");
      }
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Buy More Downloads</span>
          </DialogTitle>
          <DialogDescription>
            Get 10 additional book cover downloads for just $1. Your payment is processed securely through Paystack.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Download Package</h3>
                <p className="text-sm text-gray-600">10 additional downloads</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">$1</div>
                <div className="text-xs text-gray-500">USD</div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your email address" 
                        type="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isProcessing || verifyPaymentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isProcessing || initializePaymentMutation.isPending || verifyPaymentMutation.isPending}
                >
                  {isProcessing || initializePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : verifyPaymentMutation.isPending ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay $1
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-xs text-gray-500 text-center">
            Secured by Paystack. Your payment information is encrypted and secure.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}