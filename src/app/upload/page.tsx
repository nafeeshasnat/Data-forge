import * as React from 'react';
import { processUploadedData } from '@/app/actions';
import type { GenerationResult, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Dashboard } from '@/components/app/dashboard';
import { Logo } from '@/components/app/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UploadCloud, FileJson } from 'lucide-react';

export default function UploadPage() {
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a valid JSON file.',
      });
      return;
    }

    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as Student[];
        const analysisResult = await processUploadedData(data);
        setResult(analysisResult);
        toast({
          title: 'Analysis Complete',
          description: `Analyzed data for ${analysisResult.data.length} students.`,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error Analyzing File',
          description: 'The file might be malformed. Please check the console for details.',
        });
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                 <Logo />
            </div>
            <div className="p-4">
                <Button asChild className='w-full'>
                    <a href="/">Back to Generator</a>
                </Button>
            </div>
        </div>
      </Sidebar>
      <SidebarInset className="min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <Logo />
           <h1 className="text-lg font-semibold ml-4">Analyze Uploaded Dataset</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          {result ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {result.data.length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Credits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {result.data.reduce((acc, student) => acc + student.total_credits_earned, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Dashboard result={result} isLoading={isLoading} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Card
                className="w-full max-w-lg text-center border-dashed border-2 hover:border-primary transition-colors duration-300 cursor-pointer"
                onClick={handleUploadClick}
              >
                <CardHeader>
                  <CardTitle className="flex flex-col items-center justify-center gap-4 text-2xl">
                    <UploadCloud className="h-12 w-12 text-primary" />
                    <span>{isLoading ? 'Analyzing...' : 'Upload a JSON Dataset'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Click here or drag and drop a JSON file to analyze the student data and visualize the insights.
                  </p>
                  {fileName && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium">
                        <FileJson className="h-4 w-4"/>
                        <span>{fileName}</span>
                    </div>
                  )}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="application/json"
                    disabled={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
