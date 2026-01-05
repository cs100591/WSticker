import { useState } from 'react';
import { Hero } from './components/Hero';
import { UploadZone } from './components/UploadZone';
import { StickerGrid } from './components/StickerGrid';
import { PromptInput } from './components/PromptInput';
import { generateStickers, type StickerResult } from './lib/generator';

function App() {
  const [stickers, setStickers] = useState<StickerResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const apiKey = import.meta.env.VITE_HF_API_KEY || "";

  const handleGenerate = async () => {
    console.log("Generate clicked!", { prompt, uploadedFile, hasPrompt: !!prompt, hasFile: !!uploadedFile });
    
    if (!prompt && !uploadedFile) {
      console.log("No prompt or file, returning");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Calling generateStickers...");
      const results = await generateStickers(uploadedFile, prompt, apiKey);
      console.log("Results:", results);
      setStickers(results);
    } catch (error) {
      console.error("Generation failed", error);
      alert("Generation failed: " + error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen pb-20">
      <Hero />

      <div className="container mx-auto">
        <PromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          uploadedFile={uploadedFile}
          onClearFile={handleClearFile}
        />

        <UploadZone
          onUpload={handleFileUpload}
          isGenerating={isGenerating}
          uploadedFile={uploadedFile}
        />

        {stickers.length > 0 && (
          <div className="mt-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <StickerGrid stickers={stickers} />

            <div className="flex justify-center mt-12">
              <button
                onClick={() => setStickers([])}
                className="text-gray-400 hover:text-white underline underline-offset-4 transition-colors"
              >
                Create More Stickers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
