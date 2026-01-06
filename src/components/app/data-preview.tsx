import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerationResult } from "@/lib/types";
import { useMemo } from "react";

interface Props {
  data: GenerationResult["data"];
}

const JsonNode = ({ data }: { data: any }) => {
  if (typeof data === 'object' && data !== null) {
    return (
      <details className="pl-4 border-l" open>
        <summary className="cursor-pointer">{Array.isArray(data) ? `Array (${data.length} items)` : 'Object'}</summary>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="pl-4 border-l">
            <strong>{key}:</strong>
            <JsonNode data={value} />
          </div>
        ))}
      </details>
    );
  } else {
    return <span className="pl-2">{String(data)}</span>;
  }
};

export const DataPreview = ({ data }: Props) => {
  const previewData = useMemo(() => {
    if (Array.isArray(data)) {
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 10);
    }
    return data;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Preview (10 random samples)</CardTitle>
      </CardHeader>
      <CardContent>
        <JsonNode data={previewData} />
      </CardContent>
    </Card>
  );
};
