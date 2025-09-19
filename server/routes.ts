import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { upload, processUploadedFile, validateFileUpload } from "./services/fileProcessor";
import { reportGenerator } from "./services/reportGenerator";
import { pathwayIntegration } from "./pathway";
import { researchQuerySchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found - payment features will be disabled');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Start Pathway integration
  try {
    await pathwayIntegration.start();
  } catch (error) {
    console.error('Failed to start Pathway integration:', error);
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Document management routes
  app.post('/api/documents/upload', isAuthenticated, upload.array('files', 5), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const uploadedDocuments = [];

      for (const file of files) {
        // Validate file
        const validationError = validateFileUpload(file);
        if (validationError) {
          return res.status(400).json({ message: validationError });
        }

        try {
          // Process file
          const processedFile = await processUploadedFile(file);
          
          // Save to database
          const document = await storage.createDocument(userId, {
            filename: processedFile.filename,
            originalName: processedFile.originalName,
            mimeType: processedFile.mimeType,
            size: processedFile.size,
            content: processedFile.content,
            metadata: processedFile.metadata,
          });

          uploadedDocuments.push(document);

          // Track usage
          await storage.createUsageEvent(userId, 'document_uploaded', 0, {
            documentId: document.id,
            filename: document.originalName,
            size: document.size,
          });
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          return res.status(500).json({ 
            message: `Failed to process file ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
        }
      }

      res.json({ 
        message: `Successfully uploaded ${uploadedDocuments.length} documents`,
        documents: uploadedDocuments 
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });

  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentId = req.params.id;
      
      // Verify document ownership
      const document = await storage.getDocument(documentId);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.deleteDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Research and report generation routes
  app.post('/api/research/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const queryData = researchQuerySchema.parse(req.body);
      
      // Check user credits
      const user = await storage.getUser(userId);
      if (!user || (user.credits ?? 0) < 1) {
        return res.status(402).json({ 
          message: "Insufficient credits. Please purchase more credits to generate reports." 
        });
      }

      // Generate report
      const report = await reportGenerator.generateReport({
        userId,
        query: queryData,
        includeUserFiles: queryData.includeFiles,
        includeLiveData: queryData.includeLiveData,
        includeWebSearch: queryData.sourceTypes.includes('web'),
      });

      // Save report and deduct credits
      const reportId = await reportGenerator.saveReport(userId, report, queryData);

      res.json({
        reportId,
        report: {
          title: report.title,
          executiveSummary: report.executiveSummary,
          keyInsights: report.keyInsights,
          sources: report.sources,
          citations: report.citations,
          processingTimeMs: report.processingTimeMs,
          sourceBreakdown: report.sourceBreakdown,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      console.error("Report generation error:", error);
      res.status(500).json({ 
        message: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const reports = await storage.getUserReports(userId, limit);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get('/api/reports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = req.params.id;
      
      const report = await storage.getReport(reportId);
      if (!report || report.userId !== userId) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Live data and analytics routes
  app.get('/api/live-data/sources', isAuthenticated, async (req, res) => {
    try {
      const sources = await storage.getActiveLiveDataSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching live data sources:", error);
      res.status(500).json({ message: "Failed to fetch live data sources" });
    }
  });

  app.get('/api/live-data/recent', isAuthenticated, async (req, res) => {
    try {
      const minutes = parseInt(req.query.minutes as string) || 60;
      const data = await pathwayIntegration.getRecentData(minutes);
      res.json(data);
    } catch (error) {
      console.error("Error fetching recent live data:", error);
      res.status(500).json({ message: "Failed to fetch recent live data" });
    }
  });

  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const usageStats = await storage.getUserUsageStats(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        credits: user.credits,
        totalReports: user.totalReports,
        totalCreditsUsed: usageStats.totalCreditsUsed,
        documentsUploaded: usageStats.documentsUploaded,
        liveSources: 4, // Static for now
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Stripe payment routes
  if (stripe) {
    app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
      try {
        const { credits } = req.body;
        
        if (!credits || credits < 1) {
          return res.status(400).json({ message: "Invalid credits amount" });
        }

        // Credit pricing: $0.10 per credit, minimum $1
        const amount = Math.max(100, credits * 10); // Cents

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          metadata: {
            userId: req.user.claims.sub,
            credits: credits.toString(),
          },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Payment intent creation error:", error);
        res.status(500).json({ 
          message: "Error creating payment intent: " + error.message 
        });
      }
    });

    app.post('/api/webhooks/stripe', async (req, res) => {
      const sig = req.headers['stripe-signature'] as string;
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle successful payment
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const userId = paymentIntent.metadata.userId;
        const credits = parseInt(paymentIntent.metadata.credits);

        try {
          // Add credits to user account
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUserCredits(userId, (user.credits ?? 0) + credits);
            
            // Track purchase event
            await storage.createUsageEvent(userId, 'credits_purchased', -credits, {
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
            });
          }
        } catch (error) {
          console.error('Error processing credit purchase:', error);
        }
      }

      res.json({ received: true });
    });
  } else {
    // Disabled payment routes
    app.post("/api/create-payment-intent", (req, res) => {
      res.status(503).json({ message: "Payment processing is currently unavailable" });
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
