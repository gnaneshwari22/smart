import axios from 'axios';
import * as cheerio from 'cheerio';
import { summarizeContent } from '../openai';
import type { ResearchSource } from '../openai';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  content: string;
  publishedDate?: string;
}

export class WebScraper {
  private userAgent = 'Mozilla/5.0 (compatible; ResearchBot/1.0; +https://researchai.com/bot)';

  async searchWeb(query: string, limit = 5): Promise<ResearchSource[]> {
    try {
      // In production, you would use Google Search API, Bing API, or similar
      // For now, we'll simulate web search results with curated sources
      const searchResults = await this.simulateWebSearch(query, limit);
      
      const sources: ResearchSource[] = [];
      
      for (const result of searchResults) {
        try {
          const content = await this.scrapeWebpage(result.url);
          const summarizedContent = await summarizeContent(content, 1000);
          
          sources.push({
            title: result.title,
            url: result.url,
            content: summarizedContent,
            type: 'web',
            confidence: 0.85,
            publishedDate: result.publishedDate,
          });
        } catch (error) {
          console.error(`Failed to scrape ${result.url}:`, error.message);
          // Use snippet as fallback content
          sources.push({
            title: result.title,
            url: result.url,
            content: result.snippet,
            type: 'web',
            confidence: 0.7,
            publishedDate: result.publishedDate,
          });
        }
      }
      
      return sources;
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  private async simulateWebSearch(query: string, limit: number): Promise<WebSearchResult[]> {
    // Simulated search results - in production, use real search APIs
    const mockResults: WebSearchResult[] = [
      {
        title: "AI Productivity Tools Market Analysis 2024",
        url: "https://techcrunch.com/ai-productivity-2024",
        snippet: "Latest analysis shows AI productivity tools experiencing unprecedented growth with 340% increase in enterprise adoption.",
        content: "placeholder",
        publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        title: "OpenAI GPT-5 Release Transforms Business Operations",
        url: "https://arstechnica.com/gpt5-business-impact",
        snippet: "The new GPT-5 model is revolutionizing how businesses approach automation and content generation.",
        content: "placeholder",
        publishedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        title: "Venture Capital Investment in AI Tools Reaches New Heights",
        url: "https://bloomberg.com/vc-ai-investment-2024",
        snippet: "Q1 2024 sees record-breaking investments in AI productivity and automation solutions.",
        content: "placeholder",
        publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        title: "Microsoft Copilot Integration Drives Enterprise Adoption",
        url: "https://microsoft.com/copilot-enterprise-success",
        snippet: "Microsoft reports 60% of Fortune 500 companies now using AI-powered productivity assistants.",
        content: "placeholder",
        publishedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Google Workspace AI Features Show 25% Productivity Gains",
        url: "https://google.com/workspace-ai-productivity",
        snippet: "Internal studies reveal significant productivity improvements from AI-integrated workplace tools.",
        content: "placeholder",
        publishedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Filter results based on query relevance (simple keyword matching)
    const keywords = query.toLowerCase().split(' ');
    const filteredResults = mockResults.filter(result => {
      const searchText = (result.title + ' ' + result.snippet).toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    });

    return filteredResults.slice(0, limit);
  }

  private async scrapeWebpage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, .advertisement, .ads, .sidebar').remove();
      
      // Extract main content
      let content = '';
      
      // Try to find main content areas
      const contentSelectors = [
        'article',
        '[role="main"]',
        '.content',
        '.post-content',
        '.article-content',
        'main',
        '#content',
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length && element.text().trim().length > 200) {
          content = element.text();
          break;
        }
      }
      
      // Fallback to body content
      if (!content) {
        content = $('body').text();
      }
      
      // Clean up the content
      content = content
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
        .trim();
      
      return content.substring(0, 8000); // Limit content length
    } catch (error) {
      throw new Error(`Failed to scrape webpage: ${error.message}`);
    }
  }

  async getRecentNews(topics: string[], hours = 24): Promise<ResearchSource[]> {
    try {
      const sources: ResearchSource[] = [];
      
      for (const topic of topics) {
        const results = await this.searchWeb(`${topic} news latest ${hours} hours`, 3);
        sources.push(...results);
      }
      
      // Sort by confidence and recency
      return sources
        .sort((a, b) => {
          const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
          const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting recent news:', error);
      return [];
    }
  }
}

export const webScraper = new WebScraper();
