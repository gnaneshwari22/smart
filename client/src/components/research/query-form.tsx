import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ProcessingModal } from "./processing-modal";
import { ReportViewer } from "./report-viewer";
import { Sparkles } from "lucide-react";
import { researchQuerySchema, type ResearchQuery } from "@shared/schema";

export function QueryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProcessing, setShowProcessing] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const form = useForm<ResearchQuery>({
    resolver: zodResolver(researchQuerySchema),
    defaultValues: {
      question: "",
      sourceTypes: ["files", "web"],
      includeFiles: true,
      includeLiveData: true,
      includeAcademic: false,
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: ResearchQuery) => {
      const response = await apiRequest("POST", "/api/research/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShowProcessing(false);
      setGeneratedReport(data);
      form.reset();
      
      // Invalidate stats and reports queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      toast({
        title: "Report Generated Successfully",
        description: "Your research report is ready with verified citations.",
      });
    },
    onError: (error) => {
      setShowProcessing(false);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      toast({
        title: "Report Generation Failed",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResearchQuery) => {
    if (data.question.trim().length < 10) {
      toast({
        title: "Question Too Short",
        description: "Please provide a more detailed research question.",
        variant: "destructive",
      });
      return;
    }

    setShowProcessing(true);
    generateReportMutation.mutate(data);
  };

  return (
    <>
      <Card data-testid="card-research-query">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Ask a Research Question</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Research Question</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What are the latest trends in AI-powered productivity tools for 2024?"
                        className="min-h-[100px] resize-none"
                        data-testid="textarea-research-question"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="text-sm font-medium mb-3 block">Sources to Include</FormLabel>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="includeFiles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-include-files"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Uploaded Files
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeLiveData"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-include-live-data"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Live Web Data
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeAcademic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-include-academic"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Academic Papers
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={generateReportMutation.isPending}
                data-testid="button-generate-report"
              >
                {generateReportMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Report (1 Credit)
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ProcessingModal 
        isOpen={showProcessing} 
        onClose={() => setShowProcessing(false)}
      />

      {generatedReport && (
        <ReportViewer 
          report={generatedReport}
          isOpen={!!generatedReport}
          onClose={() => setGeneratedReport(null)}
        />
      )}
    </>
  );
}
