import { motion } from 'framer-motion';
import { Sparkles, Wand2, X, Image } from 'lucide-react';

interface PromptInputProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    uploadedFile: File | null;
    onClearFile: () => void;
}

export const PromptInput = ({
    prompt,
    setPrompt,
    onGenerate,
    isGenerating,
    uploadedFile,
    onClearFile
}: PromptInputProps) => {
    return (
        <div className="w-full max-w-2xl mx-auto px-6 mb-8 space-y-6">
            {/* Show uploaded file preview */}
            {uploadedFile && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Image className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                    </div>
                    <button
                        onClick={onClearFile}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </motion.div>
            )}

            {/* Main Prompt Input */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <div className="relative flex gap-2 bg-surface rounded-2xl p-2 border border-white/10">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your sticker (e.g., 'A cute cyberpunk cat eating pizza')..."
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-500 resize-none h-[60px] p-3"
                    />
                    <button
                        onClick={onGenerate}
                        disabled={(!prompt.trim() && !uploadedFile) || isGenerating}
                        className="self-end px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent font-semibold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isGenerating ? (
                            <Sparkles className="w-5 h-5 animate-spin" />
                        ) : (
                            <Wand2 className="w-5 h-5" />
                        )}
                        <span className="hidden sm:inline">Generate</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
