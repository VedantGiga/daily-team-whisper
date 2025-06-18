import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Sparkles, RefreshCw, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { sendEmailVerification } from 'firebase/auth';
import { toast } from 'react-hot-toast';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();

  const handleResendVerification = async () => {
    if (!currentUser) return;

    try {
      setError('');
      setLoading(true);
      await sendEmailVerification(currentUser);
      toast.success('Verification email sent!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AutoBrief
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
          <p className="text-muted-foreground">We've sent a verification link to your email address</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to{' '}
              <strong className="text-foreground">{currentUser?.email}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Next steps:
              </h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return to this page and refresh</li>
                <li>You'll be automatically redirected to your dashboard</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend verification email
                  </>
                )}
              </Button>

              <Button 
                onClick={() => window.location.reload()}
                className="w-full gradient-primary text-white"
              >
                I've verified my email
              </Button>
            </div>

            <div className="text-center text-sm space-y-2">
              <p className="text-muted-foreground">
                Wrong email address?
              </p>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="text-purple-600 hover:text-purple-700 p-0 h-auto font-medium"
              >
                Sign out and create a new account
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Need help? </span>
              <Link 
                to="/contact" 
                className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
              >
                Contact support
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;