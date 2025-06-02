"use client";

import * as React from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";

interface FileUploadButtonProps {
  onFileUploaded: (fileContent: string) => void;
}

export function FileUploadButton({ onFileUploaded }: FileUploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileUploaded(text);
        toast({
          title: "CSV Processed",
          description: `${file.name} has been successfully processed.`,
        });
      };
      reader.onerror = () => {
        toast({
          title: "Error Reading File",
          description: `Could not read ${file.name}.`,
          variant: "destructive",
        });
      }
      reader.readAsText(file);
      // Reset file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <Button onClick={handleClick} variant="outline" className="w-full md:w-auto">
        <UploadCloud className="mr-2 h-5 w-5" />
        Upload Mutual Fund CSV
      </Button>
      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleFileChange}
        id="csv-upload"
      />
      <Label htmlFor="csv-upload" className="sr-only">Upload CSV</Label>
    </div>
  );
}
