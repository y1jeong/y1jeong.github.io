import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Shield, Eye, Lock, Database, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Last updated: December 25, 2024
          </p>
        </div>

        <div className="grid gap-8">
          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-blue-600" />
                Information We Collect
              </CardTitle>
              <CardDescription>
                We collect information to provide better services to our users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li>Name and email address when you create an account</li>
                  <li>Profile information you choose to provide</li>
                  <li>Communication preferences and settings</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Design Data</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li>Images you upload for perforation pattern generation</li>
                  <li>Design files and project data you create</li>
                  <li>Export preferences and settings</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage Information</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li>How you interact with our application</li>
                  <li>Features you use and time spent in the application</li>
                  <li>Error logs and performance data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-green-600" />
                How We Use Your Information
              </CardTitle>
              <CardDescription>
                We use your information to provide, maintain, and improve our services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Service Provision</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Process your design requests</li>
                    <li>Generate perforation patterns</li>
                    <li>Save and manage your projects</li>
                    <li>Provide customer support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Improvement</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Analyze usage patterns</li>
                    <li>Fix bugs and improve performance</li>
                    <li>Develop new features</li>
                    <li>Enhance user experience</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                Data Protection & Security
              </CardTitle>
              <CardDescription>
                We implement industry-standard security measures to protect your data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Technical Safeguards</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Encryption in transit and at rest</li>
                    <li>Secure authentication systems</li>
                    <li>Regular security audits</li>
                    <li>Access controls and monitoring</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Organizational Measures</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Employee training on data protection</li>
                    <li>Limited access to personal data</li>
                    <li>Data retention policies</li>
                    <li>Incident response procedures</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-orange-600" />
                Your Rights & Choices
              </CardTitle>
              <CardDescription>
                You have control over your personal information and how it's used.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Access & Control</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Access your personal data</li>
                    <li>Update or correct information</li>
                    <li>Download your data</li>
                    <li>Delete your account</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Communication Preferences</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Opt out of marketing emails</li>
                    <li>Manage notification settings</li>
                    <li>Control data sharing preferences</li>
                    <li>Request data portability</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>Data Sharing & Third Parties</CardTitle>
              <CardDescription>
                We do not sell your personal information. We may share data in limited circumstances.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Service Providers</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  We may share information with trusted service providers who help us operate our service:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li>Cloud hosting and storage providers</li>
                  <li>Analytics and performance monitoring</li>
                  <li>Customer support tools</li>
                  <li>Payment processing (if applicable)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Legal Requirements</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  We may disclose information when required by law, to protect our rights, or to ensure the safety of our users.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                Contact Us
              </CardTitle>
              <CardDescription>
                Questions about this privacy policy? We're here to help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Privacy Officer</h4>
                  <div className="space-y-2 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>privacy@rhinoperforated.com</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>+1 (555) 123-4567</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Time</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    We typically respond to privacy inquiries within 30 days. For urgent matters, please call our support line.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild>
                    <Link to="/contact">Contact Support</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/settings">Manage Privacy Settings</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
              <CardDescription>
                We may update this privacy policy from time to time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                When we make changes to this privacy policy, we will notify you by email and update the "Last updated" date at the top of this page. 
                We encourage you to review this policy periodically to stay informed about how we protect your information.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> By continuing to use our service after policy updates, you agree to the revised terms.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}