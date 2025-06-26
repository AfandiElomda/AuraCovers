import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { generateCoverSchema, type GenerateCoverRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Book, UserPen, Tags, Lightbulb, Palette, SwatchBook, Download, RefreshCw, CheckCircle, WandSparkles, CreditCard, Gift } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";

interface GenerateCoverResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  bookCover?: {
    id: number;
  };
  user?: {
    freeDownloads: number;
    totalDownloads: number;
  };
}

interface UserStatus {
  freeDownloads: number;
  totalDownloads: number;
}

interface DownloadResponse {
  success: boolean;
  imageUrl?: string;
  remainingFreeDownloads?: number;
  isPaid?: boolean;
  error?: string;
  paymentRequired?: boolean;
}

export default function Home() {
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [currentCoverId, setCurrentCoverId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();

  // Fetch user status
  const { data: userStatus, refetch: refetchUserStatus } = useQuery<UserStatus>({
    queryKey: ["/api/user-status"],
  });
  
  const form = useForm<GenerateCoverRequest>({
    resolver: zodResolver(generateCoverSchema),
    defaultValues: {
      bookTitle: "",
      authorName: "",
      genre: "",
      keywords: "",
      mood: "",
      colorPalette: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateCoverRequest): Promise<GenerateCoverResponse> => {
      const response = await apiRequest("POST", "/api/generate-cover", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.imageUrl) {
        setGeneratedCover(data.imageUrl);
        toast({
          title: "Success!",
          description: "Your book cover has been generated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate book cover",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate book cover. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GenerateCoverRequest) => {
    generateMutation.mutate(data);
  };

  const downloadCover = () => {
    if (!generatedCover) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx!.drawImage(img, 0, 0);
      
      // Add text overlays
      const title = form.getValues('bookTitle');
      const author = form.getValues('authorName');
      
      if (ctx) {
        // Title styling
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        
        // Title position (top third)
        const titleY = canvas.height * 0.2;
        ctx.strokeText(title, canvas.width / 2, titleY);
        ctx.fillText(title, canvas.width / 2, titleY);
        
        // Author styling
        ctx.font = '32px Inter, sans-serif';
        ctx.lineWidth = 2;
        
        // Author position (bottom)
        const authorY = canvas.height * 0.9;
        ctx.strokeText(author, canvas.width / 2, authorY);
        ctx.fillText(author, canvas.width / 2, authorY);
      }
      
      // Download
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_cover.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = generatedCover;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <Book className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AuraCovers</h1>
                <p className="text-sm text-gray-600">AI-Powered Book Cover Generator</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-600">Create stunning book covers in seconds</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card className="p-6 lg:p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Create Your Book Cover</CardTitle>
                <CardDescription>Fill in the details below and let AI generate a stunning cover for your book.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Book Title */}
                    <FormField
                      control={form.control}
                      name="bookTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                            <Book className="text-primary mr-2 h-4 w-4" />
                            Book Title *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your book title" 
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Author Name */}
                    <FormField
                      control={form.control}
                      name="authorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                            <UserPen className="text-primary mr-2 h-4 w-4" />
                            Author Name *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter author name" 
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Genre */}
                    <FormField
                      control={form.control}
                      name="genre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                            <Tags className="text-primary mr-2 h-4 w-4" />
                            Genre *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary">
                                <SelectValue placeholder="Select a genre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fantasy">Fantasy</SelectItem>
                              <SelectItem value="sci-fi">Science Fiction</SelectItem>
                              <SelectItem value="romance">Romance</SelectItem>
                              <SelectItem value="thriller">Thriller</SelectItem>
                              <SelectItem value="mystery">Mystery</SelectItem>
                              <SelectItem value="historical-fiction">Historical Fiction</SelectItem>
                              <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                              <SelectItem value="horror">Horror</SelectItem>
                              <SelectItem value="contemporary">Contemporary Fiction</SelectItem>
                              <SelectItem value="young-adult">Young Adult</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Keywords/Themes */}
                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                            <Lightbulb className="text-primary mr-2 h-4 w-4" />
                            Keywords & Themes
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., dark forest, ancient magic, brave knight, mystical creatures"
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary resize-none"
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Describe key elements, settings, or themes in your book
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mood/Atmosphere */}
                    <FormField
                      control={form.control}
                      name="mood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                            <Palette className="text-primary mr-2 h-4 w-4" />
                            Mood & Atmosphere
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary">
                                <SelectValue placeholder="Select mood (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mysterious">Mysterious</SelectItem>
                              <SelectItem value="epic">Epic</SelectItem>
                              <SelectItem value="romantic">Romantic</SelectItem>
                              <SelectItem value="suspenseful">Suspenseful</SelectItem>
                              <SelectItem value="hopeful">Hopeful</SelectItem>
                              <SelectItem value="dramatic">Dramatic</SelectItem>
                              <SelectItem value="whimsical">Whimsical</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="uplifting">Uplifting</SelectItem>
                              <SelectItem value="nostalgic">Nostalgic</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Color Palette */}
                    <FormField
                      control={form.control}
                      name="colorPalette"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                            <SwatchBook className="text-primary mr-2 h-4 w-4" />
                            Color Preference
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary">
                                <SelectValue placeholder="Any colors (recommended)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dark tones">Dark Tones</SelectItem>
                              <SelectItem value="vibrant colors">Vibrant Colors</SelectItem>
                              <SelectItem value="pastel colors">Pastel Colors</SelectItem>
                              <SelectItem value="monochromatic blue">Monochromatic Blue</SelectItem>
                              <SelectItem value="warm colors">Warm Colors</SelectItem>
                              <SelectItem value="cool colors">Cool Colors</SelectItem>
                              <SelectItem value="earth tones">Earth Tones</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Generate Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={generateMutation.isPending}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-3"
                      >
                        {generateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <WandSparkles className="h-4 w-4" />
                            <span>Generate Book Cover</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Tips Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Lightbulb className="text-amber-500 mr-2 h-5 w-5" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-500 mt-0.5 h-4 w-4" />
                    <span>Be specific with keywords for better results</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-500 mt-0.5 h-4 w-4" />
                    <span>Choose a mood that matches your story's tone</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-500 mt-0.5 h-4 w-4" />
                    <span>Leave color preference empty for best variety</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card className="p-6 lg:p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Preview</CardTitle>
                <CardDescription>Your generated book cover will appear here</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="relative">
                  {/* Loading Indicator */}
                  {generateMutation.isPending && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center z-10">
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4 mx-auto" />
                        <p className="text-gray-600 font-medium">Generating your cover...</p>
                        <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                      </div>
                    </div>
                  )}

                  {/* Preview Container */}
                  {!generatedCover ? (
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center p-8">
                        <Book className="h-16 w-16 text-gray-400 mb-4 mx-auto" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Cover Generated Yet</h3>
                        <p className="text-gray-500 text-sm">Fill out the form and click "Generate Book Cover" to see your AI-created design</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-2xl">
                        <img 
                          src={generatedCover} 
                          alt="Generated book cover" 
                          className="w-full h-full object-cover" 
                        />
                        
                        {/* Text Overlays */}
                        <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                          <div className="text-center">
                            <h1 className="text-2xl lg:text-3xl font-bold leading-tight drop-shadow-lg" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
                              {form.getValues('bookTitle') || 'Book Title'}
                            </h1>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-lg lg:text-xl font-medium drop-shadow-lg" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                              {form.getValues('authorName') || 'Author Name'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Download Section */}
                      <div className="mt-6 space-y-4">
                        <Button 
                          onClick={downloadCover}
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download High-Res Cover
                        </Button>
                        
                        <Button 
                          onClick={() => form.handleSubmit(onSubmit)()}
                          variant="outline"
                          className="w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Generate Another Variation
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">&copy; 2024 AuraCovers. Powered by AI image generation technology.</p>
            <p className="text-sm text-gray-500 mt-2">Create professional book covers in seconds</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
