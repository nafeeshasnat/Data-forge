"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BotMessageSquare } from "lucide-react";

interface AiInsightsProps {
  insights: string;
  isLoading: boolean;
}

export function AiInsights({ insights, isLoading }: AiInsightsProps) {
  return (
    <Card className="bg-accent/50 border-accent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BotMessageSquare className="text-primary h-4 w-4" />
                AI Tendency Insights
            </CardTitle>
        </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm text-accent-foreground pt-2">
            {insights}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
