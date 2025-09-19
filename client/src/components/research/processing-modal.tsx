import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  CheckCircle, 
  Search,
  FileText,
  Lightbulb,
  Quote
} from "lucide-react";
import { useState, useEffect } from "react";

interface ProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed';
}

export function ProcessingModal({ isOpen, onClose }: ProcessingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'documents',
      label: 'Processing uploaded documents',
      icon: <FileText className="h-4 w-4" />,
      status: 'pending'
    },
    {
      id: 'search',
      label: 'Searching live data sources',
      icon: <Search className="h-4 w-4" />,
      status: 'pending'
    },
    {
      id: 'insights',
      label: 'Extracting key insights',
      icon: <Lightbulb className="h-4 w-4" />,
      status: 'pending'
    },
    {
      id: 'citations',
      label: 'Generating citations',
      icon: <Quote className="h-4 w-4" />,
      status: 'pending'
    }
  ]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setProgress(0);
      setCurrentStep(0);
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
      return;
    }

    // Simulate processing steps
    const stepDuration = 4000; // 4 seconds per step
    const progressInterval = 100; // Update every 100ms

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (stepDuration / progressInterval));
        
        // Update step status based on progress
        const stepProgress = newProgress / 25; // 4 steps, so each is 25%
        const currentStepIndex = Math.floor(stepProgress);
        
        if (currentStepIndex !== currentStep && currentStepIndex < steps.length) {
          setCurrentStep(currentStepIndex);
          
          setSteps(prevSteps => prevSteps.map((step, index) => {
            if (index < currentStepIndex) {
              return { ...step, status: 'completed' };
            } else if (index === currentStepIndex) {
              return { ...step, status: 'processing' };
            }
            return step;
          }));
        }
        
        return Math.min(100, newProgress);
      });
    }, progressInterval);

    return () => clearInterval(interval);
  }, [isOpen, currentStep, steps.length]);

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStepTextColor = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-foreground';
      case 'processing':
        return 'text-foreground font-medium';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md" 
        data-testid="dialog-processing"
        hideCloseButton
      >
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <DialogTitle data-testid="text-processing-title">
            Generating Your Report
          </DialogTitle>
          <DialogDescription>
            Our AI is analyzing your sources and generating insights...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className="flex items-center space-x-3"
                data-testid={`processing-step-${step.id}`}
              >
                {getStepIcon(step)}
                <span className={`text-sm transition-colors ${getStepTextColor(step)}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-2" 
              data-testid="progress-processing"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}% complete</span>
              <Badge variant="outline" className="text-xs">
                AI Processing
              </Badge>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Estimated time: {Math.max(1, Math.round((100 - progress) / 6))} seconds remaining
            </p>
          </div>

          {/* Tips */}
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground text-center">
              💡 <strong>Tip:</strong> The more specific your question, the better insights our AI can provide!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
