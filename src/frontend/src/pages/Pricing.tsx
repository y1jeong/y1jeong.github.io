import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import {
  Check,
  X,
  Star,
  Zap,
  ArrowRight,
  Users,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limitations: string[];
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  buttonText: string;
  buttonVariant: 'default' | 'outline';
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started and small projects',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Basic perforation patterns',
      'Up to 3 designs per month',
      'SVG and PNG export',
      'Standard shapes (circle, square)',
      'Community support',
      'Basic image processing'
    ],
    limitations: [
      'Limited to 1000 perforations per design',
      'No DXF export',
      'No advanced patterns',
      'No collaboration features'
    ],
    icon: Star,
    buttonText: 'Get Started',
    buttonVariant: 'outline'
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For architects and designers who need more power',
    price: { monthly: 29, yearly: 290 },
    features: [
      'All Free features',
      'Unlimited designs',
      'All export formats (DXF, PDF, SVG, PNG)',
      'Advanced shapes and patterns',
      'Image-based pattern generation',
      'Priority email support',
      'Advanced parameter controls',
      'Design templates library',
      'Batch export capabilities'
    ],
    limitations: [
      'Up to 10,000 perforations per design',
      'Single user license'
    ],
    popular: true,
    icon: Zap,
    buttonText: 'Start Free Trial',
    buttonVariant: 'default'
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For teams and small studios',
    price: { monthly: 79, yearly: 790 },
    features: [
      'All Professional features',
      'Up to 5 team members',
      'Unlimited perforations',
      'Team collaboration tools',
      'Shared design library',
      'Version control',
      'Priority support',
      'Custom material presets',
      'API access (beta)'
    ],
    limitations: [
      'Up to 5 users',
      'Standard support response time'
    ],
    icon: Users,
    buttonText: 'Start Team Trial',
    buttonVariant: 'outline'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: { monthly: 199, yearly: 1990 },
    features: [
      'All Team features',
      'Unlimited team members',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom training sessions',
      'On-premise deployment option',
      'Advanced security features',
      'Custom export formats',
      'SLA guarantee'
    ],
    limitations: [],
    icon: Building,
    buttonText: 'Contact Sales',
    buttonVariant: 'outline'
  }
];

const faqs = [
  {
    question: 'Can I change plans at any time?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.'
  },
  {
    question: 'What export formats are supported?',
    answer: 'We support DXF (for CNC machining), SVG (vector graphics), PDF (documentation), and PNG (raster images). Free plans include SVG and PNG, while paid plans include all formats.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Professional and Team plans come with a 14-day free trial. No credit card required to start.'
  },
  {
    question: 'How does team collaboration work?',
    answer: 'Team plans allow multiple users to share designs, collaborate in real-time, and maintain version control. Each team member gets their own account with shared access to team resources.'
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'Free plans include community support, Professional plans get priority email support, Team plans get priority support with faster response times, and Enterprise plans include 24/7 phone support.'
  },
  {
    question: 'Can I use this for commercial projects?',
    answer: 'Yes! All paid plans include commercial usage rights. You can use the generated designs for any commercial purpose, including client work and product manufacturing.'
  }
];

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Simple, Transparent
            <span className="text-primary"> Pricing</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the plan that fits your needs. Start free and upgrade as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={cn('text-sm', !isYearly ? 'text-foreground' : 'text-muted-foreground')}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isYearly ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className={cn('text-sm', isYearly ? 'text-foreground' : 'text-muted-foreground')}>
              Yearly
              <span className="ml-1 text-xs text-green-600 font-medium">(Save 17%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
            const savings = isYearly && plan.price.monthly > 0 
              ? Math.round(((plan.price.monthly * 12 - plan.price.yearly) / (plan.price.monthly * 12)) * 100)
              : 0;

            return (
              <Card 
                key={plan.id} 
                className={cn(
                  'relative h-full',
                  plan.popular && 'border-primary shadow-lg scale-105'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      'p-3 rounded-lg',
                      plan.popular ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <Icon className={cn(
                        'h-8 w-8',
                        plan.popular ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        ${price}
                      </span>
                      {plan.price.monthly > 0 && (
                        <span className="text-muted-foreground ml-1">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {isYearly && savings > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Save {savings}% annually
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-3">What's included:</h4>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="font-semibold mb-3 text-muted-foreground">Limitations:</h4>
                        <ul className="space-y-2 mb-6">
                          {plan.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start text-sm text-muted-foreground">
                              <X className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    variant={plan.buttonVariant}
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link to={plan.id === 'enterprise' ? '/contact' : '/auth/register'}>
                      {plan.buttonText}
                      {plan.id !== 'enterprise' && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    <div className={cn(
                      'transform transition-transform',
                      openFaq === index ? 'rotate-180' : ''
                    )}>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">
                Still have questions?
              </CardTitle>
              <CardDescription className="text-lg">
                Our team is here to help you choose the right plan for your needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" asChild>
                <Link to="/contact">
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};