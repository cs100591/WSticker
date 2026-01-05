import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';

interface UploadZoneProps {
    onUpload: (file: File) => void;
    isGenerating: boolean;
    uploadedFile: File | null;
}

export const UploadZone = ({ onUpload, isGenerating, uploadedFile }: UploadZoneProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onUpload(acceptedFiles[0]);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        disabled: isGenerating
    });

    return (
        <div className="w-full max-w-2xl mx-auto px-6 mb-20">
            {!uploadedFile && (
                <motion.div
                {...(getRootProps() as any)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
          relative cursor-pointer group
          h-64 rounded-3xl border-2 border-dashed transition-all duration-300
          flex flex-col items-center justify-center text-center p-8
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/20 hover:border-primary/50 hover:bg-white/5'}
          glass-panel
        `}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode='wait'>
                    {isGenerating ? (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                            </div>
                            <p className="text-lg font-medium text-gray-300">Creating magic...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                {isDragActive ? (
                                    <ImageIcon className="w-8 h-8 text-primary" />
                                ) : (
                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                                )}
                            </div>

                            <div>
                                <p className="text-xl font-semibold mb-2">
                                    {isDragActive ? "Drop it like it's hot!" : "Drop your photo here"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    or click to browse from your device
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            )}
        </div>
    );
};
