import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const Hero = () => {
    return (
        <div className="relative py-20 px-6 text-center overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto space-y-6"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
                >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-300">AI-Powered Sticker Generator</span>
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                    Turn Photos into <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent animate-gradient-x">
                        Magical Stickers
                    </span>
                </h1>

                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Upload your favorite moments and watch our AI transform them into expressive, cartoon-style WhatsApp stickers in seconds.
                </p>
            </motion.div>
        </div>
    );
};
