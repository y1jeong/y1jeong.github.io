import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  BookOpen,
  Code,
  Zap,
  Download,
  Image,
  Grid,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle,
  ArrowRight
} from 'lucide-react';


interface DocSection {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  articles: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  readTime: string;
}

const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Everything you need to know to start using RhinoPerf',
    category: 'Basics',
    icon: BookOpen,
    articles: [
      {
        id: 'introduction',
        title: 'Introduction to RhinoPerf',
        description: 'Overview of features and capabilities',
        lastUpdated: '2024-02-15',
        readTime: '5 min'
      },
      {
        id: 'installation',
        title: 'Installation & Setup',
        description: 'How to get started with your account',
        lastUpdated: '2024-02-14',
        readTime: '3 min'
      },
      {
        id: 'first-design',
        title: 'Creating Your First Design',
        description: 'Step-by-step guide to your first perforation pattern',
        lastUpdated: '2024-02-13',
        readTime: '10 min'
      },
      {
        id: 'interface-overview',
        title: 'Interface Overview',
        description: 'Understanding the design workspace',
        lastUpdated: '2024-02-12',
        readTime: '8 min'
      }
    ]
  },
  {
    id: 'design-tools',
    title: 'Design Tools',
    description: 'Master the design interface and tools',
    category: 'Design',
    icon: Grid,
    articles: [
      {
        id: 'pattern-generator',
        title: 'Pattern Generator',
        description: 'Creating patterns with the built-in generator',
        lastUpdated: '2024-02-11',
        readTime: '12 min'
      },
      {
        id: 'custom-shapes',
        title: 'Custom Shapes',
        description: 'Working with custom perforation shapes',
        lastUpdated: '2024-02-10',
        readTime: '15 min'
      },
      {
        id: 'parameters',
        title: 'Parameter Controls',
        description: 'Fine-tuning your designs with parameters',
        lastUpdated: '2024-02-09',
        readTime: '10 min'
      },
      {
        id: 'layers',
        title: 'Working with Layers',
        description: 'Organizing complex designs with layers',
        lastUpdated: '2024-02-08',
        readTime: '8 min'
      }
    ]
  },
  {
    id: 'image-processing',
    title: 'Image Processing',
    description: 'Generate patterns from images and textures',
    category: 'Advanced',
    icon: Image,
    articles: [
      {
        id: 'image-import',
        title: 'Importing Images',
        description: 'Supported formats and import options',
        lastUpdated: '2024-02-07',
        readTime: '6 min'
      },
      {
        id: 'image-to-pattern',
        title: 'Image to Pattern Conversion',
        description: 'Converting images to perforation patterns',
        lastUpdated: '2024-02-06',
        readTime: '18 min'
      },
      {
        id: 'processing-options',
        title: 'Processing Options',
        description: 'Advanced image processing settings',
        lastUpdated: '2024-02-05',
        readTime: '12 min'
      }
    ]
  },
  {
    id: 'export-formats',
    title: 'Export & Formats',
    description: 'Export your designs in various formats',
    category: 'Export',
    icon: Download,
    articles: [
      {
        id: 'export-overview',
        title: 'Export Overview',
        description: 'Understanding different export formats',
        lastUpdated: '2024-02-04',
        readTime: '7 min'
      },
      {
        id: 'dxf-export',
        title: 'DXF Export for CNC',
        description: 'Preparing files for CNC machining',
        lastUpdated: '2024-02-03',
        readTime: '15 min'
      },
      {
        id: 'svg-export',
        title: 'SVG Export',
        description: 'Vector graphics export options',
        lastUpdated: '2024-02-02',
        readTime: '8 min'
      },
      {
        id: 'batch-export',
        title: 'Batch Export',
        description: 'Exporting multiple designs at once',
        lastUpdated: '2024-02-01',
        readTime: '10 min'
      }
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Integrate RhinoPerf into your workflow',
    category: 'Developer',
    icon: Code,
    articles: [
      {
        id: 'api-overview',
        title: 'API Overview',
        description: 'Getting started with the RhinoPerf API',
        lastUpdated: '2024-01-31',
        readTime: '12 min'
      },
      {
        id: 'authentication',
        title: 'Authentication',
        description: 'API authentication and security',
        lastUpdated: '2024-01-30',
        readTime: '8 min'
      },
      {
        id: 'endpoints',
        title: 'API Endpoints',
        description: 'Complete endpoint reference',
        lastUpdated: '2024-01-29',
        readTime: '20 min'
      },
      {
        id: 'examples',
        title: 'Code Examples',
        description: 'Sample code and integration examples',
        lastUpdated: '2024-01-28',
        readTime: '15 min'
      }
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Features',
    description: 'Power user features and techniques',
    category: 'Advanced',
    icon: Zap,
    articles: [
      {
        id: 'performance',
        title: 'Performance Optimization',
        description: 'Optimizing large and complex designs',
        lastUpdated: '2024-01-27',
        readTime: '14 min'
      },
      {
        id: 'automation',
        title: 'Design Automation',
        description: 'Automating repetitive design tasks',
        lastUpdated: '2024-01-26',
        readTime: '18 min'
      },
      {
        id: 'collaboration',
        title: 'Team Collaboration',
        description: 'Working with teams and sharing designs',
        lastUpdated: '2024-01-25',
        readTime: '12 min'
      }
    ]
  }
];

const quickStart = {
  title: 'Quick Start Guide',
  description: 'Get up and running in 5 minutes',
  steps: [
    'Sign up for a free account',
    'Choose a template or start from scratch',
    'Customize your perforation pattern',
    'Preview and adjust parameters',
    'Export in your preferred format'
  ]
};

const codeExample = `// Example: Generate a grid pattern via API
const response = await fetch('/api/patterns/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'grid',
    shape: 'circle',
    spacing: { x: 10, y: 10 },
    size: { width: 100, height: 100 },
    perforation: { diameter: 3 }
  })
});

const pattern = await response.json();`;

export const Docs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedCode, setCopiedCode] = useState(false);

  const categories = ['All', ...Array.from(new Set(docSections.map(section => section.category)))];

  const filteredSections = docSections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.articles.some(article => 
                           article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.description.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesCategory = selectedCategory === 'All' || section.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const copyCode = async () => {
    await navigator.clipboard.writeText(codeExample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            <span className="text-primary">Documentation</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete guides, API reference, and tutorials to help you get the most out of RhinoPerf.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{quickStart.title}</CardTitle>
                  <CardDescription className="text-lg">{quickStart.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {quickStart.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-4">
                <Button asChild>
                  <a href="/auth/register">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#getting-started">
                    Read Guide
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-input bg-background px-3 py-2 text-sm rounded-md"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            
            return (
              <Card key={section.id} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <Badge variant="outline">{section.category}</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.articles.map((article) => (
                      <div key={article.id} className="group">
                        <a 
                          href={`#${section.id}-${article.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium group-hover:text-primary transition-colors">
                              {article.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {article.description}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{article.readTime}</span>
                              <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* API Example */}
        <div className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">API Example</CardTitle>
                    <CardDescription>Generate patterns programmatically</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCode}
                  className="flex items-center gap-2"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{codeExample}</code>
              </pre>
              <div className="mt-4 flex gap-4">
                <Button variant="outline" asChild>
                  <a href="#api-reference">
                    View API Docs
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#examples">
                    More Examples
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No documentation found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or browse all sections.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">
                Need more help?
              </CardTitle>
              <CardDescription className="text-lg">
                Can't find what you're looking for? Check out our help center or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/help">
                  Help Center
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/contact">
                  Contact Support
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};