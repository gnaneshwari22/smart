import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CloudUpload, 
  File, 
  FileText, 
  FileImage, 
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Document } from "@shared/schema";

export function FileUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Fetch existing documents
  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await apiRequest("POST", "/api/documents/upload", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      setUploadProgress({});
      
      toast({
        title: "Files Uploaded Successfully",
        description: "Your documents are ready for research analysis.",
      });
    },
    onError: (error) => {
      setUploadProgress({});
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest("DELETE", `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document Deleted",
        description: "The document has been removed from your library.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];

    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported File Type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Initialize progress tracking
    const progressMap: Record<string, number> = {};
    validFiles.forEach(file => {
      progressMap[file.name] = 0;
    });
    setUploadProgress(progressMap);

    // Simulate progress updates
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const updated = { ...prev };
        validFiles.forEach(file => {
          if (updated[file.name] < 90) {
            updated[file.name] = Math.min(90, updated[file.name] + 10);
          }
        });
        return updated;
      });
    }, 200);

    // Upload files
    uploadMutation.mutate(validFiles);
    
    // Clear interval after upload completes
    setTimeout(() => {
      clearInterval(interval);
    }, 5000);
  }, [toast, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxFiles: 5,
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes('csv')) return <File className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card data-testid="card-file-upload">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CloudUpload className="h-5 w-5 text-primary" />
          <span>Upload Documents</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`drag-zone border-2 border-dashed rounded-lg p-8 text-center space-y-4 cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary hover:bg-primary/5'
          }`}
          data-testid="dropzone"
        >
          <input {...getInputProps()} data-testid="file-input" />
          <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? "Drop files here..." : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports PDF, DOCX, TXT, CSV (Max 10MB)
          </p>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploading Files</h4>
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{filename}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            ))}
          </div>
        )}

        {/* Uploaded Files List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Your Documents</h4>
            {documents && documents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {documents.length} file{documents.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {documentsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
              <span className="text-sm text-muted-foreground">Loading documents...</span>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {documents.map((doc: Document) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-secondary rounded-md"
                  data-testid={`document-${doc.id}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(doc.mimeType)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={doc.originalName}>
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)} • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${doc.id}`}
                  >
                    {deleteMutation.isPending ? (
                      <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">No documents uploaded yet</p>
              <p className="text-xs">Upload files to include them in your research</p>
            </div>
          )}
        </div>

        {/* Upload Status */}
        {uploadMutation.isPending && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
            Processing files...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
