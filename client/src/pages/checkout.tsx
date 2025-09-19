import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Zap } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ credits }: { credits: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: `${credits} credits added to your account!`,
        });
        // Redirect to dashboard after successful payment
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-payment">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || processing}
        data-testid="button-complete-payment"
      >
        {processing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Complete Payment
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [credits, setCredits] = useState(100);
  const { toast } = useToast();

  // Calculate pricing
  const creditPlans = [
    { credits: 50, price: 5, popular: false },
    { credits: 100, price: 10, popular: true },
    { credits: 250, price: 22, popular: false },
    { credits: 500, price: 40, popular: false },
  ];

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    if (credits > 0) {
      apiRequest("POST", "/api/create-payment-intent", { credits })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            throw new Error("No client secret returned");
          }
        })
        .catch((error) => {
          toast({
            title: "Payment Setup Failed",
            description: error.message || "Unable to initialize payment. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [credits, toast]);

  const selectedPlan = creditPlans.find(plan => plan.credits === credits) || creditPlans[1];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold" data-testid="text-checkout-title">Purchase Research Credits</h1>
          <p className="text-muted-foreground">Choose a credit package to continue generating research reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Credit Plans */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" data-testid="text-select-plan">Select Credit Package</h2>
            
            {creditPlans.map((plan) => (
              <Card 
                key={plan.credits}
                className={`cursor-pointer transition-all ${
                  credits === plan.credits 
                    ? 'border-primary shadow-md' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setCredits(plan.credits)}
                data-testid={`plan-${plan.credits}-credits`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">{plan.credits} Credits</CardTitle>
                      </div>
                      {plan.popular && (
                        <Badge className="text-xs">Most Popular</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${plan.price}</div>
                      <div className="text-xs text-muted-foreground">
                        ${(plan.price / plan.credits).toFixed(2)} per credit
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    Generate {plan.credits} research reports with AI analysis, live data integration, and verified citations.
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Form */}
          <div>
            <Card data-testid="card-payment-form">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Complete your purchase to add credits to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Order Summary */}
                <div className="bg-secondary rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedPlan.credits} Research Credits
                    </span>
                    <span className="font-medium">${selectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">${selectedPlan.price}</span>
                  </div>
                </div>

                {clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm credits={credits} />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    <span className="ml-2 text-muted-foreground">Setting up payment...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Info */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>🔒 Secure payment powered by Stripe</p>
              <p>Credits are added to your account immediately after payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
