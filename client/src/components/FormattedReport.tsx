import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Download, 
  Share, 
  CheckCircle,
  BarChart3,
  FileText,
  Calendar,
  TrendingUp,
  Target,
  AlertTriangle,
  Rocket,
  Clock
} from 'lucide-react';

interface FormattedReportProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  onCopy: () => void;
  onDownload: () => void;
}

const FormattedReport = ({ title, content, icon, color, onCopy, onDownload }: FormattedReportProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse and format the content
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const formattedSections: any[] = [];
    let currentSection: any = null;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return;

      // Check for section headers (lines with emojis or **bold**)
      if (trimmedLine.match(/^(\*\*|🎯|📊|⚡|🚀|⚠️|📈|💻|🤝|📋|🔍)/)) {
        if (currentSection) {
          formattedSections.push(currentSection);
        }
        
        const sectionTitle = trimmedLine.replace(/^\*\*|\*\*$/g, '').trim();
        const emoji = sectionTitle.match(/^(🎯|📊|⚡|🚀|⚠️|📈|💻|🤝|📋|🔍)/)?.[0] || '';
        const title = sectionTitle.replace(/^(🎯|📊|⚡|🚀|⚠️|📈|💻|🤝|📋|🔍)\s*/, '');
        
        currentSection = {
          emoji,
          title,
          items: [],
          type: getSectionType(title)
        };
      } else if (currentSection && trimmedLine.startsWith('-')) {
        // Bullet points
        currentSection.items.push({
          type: 'bullet',
          content: trimmedLine.substring(1).trim()
        });
      } else if (currentSection) {
        // Regular content
        currentSection.items.push({
          type: 'text',
          content: trimmedLine
        });
      } else {
        // Content without section
        if (!currentSection) {
          currentSection = {
            emoji: '📄',
            title: 'Summary',
            items: [],
            type: 'default'
          };
        }
        currentSection.items.push({
          type: 'text',
          content: trimmedLine
        });
      }
    });

    if (currentSection) {
      formattedSections.push(currentSection);
    }

    return formattedSections;
  };

  const getSectionType = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('accomplish') || lowerTitle.includes('achievement')) return 'success';
    if (lowerTitle.includes('blocker') || lowerTitle.includes('concern') || lowerTitle.includes('issue')) return 'warning';
    if (lowerTitle.includes('focus') || lowerTitle.includes('plan') || lowerTitle.includes('next')) return 'info';
    if (lowerTitle.includes('insight') || lowerTitle.includes('pattern')) return 'insight';
    return 'default';
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Target className="w-5 h-5 text-blue-600" />;
      case 'insight': return <TrendingUp className="w-5 h-5 text-purple-600" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSectionBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'insight': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default: return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    }
  };

  const sections = formatContent(content);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader className={`border-b bg-gradient-to-r ${color}/5`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className={`p-3 bg-gradient-to-r ${color} rounded-xl text-white shadow-lg`}>
              {icon}
            </div>
            <div>
              <div className="text-xl font-bold">{title}</div>
              <div className="text-sm text-muted-foreground font-normal flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Generated {new Date().toLocaleString()}
              </div>
            </div>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className={`p-4 rounded-xl border ${getSectionBg(section.type)}`}>
              <div className="flex items-center gap-3 mb-3">
                {getSectionIcon(section.type)}
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {section.emoji && <span className="text-xl">{section.emoji}</span>}
                  {section.title}
                </h3>
              </div>
              
              <div className="space-y-2">
                {section.items.map((item: any, itemIndex: number) => (
                  <div key={itemIndex}>
                    {item.type === 'bullet' ? (
                      <div className="flex items-start gap-2 ml-4">
                        <div className="w-2 h-2 bg-current rounded-full mt-2 flex-shrink-0 opacity-60"></div>
                        <p className="text-sm leading-relaxed">{item.content}</p>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {item.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <Separator className="my-6" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400">
              AI Generated
            </Badge>
            <span>Powered by Groq</span>
          </div>
          <div>
            Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormattedReport;