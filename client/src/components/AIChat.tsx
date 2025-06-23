import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useUserId } from '@/lib/userService';
import { useMutation } from '@tanstack/react-query';
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Sparkles,
  MessageSquare,
  BarChart3,
  FileText,
  Calendar
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AIChat = () => {
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI assistant. I can help you with:\n\n• **Analyze your productivity** - \"How productive was I this week?\"\n• **Generate reports** - \"Create a standup report\"\n• **Answer questions** - \"Show me my GitHub activity\"\n• **Weekly summaries** - \"Generate my weekly report\"\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query }),
      });
      if (!response.ok) throw new Error('Failed to get AI response');
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  });

  const quickActions = [
    {
      label: 'Today\'s Summary',
      icon: <BarChart3 className="w-4 h-4" />,
      query: 'Generate a summary of my activities today'
    },
    {
      label: 'Standup Report',
      icon: <FileText className="w-4 h-4" />,
      query: 'Create a standup report for today'
    },
    {
      label: 'Weekly Analysis',
      icon: <Calendar className="w-4 h-4" />,
      query: 'Analyze my productivity this week'
    },
    {
      label: 'GitHub Activity',
      icon: <MessageSquare className="w-4 h-4" />,
      query: 'Show me my GitHub activity and commits'
    }
  ];

  const handleSend = () => {
    if (!input.trim() || !userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput('');
  };

  const handleQuickAction = (query: string) => {
    if (!userId) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(query);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="h-[700px] flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-purple-500/5 to-blue-500/5 flex-shrink-0">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">AI Assistant</div>
            <div className="text-sm text-muted-foreground font-normal">Ask me anything about your productivity</div>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
            Powered by Groq
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-6 min-h-0">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="justify-start text-xs h-10 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200"
              onClick={() => handleQuickAction(action.query)}
              disabled={chatMutation.isPending}
            >
              <div className="p-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-md mr-2">
                {action.icon}
              </div>
              <span className="truncate font-medium">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div className="space-y-6 p-2 pr-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                {message.type === 'ai' && (
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-auto rounded-br-md'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                  }`}
                >
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.type === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex gap-4 justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your productivity..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={chatMutation.isPending}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || chatMutation.isPending}
            size="icon"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl shadow-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;