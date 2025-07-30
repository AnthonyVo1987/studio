/**
 * Unified Logging Demo
 * v4.4.2.8 - Demonstrates the unified server/client logging system
 * 
 * This is a demo component showing how to use the logging system.
 * It can be removed after testing.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useServerLogs } from '@/lib/client-log-handler';
import { withServerLogging } from '@/lib/server-action-logging-wrapper';

// Example server action
async function demoServerAction(input: { message: string }) {
  'use server';
  
  console.log('[DemoAction] Starting with input:', input);
  console.info('[DemoAction] Processing message...');
  
  // Simulate some work with various log levels
  await new Promise(resolve => setTimeout(resolve, 100));
  console.warn('[DemoAction] This is a warning example');
  
  // Example with sensitive data that should be sanitized
  console.log('[DemoAction] API call with key:', 'api_key=secret123456');
  console.log('[DemoAction] User email:', 'user@example.com');
  
  console.log('[DemoAction] Complete!');
  
  return {
    status: 'success' as const,
    data: {
      processed: input.message.toUpperCase(),
      timestamp: new Date().toISOString(),
    },
  };
}

// Wrap the action with logging
const demoServerActionWithLogging = withServerLogging(demoServerAction);

export function UnifiedLoggingDemo() {
  const { processLogs } = useServerLogs({
    prefix: '[Demo Server]',
    groupLogs: true,
    collapseGroups: false, // Expand groups for demo
  });
  
  const handleTestLogging = async () => {
    console.log('[Client] Starting test...');
    
    const result = await demoServerActionWithLogging({
      message: 'Hello from client!',
    });
    
    // Process server logs
    processLogs(result);
    
    console.log('[Client] Result received:', result);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unified Logging Demo</CardTitle>
        <CardDescription>
          Test the server/client logging system. Open your browser console to see the logs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleTestLogging}>
          Test Server Logging
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          When you click the button, server-side console logs will appear in your browser console.
        </p>
      </CardContent>
    </Card>
  );
}