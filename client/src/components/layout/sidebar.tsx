import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Home,
  Search,
  FileText,
  Upload,
  BarChart3,
  Settings,
  User,
  CreditCard
} from "lucide-react";
import { Link } from "wouter";

interface StatsResponse {
  credits: number;
  totalReports: number;
  totalCreditsUsed: number;
  documentsUploaded: number;
  liveSources: number;
}

export function Sidebar() {
  const { user } = useAuth();
  
  // Fetch user stats for credit display
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["/api/analytics/stats"],
  });

  const credits = stats?.credits || user?.credits || 0;
  const maxCredits = 50; // Default free tier
  const creditPercentage = (credits / maxCredits) * 100;

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="text-primary-foreground text-sm" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="text-sidebar-brand">Research AI</h1>
            <p className="text-xs text-muted-foreground">Smart Assistant</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/">
          <a className="flex items-center space-x-3 px-3 py-2 rounded-md bg-primary text-primary-foreground w-full" data-testid="nav-dashboard">
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </a>
        </Link>
        
        <button className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-secondary w-full text-left" data-testid="nav-new-research">
          <Search className="w-4 h-4" />
          <span className="text-sm">New Research</span>
        </button>
        
        <button className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-secondary w-full text-left" data-testid="nav-my-reports">
          <FileText className="w-4 h-4" />
          <span className="text-sm">My Reports</span>
        </button>
        
        <button className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-secondary w-full text-left" data-testid="nav-documents">
          <Upload className="w-4 h-4" />
          <span className="text-sm">Documents</span>
        </button>
        
        <button className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-secondary w-full text-left" data-testid="nav-analytics">
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm">Analytics</span>
        </button>
      </nav>
      
      {/* Credits & Account */}
      <div className="p-4 border-t border-border space-y-4">
        {/* Credit Counter */}
        <div className="bg-secondary rounded-lg p-3" data-testid="credit-counter">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Credits Remaining</span>
            <span className="text-sm text-muted-foreground" data-testid="text-credits-remaining">
              {credits} / {maxCredits}
            </span>
          </div>
          <Progress value={creditPercentage} className="h-2 mb-2" data-testid="progress-credits" />
          <Link href="/checkout">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-primary hover:underline p-0 h-auto"
              data-testid="button-buy-credits"
            >
              Buy More Credits
            </Button>
          </Link>
        </div>
        
        {/* User Profile */}
        <div className="flex items-center space-x-3" data-testid="user-profile">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
                data-testid="img-user-avatar"
              />
            ) : (
              <User className="text-muted-foreground text-xs" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" data-testid="text-user-name">
              {user?.firstName || user?.email || 'User'}
            </p>
            <Badge variant="secondary" className="text-xs">Pro Plan</Badge>
          </div>
          <button 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => window.location.href = '/api/logout'}
            data-testid="button-settings"
          >
            <Settings className="text-sm w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
