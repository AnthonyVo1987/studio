"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FsmDebugTabContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>FSM Debug Information</CardTitle>
        <CardDescription>
          This tab will display the real-time state, flags, and variables of the Global FSM.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
          <div className="space-y-4">
            <p className="text-muted-foreground">Placeholder content. Full FSM display coming in the next step.</p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
