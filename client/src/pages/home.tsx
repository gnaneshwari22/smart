import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryForm } from "@/components/research/query-form";
import { FileUpload } from "@/components/research/file-upload";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Report, LiveDataSource } from "@shared/schema";
import { 
  FileText, 
  Coins, 
  FolderOpen, 
  Rss, 
  Download, 
  Share, 
  CheckCircle,
  Clock,
  Link,
  Quote,
  Plus
} from "lucide-react";

interface StatsResponse {
  totalReports: number;
  totalCreditsUsed: number;
  documentsUploaded: number;
  liveSources: number;
  credits: number;
}

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/analytics/stats"],
    enabled: isAuthenticated,
  });

  // Fetch recent reports
  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: isAuthenticated,
  });

  // Fetch live data sources
  const { data: liveSources } = useQuery<LiveDataSource[]>({
    queryKey: ["/api/live-data/sources"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-dashboard-title">Research Dashboard</h2>
              <p className="text-muted-foreground">Generate AI-powered research reports with citations</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-muted-foreground" data-testid="text-live-indicator">Live data active</span>
              </div>
              <Button data-testid="button-new-report">
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card data-testid="card-total-reports">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold" data-testid="text-total-reports">
                      {statsLoading ? '...' : stats?.totalReports || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-credits-used">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Credits Used</p>
                    <p className="text-2xl font-bold" data-testid="text-credits-used">
                      {statsLoading ? '...' : stats?.totalCreditsUsed || 0}
                    </p>
                  </div>
                  <Coins className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-documents">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                    <p className="text-2xl font-bold" data-testid="text-documents">
                      {statsLoading ? '...' : stats?.documentsUploaded || 0}
                    </p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-live-sources">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Live Sources</p>
                    <p className="text-2xl font-bold" data-testid="text-live-sources">
                      {stats?.liveSources || 4}
                    </p>
                  </div>
                  <Rss className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Action Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QueryForm />
            <FileUpload />
          </div>
          
          {/* Live Data Sources */}
          <Card data-testid="card-live-data-section">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Data Sources</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-accent">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span>Pathway Integration Active</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveSources?.map((source: any) => (
                  <div key={source.id} className="border border-border rounded-lg p-4" data-testid={`live-source-${source.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Rss className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">Live</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {source.type === 'news' ? 'Latest technology and AI news' : 'Financial and market trends'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last update: {source.lastUpdate ? new Date(source.lastUpdate).toLocaleTimeString() : '5 minutes ago'}
                    </p>
                  </div>
                )) || (
                  <>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Rss className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Tech News</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">Live</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Latest technology and AI news</p>
                      <p className="text-xs text-muted-foreground">Last update: 2 minutes ago</p>
                    </div>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Rss className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Market Data</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">Live</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Financial and market trends</p>
                      <p className="text-xs text-muted-foreground">Last update: 5 minutes ago</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Reports */}
          <Card data-testid="card-recent-reports">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Reports</CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-view-all-reports">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading reports...
                  </div>
                ) : reports && reports.length > 0 ? (
                  reports.map((report: any) => (
                    <div 
                      key={report.id} 
                      className="border border-border rounded-lg p-4 hover:bg-secondary/50 cursor-pointer"
                      data-testid={`report-${report.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{report.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {report.summary || 'Research report generated from multiple sources'}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                            <span>{Array.isArray(report.sources) ? report.sources.length : 0} sources</span>
                            <span>{Array.isArray(report.citations) ? report.citations.length : 0} citations</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="ghost" size="icon" data-testid={`button-download-${report.id}`}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" data-testid={`button-share-${report.id}`}>
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No reports generated yet</p>
                    <p className="text-sm">Start by asking a research question above</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Sample Report */}
          <Card data-testid="card-sample-report">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sample Report</CardTitle>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">Generated in 23s</span>
                  <Badge variant="secondary" className="text-xs">Fresh Data</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary mb-2">Executive Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The AI-powered productivity tools market is experiencing unprecedented growth in 2024, 
                  driven by widespread adoption of generative AI and increasing demand for automation solutions. 
                  Key findings indicate a 340% year-over-year growth in enterprise AI tool implementations.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary mb-2">Key Insights</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Enterprise adoption of AI writing tools increased by 450% in Q1 2024 <sup className="text-primary cursor-pointer">[1]</sup></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>OpenAI's ChatGPT Enterprise leads market share at 34% <sup className="text-primary cursor-pointer">[2]</sup></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Integration capabilities are the top factor in tool selection (89% of respondents) <sup className="text-primary cursor-pointer">[3]</sup></span>
                  </li>
                </ul>
              </div>
              
              {/* Citations */}
              <div>
                <h4 className="font-semibold text-primary mb-2">Sources & Citations</h4>
                <div className="space-y-2 text-xs bg-secondary rounded-lg p-3">
                  <div className="flex items-start space-x-2" data-testid="citation-1">
                    <span className="text-primary font-medium">[1]</span>
                    <div>
                      <a href="#" className="text-primary hover:underline">TechCrunch - "Enterprise AI Adoption Soars in 2024"</a>
                      <p className="text-muted-foreground">Published March 10, 2024 | Confidence: 94%</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2" data-testid="citation-2">
                    <span className="text-primary font-medium">[2]</span>
                    <div>
                      <a href="#" className="text-primary hover:underline">Gartner Research - "AI Tools Market Analysis Q1 2024"</a>
                      <p className="text-muted-foreground">Published March 8, 2024 | Confidence: 97%</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2" data-testid="citation-3">
                    <span className="text-primary font-medium">[3]</span>
                    <div>
                      <a href="#" className="text-primary hover:underline">McKinsey Survey - "AI Integration Priorities 2024"</a>
                      <p className="text-muted-foreground">Published March 5, 2024 | Confidence: 91%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span><Clock className="inline h-3 w-3 mr-1" /> 2 min read</span>
                  <span><Link className="inline h-3 w-3 mr-1" /> 8 sources</span>
                  <span><Quote className="inline h-3 w-3 mr-1" /> 23 citations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" data-testid="button-export-sample">
                    <Download className="mr-1 h-3 w-3" /> Export PDF
                  </Button>
                  <Button size="sm" data-testid="button-share-sample">
                    <Share className="mr-1 h-3 w-3" /> Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
