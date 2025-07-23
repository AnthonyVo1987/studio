'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function DebugSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Log Settings</CardTitle>
        <CardDescription>
          Debug logging has been consolidated to use browser console directly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Debug logs are now written directly to the browser console. Open Developer Tools (F12) and check the Console tab to view application logs.
        </p>
      </CardContent>
    </Card>
  );
}