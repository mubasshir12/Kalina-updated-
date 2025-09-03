import React from 'react';

interface ImageGenerationAnimationProps {
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | number;
    isEditing?: boolean;
    generationComplete?: boolean;
}

const getAspectRatioClass = (ratio: ImageGenerationAnimationProps['aspectRatio']) => {
    switch (ratio) {
        case "16:9": return "aspect-[16/9]";
        case "9:16": return "aspect-[9/16]";
        case "4:3": return "aspect-[4/3]";
        case "3:4": return "aspect-[3/4]";
        case "1:1": default: return "aspect-square";
    }
};

const ImageGenerationAnimation: React.FC<ImageGenerationAnimationProps> = ({ aspectRatio = "1:1", isEditing = false, generationComplete = false }) => {
    const isNumericRatio = typeof aspectRatio === 'number';
    const className = `relative w-full ${!isNumericRatio ? getAspectRatioClass(aspectRatio) : ''} rounded-lg overflow-hidden bg-black/30`;
    const style = isNumericRatio ? { aspectRatio: `${aspectRatio}` } : {};
    const loaderText = generationComplete ? 'Generated' : (isEditing ? 'Editing...' : 'Generating...');

    return (
        <div className={className} style={style}>
            <style>
                {`
                    @keyframes gradient-pan {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .gradient-bg {
                        background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
                        background-size: 400% 400%;
                        animation: gradient-pan 8s ease infinite;
                        opacity: 0.4;
                    }
                    @keyframes float {
                        0% { transform: translate(0, 0) scale(1); opacity: 0; }
                        25% { opacity: 1; }
                        75% { opacity: 1; }
                        100% { transform: translate(var(--tx), var(--ty)) scale(0.5); opacity: 0; }
                    }
                    .shard {
                        position: absolute;
                        background-color: white;
                        border-radius: 50%;
                        animation: float 6s ease-in-out infinite;
                    }
                `}
            </style>
            <div className="absolute inset-0 gradient-bg"></div>
            {Array.from({ length: 15 }).map((_, i) => (
                <div
                    key={i}
                    className="shard"
                    style={{
                        width: `${Math.random() * 4 + 2}px`,
                        height: `${Math.random() * 4 + 2}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 6}s`,
                        // @ts-ignore
                        '--tx': `${(Math.random() - 0.5) * 80}px`,
                        '--ty': `${(Math.random() - 0.5) * 80}px`,
                    }}
                />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-sm font-semibold drop-shadow-md">{loaderText}</p>
            </div>
        </div>
    );
};

export default ImageGenerationAnimation;