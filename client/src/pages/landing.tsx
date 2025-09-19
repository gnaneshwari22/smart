import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Brain, FileText, Globe, Zap, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold" data-testid="text-brand-name">Research AI</h1>
                <p className="text-xs text-muted-foreground">Smart Assistant</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4" data-testid="badge-ai-powered">
            AI-Powered Research Assistant
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Generate Evidence-Based <br />
            <span className="text-primary">Research Reports</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Stop spending hours googling and reading PDFs. Our AI assistant analyzes your documents, 
            searches live data sources, and generates comprehensive reports with verified citations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-start-research"
            >
              <Brain className="mr-2 h-5 w-5" />
              Start Researching
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              data-testid="button-view-demo"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Three simple steps to get comprehensive research reports
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card data-testid="card-upload-docs">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Upload PDFs, DOCX, TXT, or CSV files. Our AI extracts and analyzes the content.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card data-testid="card-ask-question">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Ask Your Question</CardTitle>
                <CardDescription>
                  Type your research question. Choose from uploaded files, live web data, or both.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card data-testid="card-get-report">
              <CardHeader>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-chart-3" />
                </div>
                <CardTitle>Get Your Report</CardTitle>
                <CardDescription>
                  Receive a structured report with key insights, citations, and source links in seconds.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose Research AI?</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3" data-testid="benefit-live-data">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Live Data Integration</h3>
                    <p className="text-muted-foreground">
                      Real-time web scraping and news feeds keep your research fresh and current.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3" data-testid="benefit-citations">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Verified Citations</h3>
                    <p className="text-muted-foreground">
                      Every insight is backed by properly cited sources with confidence scores.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3" data-testid="benefit-multimodal">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Multiple Source Types</h3>
                    <p className="text-muted-foreground">
                      Combine uploaded documents, web search results, and live data streams.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3" data-testid="benefit-usage-based">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Pay Per Report</h3>
                    <p className="text-muted-foreground">
                      Usage-based billing - only pay for the reports you generate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Card className="p-6" data-testid="card-sample-report">
              <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Sample Report Preview</CardTitle>
                  <Badge variant="secondary" className="text-xs">Fresh Data</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-0 space-y-4">
                <div>
                  <h4 className="font-semibold text-primary mb-2">Executive Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    AI productivity tools market experiencing 340% growth in enterprise adoption, 
                    driven by automation demand and generative AI capabilities...
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary mb-2">Key Insights</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-3 w-3 text-accent mt-1 flex-shrink-0" />
                      <span>Enterprise AI tool adoption increased 450% in Q1 2024</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-3 w-3 text-accent mt-1 flex-shrink-0" />
                      <span>Integration capabilities top factor in tool selection</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>8 sources • 23 citations • 94% confidence</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, Usage-Based Pricing</h2>
          <p className="text-muted-foreground text-lg mb-12">
            Start with 50 free credits. Only pay for what you use.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card data-testid="card-pricing-starter">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Perfect for individual researchers</CardDescription>
                <div className="text-3xl font-bold mt-4">Free</div>
                <p className="text-muted-foreground">50 credits included</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>50 report credits</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>Document uploads</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>Live data integration</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  variant="outline"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-get-started-free"
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary shadow-lg scale-105" data-testid="card-pricing-pro">
              <CardHeader>
                <Badge className="w-fit mb-2">Most Popular</Badge>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>For teams and frequent researchers</CardDescription>
                <div className="text-3xl font-bold mt-4">$10</div>
                <p className="text-muted-foreground">100 credits</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>100 report credits</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>API access</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-upgrade-pro"
                >
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>

            <Card data-testid="card-pricing-enterprise">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For large teams and organizations</CardDescription>
                <div className="text-3xl font-bold mt-4">Custom</div>
                <p className="text-muted-foreground">Volume pricing</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>Unlimited reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>SSO integration</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  variant="outline"
                  data-testid="button-contact-sales"
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold" data-testid="text-footer-brand">Research AI</h3>
                <p className="text-sm text-muted-foreground">Smart Research Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>© 2024 Research AI. All rights reserved.</span>
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
