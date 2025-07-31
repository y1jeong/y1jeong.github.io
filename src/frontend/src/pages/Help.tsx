import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  BookOpen,
  Video,
  MessageCircle,
  FileText,
  Download,
  ChevronRight,
  Clock,
  Users,
  Settings,
  Image,
  Grid,
  ArrowRight,
  HelpCircle,
  Star
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'article' | 'video' | 'tutorial';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  views: number;
  rating: number;
  lastUpdated: string;
  tags: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with RhinoPerf',
    description: 'Learn the basics of creating your first perforation design',
    category: 'Getting Started',
    type: 'tutorial',
    difficulty: 'Beginner',
    estimatedTime: '10 min',
    views: 2450,
    rating: 4.8,
    lastUpdated: '2024-02-15',
    tags: ['basics', 'tutorial', 'first-steps'],
    icon: BookOpen
  },
  {
    id: 'design-interface',
    title: 'Understanding the Design Interface',
    description: 'Complete guide to the design workspace and tools',
    category: 'Interface',
    type: 'article',
    difficulty: 'Beginner',
    estimatedTime: '15 min',
    views: 1890,
    rating: 4.7,
    lastUpdated: '2024-02-10',
    tags: ['interface', 'workspace', 'tools'],
    icon: Grid
  },
  {
    id: 'perforation-patterns',
    title: 'Creating Custom Perforation Patterns',
    description: 'Advanced techniques for designing unique patterns',
    category: 'Design',
    type: 'video',
    difficulty: 'Intermediate',
    estimatedTime: '25 min',
    views: 1567,
    rating: 4.9,
    lastUpdated: '2024-02-08',
    tags: ['patterns', 'custom', 'advanced'],
    icon: Settings
  },
  {
    id: 'image-processing',
    title: 'Working with Images and Textures',
    description: 'How to use images to generate perforation patterns',
    category: 'Design',
    type: 'tutorial',
    difficulty: 'Intermediate',
    estimatedTime: '20 min',
    views: 1234,
    rating: 4.6,
    lastUpdated: '2024-02-05',
    tags: ['images', 'textures', 'generation'],
    icon: Image
  },
  {
    id: 'export-formats',
    title: 'Exporting Your Designs',
    description: 'Guide to different export formats and their uses',
    category: 'Export',
    type: 'article',
    difficulty: 'Beginner',
    estimatedTime: '8 min',
    views: 2100,
    rating: 4.5,
    lastUpdated: '2024-02-12',
    tags: ['export', 'formats', 'dxf', 'svg'],
    icon: Download
  },
  {
    id: 'troubleshooting',
    title: 'Common Issues and Solutions',
    description: 'Troubleshooting guide for common problems',
    category: 'Troubleshooting',
    type: 'article',
    difficulty: 'Beginner',
    estimatedTime: '12 min',
    views: 1678,
    rating: 4.4,
    lastUpdated: '2024-02-14',
    tags: ['troubleshooting', 'issues', 'solutions'],
    icon: HelpCircle
  }
];

const categories = ['All', 'Getting Started', 'Interface', 'Design', 'Export', 'Troubleshooting'];
const types = ['All', 'article', 'video', 'tutorial'];

const quickLinks = [
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video guides',
    icon: Video,
    link: '#videos',
    count: '12 videos'
  },
  {
    title: 'Documentation',
    description: 'Complete API and feature docs',
    icon: FileText,
    link: '/docs',
    count: '50+ articles'
  },
  {
    title: 'Community Forum',
    description: 'Get help from the community',
    icon: MessageCircle,
    link: '#forum',
    count: '1.2k members'
  },
  {
    title: 'Contact Support',
    description: 'Direct help from our team',
    icon: Users,
    link: '/contact',
    count: '24h response'
  }
];

export const Help: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesType = selectedType === 'All' || article.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'tutorial': return BookOpen;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'tutorial': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Help &
            <span className="text-primary"> Support</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find answers, learn new techniques, and get the most out of RhinoPerf with our comprehensive help resources.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <Card key={index} className="group hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge variant="outline" className="mb-4">
                    {link.count}
                  </Badge>
                  <Button variant="ghost" className="w-full group-hover:bg-primary/10" asChild>
                    <a href={link.link}>
                      Explore
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-input bg-background px-3 py-2 text-sm rounded-md"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-input bg-background px-3 py-2 text-sm rounded-md"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredArticles.length} of {helpArticles.length} articles
          </p>
        </div>

        {/* Help Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {filteredArticles.map((article) => {
            const Icon = article.icon;
            const TypeIcon = getTypeIcon(article.type);
            
            return (
              <Card key={article.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getTypeColor(article.type)} variant="secondary">
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {article.type}
                        </Badge>
                        <Badge className={getDifficultyColor(article.difficulty)} variant="secondary">
                          {article.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {article.rating}
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {article.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{article.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.estimatedTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {article.views.toLocaleString()} views
                      </div>
                    </div>
                    <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full" variant="outline" asChild>
                    <a href={`#article-${article.id}`}>
                      {article.type === 'video' ? 'Watch Video' : 'Read Article'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or browse all articles.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedType('All');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">
                Still need help?
              </CardTitle>
              <CardDescription className="text-lg">
                Can't find what you're looking for? Our support team is here to help.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/contact">
                  Contact Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#forum">
                  Join Community
                  <MessageCircle className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};