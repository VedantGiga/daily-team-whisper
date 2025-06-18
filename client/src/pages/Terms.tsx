
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Users, AlertTriangle, Scale } from "lucide-react";
import { Link } from "wouter";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: December 18, 2025</p>
        </div>

        <div className="max-w-4xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                By accessing and using AutoBrief ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                AutoBrief is an AI-powered work summary tool that integrates with your productivity applications to generate automated daily summaries. The service includes:
              </p>
              <ul>
                <li>Integration with third-party productivity tools</li>
                <li>AI-generated daily work summaries</li>
                <li>Email delivery of summaries</li>
                <li>Web dashboard for viewing historical summaries</li>
                <li>Team collaboration features</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <h3>Account Security</h3>
              <ul>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Use strong passwords and enable two-factor authentication when available</li>
              </ul>

              <h3>Acceptable Use</h3>
              <ul>
                <li>Use the service only for legitimate business purposes</li>
                <li>Do not attempt to reverse engineer or compromise the service</li>
                <li>Respect rate limits and usage quotas</li>
                <li>Do not share sensitive or confidential information beyond intended recipients</li>
              </ul>

              <h3>Integration Compliance</h3>
              <ul>
                <li>Ensure you have proper authorization to connect third-party accounts</li>
                <li>Comply with terms of service of integrated platforms</li>
                <li>Respect intellectual property rights of all connected services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Service Availability & Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <h3>Service Availability</h3>
              <p>
                We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance when possible.
              </p>

              <h3>AI Accuracy</h3>
              <p>
                While our AI strives for accuracy, summaries are generated automatically and may contain errors or omissions. Users should review summaries before sharing with teams.
              </p>

              <h3>Third-Party Dependencies</h3>
              <p>
                Our service depends on third-party APIs. Service interruptions may occur due to changes or outages in integrated platforms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <h3>Pricing</h3>
              <p>
                Current pricing is available on our website. Prices may change with 30 days notice to existing subscribers.
              </p>

              <h3>Billing Cycle</h3>
              <p>
                Subscriptions are billed monthly or annually based on your selected plan. Billing occurs on the same day each period.
              </p>

              <h3>Cancellation</h3>
              <p>
                You may cancel your subscription at any time. Service will continue until the end of your current billing period.
              </p>

              <h3>Refunds</h3>
              <p>
                Refunds are provided on a case-by-case basis for service issues. No refunds for partial month usage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                AutoBrief shall not be liable for any indirect, incidental, special, or consequential damages arising from use of the service. Our total liability shall not exceed the amount paid for the service in the preceding 12 months.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                We reserve the right to terminate accounts for violation of these terms, illegal activity, or non-payment. Upon termination, you will lose access to the service and your data may be deleted.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Questions about these terms? Contact us:
              </p>
              <div className="space-y-2">
                <p>Email: legal@autobrief.com</p>
                <p>Address: 123 Tech Street, San Francisco, CA 94105</p>
              </div>
              <Link to="/contact" className="inline-block mt-4">
                <Button>Contact Support</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;
