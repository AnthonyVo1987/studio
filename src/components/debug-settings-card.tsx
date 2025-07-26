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
        </p>
      </CardContent>
    </Card>
  );
}