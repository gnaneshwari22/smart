import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Share2, 
  ExternalLink, 
  CheckCircle, 
  Clock,
  Link as LinkIcon,
  Quote,
  FileText,
  Globe,
  BookOpen
} from "lucide-react";

interface ReportSource {
  title: string;
  url: string;
  type: 'file' | 'web' | 'academic';
  confidence: number;
  publishedDate?: string;
}

interface ReportCitation {
  id: string;
  source: ReportSource;
  relevance: number;
  excerpt: string;
}

interface ReportData {
  reportId: string;
  report: {
    title: string;
    executiveSummary: string;
    keyInsights: string[];
    sources: ReportSource[];
    citations: ReportCitation[];
    processingTimeMs: number;
    sourceBreakdown: {
      files: number;
      web: number;
      live: number;
    };
  };
}

interface ReportViewerProps {
  report: ReportData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportViewer({ report, isOpen, onClose }: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'sources'>('report');

  if (!report) return null;

  const { report: reportData } = report;

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="h-3 w-3" />;
      case 'web':
        return <Globe className="h-3 w-3" />;
      case 'academic':
        return <BookOpen className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'file':
        return 'text-blue-500';
      case 'web':
        return 'text-green-500';
      case 'academic':
        return 'text-purple-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleExport = () => {
    // Create a formatted text version of the report
    let exportText = `# ${reportData.title}\n\n`;
    exportText += `## Executive Summary\n${reportData.executiveSummary}\n\n`;
    
    if (reportData.keyInsights.length > 0) {
      exportText += `## Key Insights\n`;
      reportData.keyInsights.forEach((insight, index) => {
        exportText += `${index + 1}. ${insight}\n`;
      });
      exportText += '\n';
    }
    
    if (reportData.citations.length > 0) {
      exportText += `## Sources & Citations\n`;
      reportData.citations.forEach((citation, index) => {
        exportText += `[${index + 1}] ${citation.source.title}\n`;
        exportText += `URL: ${citation.source.url}\n`;
        if (citation.source.publishedDate) {
          exportText += `Published: ${new Date(citation.source.publishedDate).toLocaleDateString()}\n`;
        }
        exportText += `Excerpt: "${citation.excerpt}"\n\n`;
      });
    }

    // Create and download file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reportData.title,
          text: reportData.executiveSummary,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="dialog-report-viewer">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold leading-tight" data-testid="text-report-title">
                {reportData.title}
              </DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Generated in {Math.round(reportData.processingTimeMs / 1000)}s</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <LinkIcon className="h-3 w-3" />
                    <span>{reportData.sources.length} sources</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Quote className="h-3 w-3" />
                    <span>{reportData.citations.length} citations</span>
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Fresh Data
                  </Badge>
                </div>
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                data-testid="button-export-report"
              >
                <Download className="mr-1 h-3 w-3" />
                Export
              </Button>
              <Button 
                size="sm" 
                onClick={handleShare}
                data-testid="button-share-report"
              >
                <Share2 className="mr-1 h-3 w-3" />
                Share
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-border">
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'report'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('report')}
            data-testid="tab-report"
          >
            Report
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sources'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('sources')}
            data-testid="tab-sources"
          >
            Sources ({reportData.sources.length})
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 pr-4">
          {activeTab === 'report' ? (
            <div className="space-y-6 py-4" data-testid="report-content">
              {/* Executive Summary */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">Executive Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {reportData.executiveSummary}
                </p>
              </div>

              <Separator />

              {/* Key Insights */}
              {reportData.keyInsights.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">Key Insights</h3>
                  <ul className="space-y-3">
                    {reportData.keyInsights.map((insight, index) => (
                      <li 
                        key={index} 
                        className="flex items-start space-x-3"
                        data-testid={`insight-${index}`}
                      >
                        <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {insight}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Citations */}
              {reportData.citations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-3">Citations</h3>
                    <div className="space-y-4">
                      {reportData.citations.map((citation, index) => (
                        <div 
                          key={citation.id} 
                          className="bg-secondary rounded-lg p-4"
                          data-testid={`citation-${index}`}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-primary font-medium flex-shrink-0">
                              [{index + 1}]
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className={`flex items-center space-x-1 ${getSourceColor(citation.source.type)}`}>
                                  {getSourceIcon(citation.source.type)}
                                  <span className="text-sm font-medium">
                                    {citation.source.title}
                                  </span>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {Math.round(citation.source.confidence * 100)}% confidence
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                "{citation.excerpt}"
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <a 
                                  href={citation.source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span>View Source</span>
                                </a>
                                {citation.source.publishedDate && (
                                  <span>
                                    Published: {new Date(citation.source.publishedDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Sources Tab */
            <div className="space-y-4 py-4" data-testid="sources-content">
              {/* Source Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.sourceBreakdown.files}
                  </div>
                  <div className="text-xs text-muted-foreground">Files</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.sourceBreakdown.web}
                  </div>
                  <div className="text-xs text-muted-foreground">Web Sources</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.sourceBreakdown.live}
                  </div>
                  <div className="text-xs text-muted-foreground">Live Data</div>
                </div>
              </div>

              <Separator />

              {/* Source List */}
              <div className="space-y-3">
                {reportData.sources.map((source, index) => (
                  <div 
                    key={index} 
                    className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                    data-testid={`source-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`flex items-center space-x-1 ${getSourceColor(source.type)}`}>
                            {getSourceIcon(source.type)}
                            <span className="text-sm font-medium">
                              {source.title}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Confidence: {Math.round(source.confidence * 100)}%</span>
                          {source.publishedDate && (
                            <span>
                              Published: {new Date(source.publishedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        asChild
                        className="flex-shrink-0"
                      >
                        <a 
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`button-view-source-${index}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
