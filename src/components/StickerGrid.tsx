import { useRef } from 'react';
import { toPng } from 'html-to-image';
import { motion } from 'framer-motion';
import { Download, Share2 } from 'lucide-react';
import type { StickerResult } from '../lib/generator';

interface StickerGridProps {
    stickers: StickerResult[];
}

export const StickerGrid = ({ stickers }: StickerGridProps) => {
    const refs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const downloadSticker = async (id: string) => {
        const element = refs.current[id];
        if (!element) return;

        try {
            const dataUrl = await toPng(element, { cacheBust: true });
            const link = document.createElement('a');
            link.download = `sticker-${id}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download sticker', err);
        }
    };

    const getStyleClass = (style: string) => {
        switch (style) {
            case 'cartoon':
                return 'contrast-125 saturate-200 brightness-110 sepia-[.2]';
            case 'sketch':
                return 'grayscale contrast-150 brightness-125';
            case 'pop-art':
                return 'contrast-[1.5] saturate-[2.5] hue-rotate-15';
            default:
                return '';
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-6 pb-20">
            <h2 className="text-3xl font-bold text-center mb-10">Your Magical Stickers</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stickers.map((sticker, index) => (
                    <motion.div
                        key={sticker.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-panel p-6 flex flex-col items-center gap-6 group"
                    >
                        {/* Sticker Preview Container */}
                        <div
                            ref={el => { refs.current[sticker.id] = el; }}
                            className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/5 p-4 flex items-center justify-center"
                        >
                            <div className={`relative w-full h-full rounded-xl overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-105 ${getStyleClass(sticker.style)}`}>
                                <img
                                    src={sticker.originalUrl}
                                    alt="Sticker"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => downloadSticker(sticker.id)}
                                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button className="btn-secondary px-4">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{sticker.style}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
