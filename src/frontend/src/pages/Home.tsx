import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

import { useAuth } from '@/contexts/AuthContext';
import {
  PenTool,
  Image,
  Download,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Play,
  Star
} from 'lucide-react';

const features = [
  {
    icon: PenTool,
    title: 'Intuitive Design Tools',
    description: 'Create complex perforated patterns with our easy-to-use visual editor.'
  },
  {
    icon: Image,
    title: 'Image-Based Patterns',
    description: 'Upload images and automatically generate perforated patterns based on image analysis.'
  },
  {
    icon: Download,
    title: 'Multiple Export Formats',
    description: 'Export your designs in DXF, PDF, SVG, and other industry-standard formats.'
  },
  {
    icon: Zap,
    title: 'Real-time Preview',
    description: 'See your changes instantly with our high-performance rendering engine.'
  },
  {
    icon: Shield,
    title: 'Professional Grade',
    description: 'Built for architects and designers with precision and reliability in mind.'
  },
  {
    icon: Users,
    title: 'Collaboration Ready',
    description: 'Share designs with your team and collaborate on projects seamlessly.'
  }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Architect at Studio XYZ',
    content: 'This tool has revolutionized how we approach perforated wall designs. The precision and ease of use are unmatched.',
    rating: 5
  },
  {
    name: 'Michael Rodriguez',
    role: 'Design Engineer',
    content: 'The image-to-pattern feature saved us weeks of manual work. Absolutely incredible!',
    rating: 5
  },
  {
    name: 'Emily Johnson',
    role: 'Interior Designer',
    content: 'Beautiful interface, powerful features, and excellent export options. Everything we needed in one place.',
    rating: 5
  }
];

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/design');
    } else {
      navigate('/auth/register');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <img src="/logo.jpg" alt="Wight Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Design Perfect
              <span className="text-primary"> Perforated Walls</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Professional-grade tool for creating stunning perforated wall patterns.
              From concept to fabrication-ready files in minutes.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" onClick={handleGetStarted}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to create amazing designs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful tools designed specifically for perforated wall design workflows.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to start designing?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join thousands of architects and designers who trust our platform.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleGetStarted}
              >
                Start Free Trial
              </Button>
              <Link
                to="/gallery"
                className="text-sm font-semibold leading-6 text-primary-foreground hover:text-primary-foreground/80"
              >
                View Gallery <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by professionals
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what our users have to say about their experience.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-sm leading-6">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="mt-4">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">10,000+</div>
              <div className="mt-2 text-sm text-muted-foreground">Designs Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="mt-2 text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="mt-2 text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};