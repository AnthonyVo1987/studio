
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StagingOptionsProvider, useStagingOptions, type OptionType, type StrikeCount, type TableDisplayType } from '@/contexts/staging-options-context';
import { getOptionsExpirationsAction } from '@/actions/get-options-expirations-action';
import { getOptionsChainForExpirationAction } from '@/actions/get-options-chain-for-expiration-action';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { OptionsChainTable } from './options-chain-table';
import { Textarea } from './ui/textarea';

function StagingOptionsControls() {
    const { 
        ticker, setTicker,
        expirationDates, setExpirationDates,
        selectedExpiration, setSelectedExpiration,
        optionType, setOptionType,
        strikeCount, setStrikeCount,
        tableDisplayType, setTableDisplayType,
        setOptionsChainJson, setRequestJson,
        isLoadingExpirations, setIsLoadingExpirations,
        isLoadingOptions, setIsLoadingOptions,
        setError,
    } = useStagingOptions();
    const { toast } = useToast();

    const handleFetchExpirations = async () => {
        if (!ticker) {
            toast({ variant: 'destructive', title: 'Invalid Ticker', description: 'Please enter a ticker symbol.' });
            return;
        }
        setIsLoadingExpirations(true);
        setError(null);
        setExpirationDates([]);
        setSelectedExpiration(undefined);
        setOptionsChainJson('{}');
        setRequestJson('{}');

        const result = await getOptionsExpirationsAction({ ticker });

        if (result.status === 'success' && result.data) {
            setExpirationDates(result.data.expirationDates);
            toast({ title: 'Success', description: `Found ${result.data.expirationDates.length} expiration dates for ${ticker}.` });
        } else {
            setError(result.error || 'Failed to fetch expiration dates.');
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'An unknown error occurred.' });
        }
        setIsLoadingExpirations(false);
    };
    
    const handleFetchOptionsChain = async () => {
        if (!ticker || !selectedExpiration) {
             toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please select a ticker and an expiration date.' });
            return;
        }
        setIsLoadingOptions(true);
        setError(null);
        setOptionsChainJson('{ "status": "pending..." }');
        
        const requestPayload = { ticker, expirationDate: selectedExpiration, optionType, strikeCount };
        setRequestJson(JSON.stringify(requestPayload, null, 2));
        
        const result = await getOptionsChainForExpirationAction(requestPayload);
        
        if (result.status === 'success' && result.data) {
            setOptionsChainJson(result.data.optionsChainJson);
            toast({ title: 'Success', description: `Fetched options chain for ${ticker} expiring ${selectedExpiration}.` });
        } else {
            const errorJson = JSON.stringify({ error: result.error || 'Failed to fetch options chain.' }, null, 2);
            setOptionsChainJson(errorJson);
            setError(result.error || 'Failed to fetch options chain.');
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'An unknown error occurred.' });
        }
        setIsLoadingOptions(false);
    };

    const isOverallLoading = isLoadingExpirations || isLoadingOptions;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="staging-ticker">Ticker</Label>
                    <Input id="staging-ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="e.g., NVDA" disabled={isOverallLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="staging-expirations">Select Expiration</Label>
                    <Select value={selectedExpiration || ''} onValueChange={(value) => setSelectedExpiration(value)} disabled={expirationDates.length === 0 || isOverallLoading}>
                        <SelectTrigger id="staging-expirations">
                            <SelectValue placeholder="Select a date" />
                        </SelectTrigger>
                        <SelectContent>
                            {expirationDates.map(date => (
                                <SelectItem key={date} value={date}>{date}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="staging-option-type">Option Type</Label>
                    <Select value={optionType} onValueChange={(value) => setOptionType(value as OptionType)} disabled={isOverallLoading}>
                        <SelectTrigger id="staging-option-type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="both">Both</SelectItem>
                            <SelectItem value="calls">Calls Only</SelectItem>
                            <SelectItem value="puts">Puts Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="staging-strike-count">Strike Count</Label>
                    <Select value={String(strikeCount)} onValueChange={(value) => setStrikeCount(Number(value) as StrikeCount)} disabled={isOverallLoading}>
                        <SelectTrigger id="staging-strike-count">
                            <SelectValue placeholder="Select count" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="20">20 Strikes</SelectItem>
                            <SelectItem value="30">30 Strikes</SelectItem>
                            <SelectItem value="40">40 Strikes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="staging-table-display">Table Display</Label>
                    <Select value={tableDisplayType} onValueChange={(value) => setTableDisplayType(value as TableDisplayType)} disabled={isOverallLoading}>
                        <SelectTrigger id="staging-table-display">
                            <SelectValue placeholder="Select display" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="side-by-side">Side-by-Side</SelectItem>
                            <SelectItem value="top-bottom">Top/Bottom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="flex gap-2 pt-2">
                <Button onClick={handleFetchExpirations} disabled={!ticker || isOverallLoading} className="w-auto">
                    {isLoadingExpirations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Fetch Expirations
                </Button>
                <Button onClick={handleFetchOptionsChain} disabled={!selectedExpiration || isOverallLoading} className="w-auto">
                     {isLoadingOptions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Get Options
                </Button>
            </div>
        </div>
    );
}

function JsonDisplayArea({ title, jsonContent }: { title: string, jsonContent: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <Textarea
        readOnly
        value={jsonContent}
        className="h-48 font-code text-xs bg-muted/30"
        placeholder={`{ "status": "no_data" }`}
      />
    </div>
  );
}

function StagingOptionsDataDisplay() {
    const { optionsChainJson, requestJson, error, optionType, tableDisplayType } = useStagingOptions();

    return (
        <div className="space-y-6 mt-6">
            {error && (
                <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                    <h4 className="font-semibold">An Error Occurred</h4>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <JsonDisplayArea title="Request JSON" jsonContent={requestJson} />
                <JsonDisplayArea title="Response JSON" jsonContent={optionsChainJson} />
            </div>
            <OptionsChainTable dataSourceJson={optionsChainJson} snapshotDataSourceJson="{}" optionType={optionType} tableDisplayType={tableDisplayType} />
        </div>
    );
}

export function StagingOptionsTabContent() {
    return (
        <StagingOptionsProvider>
            <Card>
                <CardHeader>
                    <CardTitle>Staging: Selectable Options Expiration</CardTitle>
                    <CardDescription>
                        This area is for building and testing the new selectable options expiration feature in isolation from the main application pipeline.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StagingOptionsControls />
                    <Separator className="my-6" />
                    <StagingOptionsDataDisplay />
                </CardContent>
            </Card>
        </StagingOptionsProvider>
    );
}
