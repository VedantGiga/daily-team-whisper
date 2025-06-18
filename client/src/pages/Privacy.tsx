
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";
import { Link } from "wouter";

const Privacy = () => {
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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: December 18, 2025</p>
        </div>

        <div className="max-w-4xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Privacy Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                At AutoBrief, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our AI-powered work summary service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <h3>Account Information</h3>
              <ul>
                <li>Email address and name for account creation</li>
                <li>Authentication credentials (encrypted)</li>
                <li>Profile preferences and settings</li>
              </ul>

              <h3>Integration Data</h3>
              <ul>
                <li>GitHub: Commit messages, pull requests, and repository activity</li>
                <li>Slack: Message summaries and channel activity (not message content)</li>
                <li>Calendar: Meeting titles, duration, and attendees</li>
                <li>Jira/Notion: Task titles, status updates, and project information</li>
              </ul>

              <h3>Usage Data</h3>
              <ul>
                <li>Service usage patterns and feature interactions</li>
                <li>Error logs and performance metrics</li>
                <li>Device and browser information</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <ul>
                <li><strong>AI Summary Generation:</strong> To create personalized daily work summaries</li>
                <li><strong>Service Improvement:</strong> To enhance our AI algorithms and user experience</li>
                <li><strong>Communication:</strong> To send you summaries and important service updates</li>
                <li><strong>Security:</strong> To protect against fraud and ensure account security</li>
                <li><strong>Compliance:</strong> To meet legal and regulatory requirements</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Data Security & Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <h3>Encryption</h3>
              <p>All data is encrypted in transit and at rest using industry-standard encryption protocols.</p>

              <h3>Access Controls</h3>
              <p>Strict access controls ensure only authorized personnel can access your data for service operations.</p>

              <h3>Data Minimization</h3>
              <p>We only collect and process the minimum data necessary to provide our services.</p>

              <h3>Third-Party Security</h3>
              <p>We use OAuth 2.0 for secure integration with third-party services and never store your passwords.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>You have the right to:</p>
              <ul>
                <li>Access and download your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of non-essential communications</li>
                <li>Data portability to other services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="space-y-2">
                <p>Email: privacy@autobrief.com</p>
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

export default Privacy;
