import { generateResearchReport, type ResearchSource, type ResearchReport } from '../openai';
import { webScraper } from './webScraper';
import { pathwayIntegration } from '../pathway';
import { storage } from '../storage';
import type { ResearchQuery } from '@shared/schema';

export interface ReportGenerationOptions {
  userId: string;
  query: ResearchQuery;
  includeUserFiles?: boolean;
  includeLiveData?: boolean;
  includeWebSearch?: boolean;
}

export interface GeneratedReport extends ResearchReport {
  processingTimeMs: number;
  sourceBreakdown: {
    files: number;
    web: number;
    live: number;
  };
}

export class ReportGenerator {
  async generateReport(options: ReportGenerationOptions): Promise<GeneratedReport> {
    const startTime = Date.now();
    const sources: ResearchSource[] = [];
    let sourceBreakdown = { files: 0, web: 0, live: 0 };

    try {
      // Gather sources based on user preferences
      if (options.includeUserFiles && options.query.sourceTypes.includes('files')) {
        const fileSources = await this.getFileBasedSources(options.userId, options.query.question);
        sources.push(...fileSources);
        sourceBreakdown.files = fileSources.length;
      }

      if (options.includeWebSearch && options.query.sourceTypes.includes('web')) {
        const webSources = await this.getWebSources(options.query.question);
        sources.push(...webSources);
        sourceBreakdown.web = webSources.length;
      }

      if (options.includeLiveData && options.query.includeLiveData) {
        const liveSources = await this.getLiveDataSources(options.query.question);
        sources.push(...liveSources);
        sourceBreakdown.live = liveSources.length;
      }

      if (sources.length === 0) {
        throw new Error('No sources available for research. Please upload documents or enable web search.');
      }

      // Generate the research report using OpenAI
      const report = await generateResearchReport(options.query.question, sources);
      
      const processingTimeMs = Date.now() - startTime;

      return {
        ...report,
        processingTimeMs,
        sourceBreakdown,
      };
    } catch (error) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  private async getFileBasedSources(userId: string, query: string): Promise<ResearchSource[]> {
    try {
      const userDocuments = await storage.getUserDocuments(userId);
      
      if (userDocuments.length === 0) {
        return [];
      }

      // Convert user documents to research sources
      const sources: ResearchSource[] = userDocuments.map(doc => ({
        title: doc.originalName,
        url: `file://${doc.filename}`,
        content: doc.content || 'No content available',
        type: 'file',
        confidence: 0.9,
        publishedDate: doc.createdAt?.toISOString(),
      }));

      // Filter relevant documents based on query (simple keyword matching)
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      const relevantSources = sources.filter(source => {
        const searchText = (source.title + ' ' + source.content).toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      });

      return relevantSources.slice(0, 5); // Limit to 5 most relevant files
    } catch (error) {
      console.error('Error getting file-based sources:', error);
      return [];
    }
  }

  private async getWebSources(query: string): Promise<ResearchSource[]> {
    try {
      return await webScraper.searchWeb(query, 5);
    } catch (error) {
      console.error('Error getting web sources:', error);
      return [];
    }
  }

  private async getLiveDataSources(query: string): Promise<ResearchSource[]> {
    try {
      // Get recent live data from Pathway integration
      const liveData = await pathwayIntegration.getRecentData(60); // Last hour
      
      if (liveData.length === 0) {
        return [];
      }

      // Filter relevant live data based on query
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      const relevantData = liveData.filter(item => {
        const searchText = (item.title + ' ' + item.content).toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      });

      // Convert to research sources
      const sources: ResearchSource[] = relevantData.map(item => ({
        title: item.title,
        url: item.url,
        content: item.content,
        type: 'web',
        confidence: 0.8,
        publishedDate: item.timestamp.toISOString(),
      }));

      return sources.slice(0, 3); // Limit to 3 most recent
    } catch (error) {
      console.error('Error getting live data sources:', error);
      return [];
    }
  }

  async saveReport(userId: string, report: GeneratedReport, query: ResearchQuery): Promise<string> {
    try {
      const reportData = {
        title: report.title,
        query: query.question,
        content: this.formatReportContent(report),
        summary: report.executiveSummary,
        sources: report.sources,
        citations: report.citations,
        sourceTypes: query.sourceTypes,
        processingTimeMs: report.processingTimeMs,
        creditsUsed: 1,
      };

      const savedReport = await storage.createReport(userId, reportData);
      
      // Track usage event
      await storage.createUsageEvent(
        userId,
        'report_generated',
        1,
        {
          reportId: savedReport.id,
          sourceBreakdown: report.sourceBreakdown,
          processingTimeMs: report.processingTimeMs,
        }
      );

      return savedReport.id;
    } catch (error) {
      throw new Error(`Failed to save report: ${error.message}`);
    }
  }

  private formatReportContent(report: GeneratedReport): string {
    let content = `# ${report.title}\n\n`;
    
    content += `## Executive Summary\n${report.executiveSummary}\n\n`;
    
    if (report.keyInsights.length > 0) {
      content += `## Key Insights\n`;
      report.keyInsights.forEach((insight, index) => {
        content += `${index + 1}. ${insight}\n`;
      });
      content += '\n';
    }
    
    if (report.citations.length > 0) {
      content += `## Sources & Citations\n`;
      report.citations.forEach((citation, index) => {
        content += `[${index + 1}] ${citation.source.title}\n`;
        content += `URL: ${citation.source.url}\n`;
        if (citation.source.publishedDate) {
          content += `Published: ${new Date(citation.source.publishedDate).toLocaleDateString()}\n`;
        }
        content += `Excerpt: "${citation.excerpt}"\n\n`;
      });
    }

    return content;
  }
}

export const reportGenerator = new ReportGenerator();
