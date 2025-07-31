import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import {
  PenTool,
  Image,
  Download,
  Zap,
  Shield,
  Users,
  Settings,
  FileText,
  Layers,
  Grid,
  Palette,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: PenTool,
    title: 'Intuitive Design Tools',
    description: 'Create complex perforated patterns with our easy-to-use visual editor.',
    details: [
      'Drag-and-drop interface',
      'Real-time parameter adjustment',
      'Visual feedback and previews',
      'Keyboard shortcuts for efficiency'
    ]
  },
  {
    icon: Image,
    title: 'Image-Based Patterns',
    description: 'Upload images and automatically generate perforated patterns based on image analysis.',
    details: [
      'Automatic grayscale conversion',
      'Brightness-based perforation mapping',
      'Histogram analysis tools',
      'Threshold and inversion controls'
    ]
  },
  {
    icon: Download,
    title: 'Multiple Export Formats',
    description: 'Export your designs in DXF, PDF, SVG, and other industry-standard formats.',
    details: [
      'DXF for CNC machining',
      'SVG for vector graphics',
      'PDF for documentation',
      'PNG for presentations'
    ]
  },
  {
    icon: Zap,
    title: 'Real-time Preview',
    description: 'See your changes instantly with our high-performance rendering engine.',
    details: [
      'Viewport culling optimization',
      'Smooth zoom and pan',
      'Performance monitoring',
      'Responsive canvas rendering'
    ]
  },
  {
    icon: Grid,
    title: 'Pattern Distributions',
    description: 'Choose from various perforation distribution patterns.',
    details: [
      'Grid patterns',
      'Staggered arrangements',
      'Random distributions',
      'Radial patterns'
    ]
  },
  {
    icon: Settings,
    title: 'Customizable Parameters',
    description: 'Fine-tune every aspect of your perforation design.',
    details: [
      'Size and spacing controls',
      'Rotation and alignment',
      'Density adjustments',
      'Snap-to-grid functionality'
    ]
  },
  {
    icon: Layers,
    title: 'Shape Variety',
    description: 'Create perforations in multiple shapes and styles.',
    details: [
      'Circles and squares',
      'Triangles and hexagons',
      'Stars and custom shapes',
      'Variable sizing options'
    ]
  },
  {
    icon: Palette,
    title: 'Material Support',
    description: 'Design for various materials with appropriate settings.',
    details: [
      'Metal panels',
      'Wood and composites',
      'Acrylic and plastics',
      'Custom material properties'
    ]
  },
  {
    icon: Shield,
    title: 'Professional Grade',
    description: 'Built for architects and designers with precision and reliability in mind.',
    details: [
      'High-precision calculations',
      'Industry-standard outputs',
      'Reliable performance',
      'Professional workflows'
    ]
  },
  {
    icon: Users,
    title: 'Collaboration Ready',
    description: 'Share designs with your team and collaborate on projects seamlessly.',
    details: [
      'Design sharing',
      'Version control',
      'Team workspaces',
      'Export collaboration'
    ]
  },
  {
    icon: FileText,
    title: 'Design Management',
    description: 'Organize and manage your design library efficiently.',
    details: [
      'Design gallery',
      'Search and filtering',
      'Tags and categories',
      'Version history'
    ]
  },
  {
    icon: Zap,
    title: 'Performance Optimized',
    description: 'Handle large and complex designs with ease.',
    details: [
      'Efficient rendering',
      'Memory optimization',
      'Background processing',
      'Responsive interface'
    ]
  }
];

export const Features: React.FC = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Powerful Features for
            <span className="text-primary"> Professional Design</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to create stunning perforated wall patterns,
            from concept to fabrication-ready files.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">
                Ready to Start Designing?
              </CardTitle>
              <CardDescription className="text-lg">
                Join thousands of architects and designers creating beautiful perforated walls.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/design">
                  Try Demo
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};