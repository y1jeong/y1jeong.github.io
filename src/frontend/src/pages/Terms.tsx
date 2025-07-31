import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, FileText, Scale, AlertTriangle, Shield, Users, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Terms() {
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
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Please read these terms carefully before using our service.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Last updated: December 25, 2024
          </p>
        </div>

        <div className="grid gap-8">
          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Acceptance of Terms
              </CardTitle>
              <CardDescription>
                By using our service, you agree to be bound by these terms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                By accessing and using RhinoPerforatedWall ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Important:</strong> These terms constitute a legally binding agreement between you and RhinoPerforatedWall.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Service Description
              </CardTitle>
              <CardDescription>
                Understanding what our service provides and its intended use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">What We Provide</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li>Web-based perforation pattern generation tools</li>
                  <li>Image processing and halftone analysis capabilities</li>
                  <li>Design export functionality (DXF, SVG, PDF formats)</li>
                  <li>User account management and design storage</li>
                  <li>Real-time preview and editing tools</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Intended Use</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Our service is designed for creating perforated panel designs for architectural, industrial, and artistic applications. 
                  The generated patterns are intended for use with CNC machines, laser cutters, and other fabrication equipment.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                User Responsibilities
              </CardTitle>
              <CardDescription>
                Your obligations when using our service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Account Security</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Maintain confidentiality of login credentials</li>
                    <li>Notify us immediately of unauthorized access</li>
                    <li>Use strong, unique passwords</li>
                    <li>Log out from shared devices</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Acceptable Use</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Use service for lawful purposes only</li>
                    <li>Respect intellectual property rights</li>
                    <li>Do not upload malicious content</li>
                    <li>Follow community guidelines</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Content Guidelines</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  When uploading images or creating content, you must ensure:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li>You own the rights to uploaded images or have permission to use them</li>
                  <li>Content does not violate any laws or regulations</li>
                  <li>Images do not contain personal information of others</li>
                  <li>Content is appropriate for a professional environment</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Prohibited Activities
              </CardTitle>
              <CardDescription>
                Activities that are not permitted when using our service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Technical Misuse</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Attempting to hack or breach security</li>
                    <li>Reverse engineering the service</li>
                    <li>Automated scraping or data extraction</li>
                    <li>Overloading servers or infrastructure</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Content Violations</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Uploading copyrighted material without permission</li>
                    <li>Sharing inappropriate or offensive content</li>
                    <li>Distributing malware or viruses</li>
                    <li>Impersonating others or providing false information</li>
                  </ul>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Warning:</strong> Violation of these terms may result in immediate account suspension or termination.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="h-5 w-5 mr-2 text-indigo-600" />
                Intellectual Property
              </CardTitle>
              <CardDescription>
                Rights and ownership of content and designs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Your Content</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  You retain ownership of any images, designs, or content you upload to our service. However, by using our service, you grant us:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li>License to process and store your content for service provision</li>
                  <li>Right to create derivative works (perforation patterns) from your images</li>
                  <li>Permission to use anonymized data for service improvement</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Our Service</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  The RhinoPerforatedWall service, including its software, algorithms, user interface, and documentation, 
                  is protected by copyright and other intellectual property laws. You may not copy, modify, or distribute our service.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Generated Designs</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Perforation patterns and designs generated using our service are owned by you. You are free to use them for any lawful purpose, 
                  including commercial applications.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimers and Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gavel className="h-5 w-5 mr-2 text-orange-600" />
                Disclaimers & Limitations
              </CardTitle>
              <CardDescription>
                Important limitations on our liability and service guarantees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Service Availability</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                  The service is provided "as is" without warranties of any kind.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Design Accuracy</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  While we aim for accuracy in pattern generation, you are responsible for verifying that generated designs 
                  meet your specific requirements before fabrication.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Limitation of Liability</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Our liability is limited to the amount you paid for the service in the 12 months preceding any claim. 
                  We are not liable for indirect, incidental, or consequential damages.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Account Termination</CardTitle>
              <CardDescription>
                Conditions under which accounts may be terminated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">By You</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Delete your account at any time</li>
                    <li>Download your data before deletion</li>
                    <li>30-day grace period for data recovery</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">By Us</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Violation of terms of service</li>
                    <li>Illegal or harmful activities</li>
                    <li>Extended period of inactivity</li>
                  </ul>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Data Retention:</strong> After account termination, we may retain some data as required by law or for legitimate business purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to These Terms</CardTitle>
              <CardDescription>
                How we handle updates to our terms of service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may update these terms from time to time. When we make significant changes, we will notify you by email 
                and update the "Last updated" date. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/privacy">Privacy Policy</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}