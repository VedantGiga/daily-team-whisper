import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { 
  HelpCircle, 
  MessageSquare, 
  Book, 
  Mail, 
  ExternalLink,
  Search,
  Send
} from 'lucide-react';

const Support = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    message: '',
    email: ''
  });

  const faqs = [
    {
      question: "How do I connect my GitHub account?",
      answer: "Go to the Integrations page, click on GitHub, and follow the OAuth flow to connect your account. Make sure you grant the necessary permissions for AutoBrief to access your repositories and activity."
    },
    {
      question: "Why aren't my activities showing up?",
      answer: "Make sure your integrations are properly connected and try syncing manually. Activities may take a few minutes to appear after connecting a new service. Check that you have recent activity in the connected services."
    },
    {
      question: "How often are daily summaries sent?",
      answer: "Daily summaries are sent at 8 PM by default. You can change this time in your Settings page under Notifications. Summaries are only sent if you have activity data for that day."
    },
    {
      question: "Can I export my data?",
      answer: "Yes! Go to Settings > Privacy & Security and click 'Export My Data'. You'll receive a download link with all your activity data, summaries, and account information in JSON format."
    },
    {
      question: "How do I customize my dashboard?",
      answer: "On the Dashboard page, click the 'Customize' tab. You can drag and drop widgets to reorder them, resize widgets, and collapse widgets you don't need. Your layout is automatically saved."
    },
    {
      question: "What integrations are supported?",
      answer: "Currently we support GitHub, Google Calendar, Slack, Jira, and Notion. More integrations are being added regularly. Check the Integrations page for the latest available services."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "We'll get back to you within 24 hours.",
    });
    setContactForm({ subject: '', category: '', message: '', email: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Support Center</h1>
          <p className="text-muted-foreground">Get help and find answers to common questions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Links */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/docs" target="_blank">
                  <Book className="h-4 w-4 mr-2" />
                  Documentation
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:support@autobrief.dev">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://discord.gg/autobrief" target="_blank">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Community Discord
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              {filteredFaqs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No FAQs match your search</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Can't find what you're looking for? Send us a message and we'll help you out.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={contactForm.category} onValueChange={(value) => setContactForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="integration">Integration Issue</SelectItem>
                      <SelectItem value="account">Account Problem</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please provide as much detail as possible..."
                  className="min-h-[120px]"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full md:w-auto">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">API Status</p>
                  <p className="text-sm text-muted-foreground">Operational</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Integrations</p>
                  <p className="text-sm text-muted-foreground">All systems operational</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Email Delivery</p>
                  <p className="text-sm text-muted-foreground">Normal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;