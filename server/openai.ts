import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface ResearchSource {
  title: string;
  url: string;
  content: string;
  type: 'file' | 'web' | 'academic';
  confidence: number;
  publishedDate?: string;
}

export interface Citation {
  id: string;
  source: ResearchSource;
  relevance: number;
  excerpt: string;
}

export interface ResearchReport {
  title: string;
  executiveSummary: string;
  keyInsights: string[];
  sources: ResearchSource[];
  citations: Citation[];
  confidence: number;
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export async function generateResearchReport(
  query: string,
  sources: ResearchSource[]
): Promise<ResearchReport> {
  try {
    const sourcesText = sources.map((source, index) => 
      `[${index + 1}] ${source.title}\nType: ${source.type}\nURL: ${source.url}\nContent: ${source.content.substring(0, 2000)}...\n\n`
    ).join('');

    const prompt = `You are an expert research analyst. Based on the following query and sources, generate a comprehensive research report.

Query: "${query}"

Sources:
${sourcesText}

Generate a detailed research report with the following structure. Respond with JSON in this exact format:
{
  "title": "Report title based on the query",
  "executiveSummary": "2-3 sentence executive summary",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "sources": [{"title": "source title", "url": "source url", "type": "source type", "confidence": 0.95}],
  "citations": [{"id": "1", "sourceIndex": 0, "relevance": 0.9, "excerpt": "relevant excerpt from source"}],
  "confidence": 0.92
}

Ensure all insights are backed by the provided sources and include proper citations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert research analyst who generates evidence-based reports with proper citations. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Process and enhance the result
    const processedCitations = result.citations?.map((citation: any) => ({
      id: citation.id,
      source: sources[citation.sourceIndex] || sources[0],
      relevance: citation.relevance || 0.8,
      excerpt: citation.excerpt || ""
    })) || [];

    return {
      title: result.title || `Research Report: ${query}`,
      executiveSummary: result.executiveSummary || "No executive summary generated.",
      keyInsights: result.keyInsights || [],
      sources: sources,
      citations: processedCitations,
      confidence: result.confidence || 0.8
    };
  } catch (error) {
    throw new Error(`Failed to generate research report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractTextFromDocument(content: string, mimeType: string): Promise<string> {
  try {
    const prompt = `Extract and clean the main text content from this document. Remove any formatting artifacts, headers, footers, or irrelevant content. Return only the cleaned text content.

Document content:
${content.substring(0, 8000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a document processing expert. Extract clean, readable text from documents while preserving important information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || content;
  } catch (error) {
    console.error('Error extracting text:', error);
    return content; // Fallback to original content
  }
}

export async function summarizeContent(content: string, maxLength = 500): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Summarize the following content in approximately ${maxLength} characters while maintaining key information and insights.`
        },
        {
          role: "user",
          content: content.substring(0, 4000)
        }
      ],
    });

    return response.choices[0].message.content || content.substring(0, maxLength);
  } catch (error) {
    console.error('Error summarizing content:', error);
    return content.substring(0, maxLength);
  }
}
