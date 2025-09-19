
import json
import time
import sys
from datetime import datetime, timedelta
import random

# Mock Pathway integration - simulates live data ingestion
class MockPathwayConnector:
    def __init__(self):
        self.sources = [
            {
                "name": "Tech News",
                "type": "news",
                "base_urls": ["https://techcrunch.com", "https://arstechnica.com"]
            },
            {
                "name": "Market Data",
                "type": "market",
                "base_urls": ["https://marketwatch.com", "https://bloomberg.com"]
            }
        ]
        self.data_items = []
        self.counter = 0

    def generate_mock_data(self):
        """Generate mock live data updates"""
        news_titles = [
            "AI Productivity Tools See 340% Growth in Enterprise Adoption",
            "OpenAI Releases New GPT-5 Model with Enhanced Reasoning",
            "Startup Funding Reaches Record Highs in Q1 2024",
            "Microsoft Integrates AI Assistants Across Office Suite",
            "Google's Gemini Model Shows Breakthrough in Code Generation"
        ]
        
        market_titles = [
            "Tech Stocks Rally on AI Investment News",
            "Venture Capital Focuses on AI Infrastructure",
            "SaaS Companies Report Strong Q1 Earnings",
            "Cloud Computing Revenue Exceeds Projections",
            "Cybersecurity Spending Increases 45% Year-over-Year"
        ]
        
        content_snippets = [
            "Recent market analysis shows unprecedented growth in AI-powered tools, with enterprise adoption increasing by 340% year-over-year. Companies are investing heavily in automation and productivity enhancement solutions.",
            "The latest developments in artificial intelligence are transforming how businesses operate, with new models offering enhanced capabilities for content generation, data analysis, and process automation.",
            "Investment patterns indicate a strong preference for AI and automation technologies, with funding rounds averaging 60% higher than previous quarters for companies in this sector.",
            "Integration of AI assistants into existing software ecosystems is accelerating, providing users with intelligent automation capabilities across multiple platforms and workflows.",
            "Market research indicates that companies implementing AI productivity tools are seeing average efficiency gains of 25-40% across various operational metrics."
        ]
        
        source = random.choice(self.sources)
        title = random.choice(news_titles if source["type"] == "news" else market_titles)
        content = random.choice(content_snippets)
        
        return {
            "id": f"pathway_{self.counter}_{int(time.time())}",
            "title": title,
            "content": content,
            "url": f"{random.choice(source['base_urls'])}/article/{self.counter}",
            "timestamp": datetime.now().isoformat(),
            "source": source["name"]
        }

    def run_continuous(self):
        """Simulate continuous data ingestion"""
        print("Starting Pathway mock integration...", file=sys.stderr)
        
        while True:
            try:
                # Generate new data every 30-60 seconds
                time.sleep(random.randint(30, 60))
                
                new_item = self.generate_mock_data()
                self.counter += 1
                
                # Write to data file for Node.js to read
                try:
                    with open("pathway_data.json", "r") as f:
                        existing_data = json.load(f)
                except (FileNotFoundError, json.JSONDecodeError):
                    existing_data = []
                
                existing_data.append(new_item)
                
                # Keep only last 100 items
                if len(existing_data) > 100:
                    existing_data = existing_data[-100:]
                
                with open("pathway_data.json", "w") as f:
                    json.dump(existing_data, f, indent=2)
                
                print(f"Generated new data item: {new_item['title']}", file=sys.stderr)
                
            except Exception as e:
                print(f"Error in Pathway integration: {e}", file=sys.stderr)
                time.sleep(5)

if __name__ == "__main__":
    connector = MockPathwayConnector()
    connector.run_continuous()
