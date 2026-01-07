
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from 'lucide-react';

interface AnalysisInsightsProps {
  insights: string[];
}

export const AnalysisInsights: React.FC<AnalysisInsightsProps> = ({ insights }) => {
  if (insights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          Smart Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
