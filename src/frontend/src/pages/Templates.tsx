import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Eye,
  Star,
  Grid,
  Circle,
  Triangle,
  Hexagon,
  Diamond,
  Heart,
  ArrowRight,
  Clock,
  User
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  preview: string;
  downloads: number;
  rating: number;
  author: string;
  createdAt: string;
  isPremium: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  icon: React.ComponentType<{ className?: string }>;
}

const templates: Template[] = [
  {
    id: 'basic-grid',
    name: 'Basic Grid Pattern',
    description: 'Simple square grid perforation pattern perfect for ventilation panels',
    category: 'Basic',
    tags: ['grid', 'square', 'ventilation', 'basic'],
    preview: '/templates/basic-grid.svg',
    downloads: 1250,
    rating: 4.8,
    author: 'RhinoPerf Team',
    createdAt: '2024-01-15',
    isPremium: false,
    difficulty: 'Beginner',
    estimatedTime: '5 min',
    icon: Grid
  },
  {
    id: 'circular-array',
    name: 'Circular Array',
    description: 'Elegant circular perforation pattern with varying sizes',
    category: 'Decorative',
    tags: ['circle', 'array', 'decorative', 'facade'],
    preview: '/templates/circular-array.svg',
    downloads: 890,
    rating: 4.9,
    author: 'Sarah Chen',
    createdAt: '2024-01-20',
    isPremium: true,
    difficulty: 'Intermediate',
    estimatedTime: '15 min',
    icon: Circle
  },
  {
    id: 'hexagonal-mesh',
    name: 'Hexagonal Mesh',
    description: 'Honeycomb-inspired hexagonal perforation pattern',
    category: 'Geometric',
    tags: ['hexagon', 'mesh', 'honeycomb', 'structural'],
    preview: '/templates/hexagonal-mesh.svg',
    downloads: 675,
    rating: 4.7,
    author: 'Mike Rodriguez',
    createdAt: '2024-01-25',
    isPremium: false,
    difficulty: 'Intermediate',
    estimatedTime: '20 min',
    icon: Hexagon
  },
  {
    id: 'diamond-gradient',
    name: 'Diamond Gradient',
    description: 'Diamond shapes with gradient sizing for artistic facades',
    category: 'Artistic',
    tags: ['diamond', 'gradient', 'artistic', 'facade'],
    preview: '/templates/diamond-gradient.svg',
    downloads: 432,
    rating: 4.6,
    author: 'Emma Thompson',
    createdAt: '2024-02-01',
    isPremium: true,
    difficulty: 'Advanced',
    estimatedTime: '30 min',
    icon: Diamond
  },
  {
    id: 'triangular-pattern',
    name: 'Triangular Pattern',
    description: 'Modern triangular perforation with dynamic spacing',
    category: 'Modern',
    tags: ['triangle', 'modern', 'dynamic', 'contemporary'],
    preview: '/templates/triangular-pattern.svg',
    downloads: 567,
    rating: 4.5,
    author: 'Alex Kim',
    createdAt: '2024-02-05',
    isPremium: false,
    difficulty: 'Intermediate',
    estimatedTime: '18 min',
    icon: Triangle
  },
  {
    id: 'organic-flow',
    name: 'Organic Flow',
    description: 'Nature-inspired flowing perforation pattern',
    category: 'Organic',
    tags: ['organic', 'flow', 'nature', 'biomorphic'],
    preview: '/templates/organic-flow.svg',
    downloads: 298,
    rating: 4.9,
    author: 'Lisa Park',
    createdAt: '2024-02-10',
    isPremium: true,
    difficulty: 'Advanced',
    estimatedTime: '45 min',
    icon: Heart
  }
];

const categories = ['All', 'Basic', 'Decorative', 'Geometric', 'Artistic', 'Modern', 'Organic'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export const Templates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || template.difficulty === selectedDifficulty;
    const matchesPremium = !showPremiumOnly || template.isPremium;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesPremium;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Design
            <span className="text-primary"> Templates</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with professionally designed perforation patterns. Customize and adapt them to your specific needs.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
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

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="border border-input bg-background px-3 py-2 text-sm rounded-md"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'All' ? 'All Levels' : difficulty}
                  </option>
                ))}
              </select>

              {/* Premium Filter */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPremiumOnly}
                  onChange={(e) => setShowPremiumOnly(e.target.checked)}
                  className="rounded"
                />
                Premium only
              </label>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredTemplates.length} of {templates.length} templates
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            
            return (
              <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  {/* Preview Area */}
                  <div className="relative aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      {template.isPremium && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <Badge className={getDifficultyColor(template.difficulty)}>
                        {template.difficulty}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {template.downloads.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {template.rating}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.estimatedTime}
                      </div>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <User className="h-3 w-3" />
                    <span>by {template.author}</span>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full" asChild>
                    <Link to={`/design?template=${template.id}`}>
                      Use Template
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or browse all templates.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedDifficulty('All');
                  setShowPremiumOnly(false);
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
                Can't find what you're looking for?
              </CardTitle>
              <CardDescription className="text-lg">
                Create your own custom perforation pattern from scratch or request a custom template.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/design">
                  Create Custom Design
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">
                  Request Template
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};