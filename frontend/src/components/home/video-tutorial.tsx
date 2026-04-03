import { Play } from "lucide-react";
import { TranslatedText } from "@/components/translated-text";
import { useState } from "react";
import { motion } from "framer-motion";

export function VideoTutorial() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-900 sm:text-4xl">
                        <TranslatedText text="See UrutiX in Action" />
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-slate-600">
                        <TranslatedText text="Watch how our platform simplifies logistics from booking to payment in under 2 minutes." />
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video max-w-5xl"
                >
                    {!isPlaying ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 group cursor-pointer" onClick={() => setIsPlaying(true)}>
                            {/* Placeholder Background (Simulated Video Thumbnail) */}
                            <div className="absolute inset-0 bg-slate-900 opacity-90" />
                            <div className="absolute inset-0 bg-[url('/dashboard-preview.jpg')] bg-cover bg-center opacity-20" />

                            {/* Play Button */}
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                </div>
                                <span className="text-white font-medium tracking-wide text-sm uppercase">
                                    <TranslatedText text="Play Tutorial" />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <video
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                            src="/20260208-1402-03.3896805.mp4"
                            title="UrutiX Tutorial"
                        >
                            <TranslatedText text="Your browser does not support the video tag." />
                        </video>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
