
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RawDebugChatbot } from "@/components/raw-debug-chatbot";
import { SdkDebugChatbot } from "@/components/sdk-debug-chatbot";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

export function StagingTabContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Staging Area</CardTitle>
                <CardDescription>
                    This area is for staging and testing experimental features that are isolated from the main application flow.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Genkit Raw AI Prompt Diagnostics</CardTitle>
                                <CardDescription>
                                These buttons trigger raw, non-cached, dependency-free calls directly to the AI backend via the Genkit wrapper to help diagnose fundamental API connectivity or prompt issues. They are fully isolated from the application's FSM and data states.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <RawDebugChatbot
                                    title="Genkit Raw App Data Debug"
                                    description="Tests a non-grounded prompt with a structured JSON output schema."
                                    promptType="app-data"
                                />
                                <RawDebugChatbot
                                    title="Genkit Raw Web Search Debug"
                                    description="Tests a grounded prompt that uses the Google Search tool."
                                    promptType="web-search"
                                />
                            </CardContent>
                        </Card>
                        
                        <Separator />
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Google GenAI SDK Direct Diagnostics</CardTitle>
                                <CardDescription>
                                These buttons bypass Genkit entirely and use the low-level Google GenAI SDK to make direct API calls. This helps determine if an issue lies within the Genkit abstraction layer.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <SdkDebugChatbot
                                    title="SDK Direct App Data Debug"
                                    description="Tests a non-grounded prompt using the SDK."
                                    promptType="sdk-app-data"
                                />
                                <SdkDebugChatbot
                                    title="SDK Direct Web Search Debug"
                                    description="Tests a grounded prompt using the SDK."
                                    promptType="sdk-web-search"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
