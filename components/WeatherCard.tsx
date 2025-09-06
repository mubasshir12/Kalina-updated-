import React from 'react';
import { WeatherData } from '../types';
import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudRain, CloudSnow, Wind, Droplets, Zap, Tornado, CloudFog, CloudDrizzle } from 'lucide-react';

// Animation Components
const StarsAnimation = () => (
    <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
            <div key={i} className="star" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`, animationDelay: `${Math.random() * 5}s` }} />
        ))}
    </div>
);

const RainAnimation: React.FC<{ intensity: 'light' | 'medium' | 'heavy' }> = ({ intensity }) => {
    const dropCount = intensity === 'heavy' ? 100 : intensity === 'medium' ? 50 : 25;
    const baseDuration = intensity === 'heavy' ? 0.4 : intensity === 'medium' ? 0.6 : 0.8;
    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            {[...Array(dropCount)].map((_, i) => (
                <div key={i} className="raindrop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${baseDuration + Math.random() * 0.5}s` }} />
            ))}
        </div>
    );
};

const SnowAnimation: React.FC<{ intensity: 'light' | 'heavy' }> = ({ intensity }) => {
    const flakeCount = intensity === 'heavy' ? 100 : 50;
    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            {[...Array(flakeCount)].map((_, i) => (
                <div key={i} className="snowflake" style={{ left: `${Math.random() * 100}%`, width: `${2 + Math.random() * 4}px`, height: `${2 + Math.random() * 4}px`, animationDelay: `${Math.random() * 10}s`, animationDuration: `${8 + Math.random() * 8}s`, opacity: `${0.5 + Math.random() * 0.5}` }} />
            ))}
        </div>
    );
};

const SleetAnimation = () => (
     <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
            <div key={i} className="sleetdrop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${0.4 + Math.random() * 0.3}s` }} />
        ))}
    </div>
);

const LightningAnimation: React.FC<{ frequency?: 'low' | 'high' }> = ({ frequency = 'low' }) => (
    <div className={`lightning-flash ${frequency === 'high' ? 'fast' : ''}`} />
);

const FogAnimation: React.FC<{ density?: 'light' | 'heavy' }> = ({ density = 'light' }) => (
    <div className={`absolute inset-0 z-0 pointer-events-none ${density === 'heavy' ? 'opacity-90' : 'opacity-70'}`}>
        <div className="fog-layer fog-layer-1"></div>
        <div className="fog-layer fog-layer-2"></div>
        <div className="fog-layer fog-layer-3"></div>
    </div>
);

const DustAnimation: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: color }}>
         {[...Array(60)].map((_, i) => (
            <div key={i} className="dust-particle" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${2 + Math.random() * 3}px`, height: `${2 + Math.random() * 3}px`, animationDelay: `${Math.random() * 15}s`, animationDuration: `${10 + Math.random() * 10}s` }} />
        ))}
    </div>
);

const WindAnimation = () => (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
            <div key={i} className="wind-gust" style={{ top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${0.5 + Math.random() * 0.5}s` }} />
        ))}
    </div>
);

const TornadoAnimation = () => (
    <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-start overflow-hidden">
        <Tornado className="w-32 h-32 text-gray-500/80 animate-tornado-spin" />
    </div>
);

const OvercastClouds = () => (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="overcast-layer"></div>
    </div>
);

const CloudAnimation: React.FC<{ coverage: 'few' | 'scattered' | 'broken', isDay: boolean }> = ({ coverage, isDay }) => {
    const cloudColor = isDay ? 'rgba(255,255,255,0.9)' : 'rgba(150,160,180,0.7)';
    const cloudConfigs = {
        few: [
            { size: 'w-1/4', top: '20%', left: '10%', duration: '45s', delay: '0s' },
        ],
        scattered: [
            { size: 'w-1/3', top: '15%', left: '5%', duration: '40s', delay: '0s' },
            { size: 'w-1/4', top: '40%', left: '50%', duration: '50s', delay: '-10s' },
        ],
        broken: [
            { size: 'w-1/2', top: '10%', left: '-10%', duration: '35s', delay: '0s' },
            { size: 'w-1/3', top: '35%', left: '40%', duration: '45s', delay: '-5s' },
            { size: 'w-2/5', top: '50%', left: '10%', duration: '55s', delay: '-15s' },
        ],
    };
    const clouds = cloudConfigs[coverage];
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {clouds.map((config, i) => (
                <div key={i} className={`absolute ${config.size} animate-cloud-pan`} style={{ top: config.top, left: config.left, animationDuration: config.duration, animationDelay: config.delay }}>
                    <svg viewBox="0 0 100 60" className="w-full h-auto drop-shadow-lg">
                        <path d="M 15 60 C 0 60 0 40 15 40 C 15 25 30 25 30 40 C 35 30 55 30 60 40 C 75 40 75 60 60 60 L 15 60 Z" fill={cloudColor} />
                        <path d="M 40 55 C 25 55 25 35 40 35 C 40 20 55 20 55 35 C 60 25 80 25 85 35 C 100 35 100 55 85 55 L 40 55 Z" transform="translate(5, -10)" fill={cloudColor} />
                    </svg>
                </div>
            ))}
        </div>
    );
};


// Maps OpenWeatherMap codes to a rich set of visual properties
const getWeatherVisuals = (data: WeatherData) => {
    const id = data.id;
    const isDay = data.icon.endsWith('d');
    
    // Default fallback
    // FIX: Changed [<OvercastClouds />] to [OvercastClouds] to pass the component function instead of a rendered element, matching the type React.FC<any>[].
    let visuals: { Icon: React.ElementType, color: string, bg: string, Animations: React.FC<any>[], iconAnimationClass: string } = { Icon: Cloud, color: 'text-slate-300', bg: 'from-slate-400 to-slate-600', Animations: [OvercastClouds], iconAnimationClass: 'animate-cloud-heavy-float' };

    switch (true) {
        // Thunderstorm (2xx)
        case id >= 200 && id < 300: {
            const rainIntensity = (id === 202 || id === 232) ? 'heavy' : (id === 200 || id === 230) ? 'light' : 'medium';
            const lightningFrequency = (id === 212 || id === 202) ? 'high' : 'low';
            const hasWind = id === 221; // ragged thunderstorm
            const animations: React.FC<any>[] = [
                () => <RainAnimation intensity={rainIntensity} />, 
                () => <LightningAnimation frequency={lightningFrequency} />
            ];
            if (hasWind) animations.push(() => <WindAnimation />);

            visuals = {
                Icon: Zap, color: 'text-yellow-300',
                bg: isDay ? 'from-slate-600 via-gray-700 to-slate-800' : 'from-slate-800 via-gray-900 to-black',
                Animations: animations,
                iconAnimationClass: 'animate-cloud-heavy-float'
            };
            break;
        }

        // Drizzle (3xx)
        case id >= 300 && id < 400: {
            const rainIntensity = (id === 302 || id === 312 || id === 314) ? 'medium' : 'light';
            visuals = {
                Icon: CloudDrizzle, color: 'text-blue-200',
                bg: isDay ? 'from-sky-500 to-slate-600' : 'from-slate-700 to-indigo-900',
                Animations: [() => <RainAnimation intensity={rainIntensity} />],
                iconAnimationClass: 'animate-cloud-gentle-float'
            };
            break;
        }

        // Rain (5xx)
        case id >= 500 && id < 600: {
            if (id === 511) { // Freezing Rain
                // FIX: Changed [<SleetAnimation />] to [SleetAnimation] to pass the component function instead of a rendered element.
                visuals = { Icon: CloudRain, color: 'text-cyan-200', bg: isDay ? 'from-slate-400 to-cyan-700' : 'from-slate-700 to-cyan-900', Animations: [SleetAnimation], iconAnimationClass: 'animate-cloud-heavy-float' };
                break;
            }
            let rainIntensity: 'light' | 'medium' | 'heavy' = 'medium';
            if (id === 500 || id === 520) rainIntensity = 'light';
            if ((id >= 502 && id <= 504) || id === 522) rainIntensity = 'heavy';
            const hasWind = id === 531; // ragged shower rain

            const animations: React.FC<any>[] = [() => <RainAnimation intensity={rainIntensity} />];
            if (hasWind) animations.push(() => <WindAnimation />);

            visuals = {
                Icon: CloudRain, color: 'text-blue-300',
                bg: isDay ? 'from-sky-600 to-indigo-800' : 'from-slate-800 to-indigo-900',
                Animations: animations,
                iconAnimationClass: 'animate-cloud-heavy-float'
            };
            break;
        }

        // Snow (6xx)
        case id >= 600 && id < 700: {
            if (id >= 611 && id <= 616) { // Sleet or Rain/Snow mix
                // FIX: Changed [<SleetAnimation />] to [SleetAnimation] to pass the component function instead of a rendered element.
                visuals = { Icon: CloudSnow, color: 'text-cyan-200', bg: isDay ? 'from-slate-400 to-cyan-600' : 'from-slate-600 to-cyan-800', Animations: [SleetAnimation], iconAnimationClass: 'animate-cloud-heavy-float' };
            } else {
                const snowIntensity = (id === 602 || id === 622) ? 'heavy' : 'light';
                visuals = {
                    Icon: CloudSnow, color: 'text-white',
                    bg: isDay ? 'from-sky-200 via-slate-300 to-slate-400' : 'from-slate-600 via-slate-700 to-slate-800',
                    Animations: [() => <SnowAnimation intensity={snowIntensity} />],
                    iconAnimationClass: 'animate-cloud-heavy-float'
                };
            }
            break;
        }

        // Atmosphere (7xx)
        case id >= 700 && id < 800: {
            let atmosphereAnimation, atmosphereBg, atmosphereIcon;
            switch(id) {
                case 701: // mist
                    atmosphereAnimation = () => <FogAnimation density="light" />;
                    atmosphereBg = isDay ? 'from-slate-300 to-slate-500' : 'from-slate-600 to-slate-800';
                    atmosphereIcon = CloudFog;
                    break;
                case 711: // Smoke
                case 762: // Ash
                    atmosphereAnimation = () => <DustAnimation color="rgba(100, 100, 100, 0.4)" />;
                    atmosphereBg = isDay ? 'from-gray-400 to-gray-600' : 'from-gray-700 to-gray-900';
                    atmosphereIcon = CloudFog;
                    break;
                case 721: // Haze
                    atmosphereAnimation = () => <DustAnimation color="rgba(213, 193, 151, 0.3)" />;
                    atmosphereBg = isDay ? 'from-yellow-200 to-orange-300' : 'from-gray-600 to-gray-800';
                    atmosphereIcon = CloudFog;
                    break;
                case 731: // Sand/dust whirls
                case 751: // Sand
                case 761: // Dust
                    atmosphereAnimation = () => <DustAnimation color="rgba(214, 186, 140, 0.4)" />;
                    atmosphereBg = isDay ? 'from-amber-300 to-orange-400' : 'from-amber-800 to-orange-900';
                    atmosphereIcon = Wind;
                    break;
                case 741: // Fog
                    atmosphereAnimation = () => <FogAnimation density="heavy" />;
                    atmosphereBg = isDay ? 'from-gray-400 to-gray-600' : 'from-gray-700 to-gray-900';
                    atmosphereIcon = CloudFog;
                    break;
                case 771: // Squalls
                    atmosphereBg = isDay ? 'from-gray-600 to-gray-800' : 'from-gray-800 to-black';
                    atmosphereAnimation = () => <><OvercastClouds /><WindAnimation /><RainAnimation intensity="heavy" /></>;
                    atmosphereIcon = Wind;
                    break;
                case 781: // Tornado
                    atmosphereBg = 'from-gray-700 to-black';
                    atmosphereAnimation = () => <TornadoAnimation />;
                    atmosphereIcon = Tornado;
                    break;
                default:
                    atmosphereAnimation = () => <FogAnimation density="light" />;
                    atmosphereBg = isDay ? 'from-slate-300 to-slate-500' : 'from-slate-600 to-slate-800';
                    atmosphereIcon = CloudFog;
            }
            visuals = { Icon: atmosphereIcon, color: 'text-slate-200', bg: atmosphereBg, Animations: [atmosphereAnimation], iconAnimationClass: 'animate-mist-drift' };
            break;
        }

        // Clear (800)
        case id === 800: {
            visuals = isDay
                ? { Icon: Sun, color: 'text-yellow-300', bg: 'from-sky-400 via-cyan-300 to-blue-500', Animations: [], iconAnimationClass: 'animate-sun-spin' }
                // FIX: Changed [<StarsAnimation />] to [StarsAnimation] to pass the component function instead of a rendered element.
                : { Icon: Moon, color: 'text-slate-200', bg: 'from-gray-900 via-indigo-900 to-black', Animations: [StarsAnimation], iconAnimationClass: 'animate-moon-glow' };
            break;
        }

        // Clouds (80x)
        case id > 800: {
            const baseBg = isDay ? 'from-sky-500 to-blue-600' : 'from-slate-800 to-indigo-900';
            const baseIcon = isDay ? CloudSun : CloudMoon;
            const baseIconColor = isDay ? 'text-yellow-300' : 'text-slate-200';
            // FIX: Changed [<StarsAnimation/>] to [StarsAnimation] to pass the component function instead of a rendered element.
            const baseAnimations = isDay ? [] : [StarsAnimation];

            if (id === 801) { // few clouds
                visuals = { Icon: baseIcon, color: baseIconColor, bg: baseBg, Animations: [...baseAnimations, () => <CloudAnimation coverage="few" isDay={isDay} />], iconAnimationClass: 'animate-cloud-gentle-float' };
            } else if (id === 802) { // scattered clouds
                visuals = { Icon: baseIcon, color: baseIconColor, bg: baseBg, Animations: [...baseAnimations, () => <CloudAnimation coverage="scattered" isDay={isDay} />], iconAnimationClass: 'animate-cloud-gentle-float' };
            } else if (id === 803) { // broken clouds
                visuals = { Icon: Cloud, color: 'text-slate-300', bg: isDay ? 'from-sky-600 to-slate-700' : 'from-slate-700 to-gray-900', Animations: [...baseAnimations, () => <CloudAnimation coverage="broken" isDay={isDay} />], iconAnimationClass: 'animate-cloud-heavy-float' };
            } else if (id === 804) { // overcast clouds
                visuals = { Icon: Cloud, color: 'text-slate-400', bg: isDay ? 'from-gray-500 to-gray-700' : 'from-gray-800 to-gray-900', Animations: [OvercastClouds], iconAnimationClass: 'animate-cloud-heavy-float' };
            }
            break;
        }
    }
    return visuals;
};


const WeatherCard: React.FC<{ data: WeatherData }> = ({ data }) => {
    const { Icon, color, bg, Animations, iconAnimationClass } = getWeatherVisuals(data);
    
    const formatWindSpeed = (speed: any): string => {
        const num = parseFloat(speed);
        return isNaN(num) ? 'N/A' : num.toFixed(1);
    };

    return (
        <div className={`relative my-4 p-4 sm:p-6 rounded-2xl text-white overflow-hidden bg-gradient-to-br ${bg} shadow-lg w-full max-w-sm border border-white/10 animate-fade-in`}>
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                
                /* Icon Animations */
                @keyframes sun-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-sun-spin { animation: sun-spin 25s linear infinite; filter: drop-shadow(0 0 6px currentColor); }
                @keyframes moon-glow { 0%, 100% { filter: drop-shadow(0 0 5px currentColor); } 50% { filter: drop-shadow(0 0 10px currentColor); } }
                .animate-moon-glow { animation: moon-glow 4s ease-in-out infinite; }
                @keyframes float-gentle { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                .animate-cloud-gentle-float { animation: float-gentle 4s ease-in-out infinite; }
                @keyframes float-heavy { 0%, 100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-4px) translateX(2px); } }
                .animate-cloud-heavy-float { animation: float-heavy 6s ease-in-out infinite; }
                @keyframes mist-drift { 0% { transform: translateX(-8px) scale(1.05); opacity: 0.8; } 50% { opacity: 1; } 100% { transform: translateX(8px) scale(1); opacity: 0.8; } }
                .animate-mist-drift { animation: mist-drift 8s ease-in-out infinite alternate; }
                @keyframes tornado-spin { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
                .animate-tornado-spin { animation: tornado-spin 0.2s linear infinite alternate; }

                /* Background Animations */
                .star { position: absolute; background: white; border-radius: 50%; animation: twinkle 3s linear infinite; }
                @keyframes twinkle { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
                
                .raindrop { position: absolute; top: -20%; width: 1.5px; height: 20px; background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.4)); animation-name: rain-fall; animation-timing-function: linear; animation-iteration-count: infinite; transform: rotate(10deg); }
                @keyframes rain-fall { from { transform: translateY(0vh) rotate(10deg); } to { transform: translateY(110vh) rotate(10deg); } }
                
                .sleetdrop { position: absolute; top: -10%; width: 3px; height: 3px; background-color: rgba(255, 255, 255, 0.7); border-radius: 50%; animation-name: sleet-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
                @keyframes sleet-fall { from { transform: translateY(0vh) rotate(20deg); } to { transform: translateY(110vh) rotate(20deg); } }
                
                .snowflake { position: absolute; top: -10%; background: white; border-radius: 50%; animation-name: snow-fall-realistic; animation-timing-function: linear; animation-iteration-count: infinite; }
                @keyframes snow-fall-realistic { 0% { transform: translateY(0vh) translateX(0vw) rotate(0deg); } 100% { transform: translateY(110vh) translateX(5vw) rotate(360deg); opacity: 0; } }
                
                .lightning-flash { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: white; opacity: 0; animation: lightning-flash-anim 5s linear infinite; animation-delay: 1.5s; }
                @keyframes lightning-flash-anim { 0% { opacity: 0; } 1% { opacity: 0.3; } 2% { opacity: 0; } 3% { opacity: 0.2; } 4% { opacity: 0; } 30% { opacity: 0; } 31% { opacity: 0.4; } 32% { opacity: 0; } 100% { opacity: 0; } }
                .lightning-flash.fast { animation-name: lightning-flash-anim-fast; animation-duration: 3s; }
                @keyframes lightning-flash-anim-fast { 0%{opacity:0} 1%{opacity:.4} 2%{opacity:0} 3%{opacity:.3} 4%{opacity:0} 15%{opacity:0} 16%{opacity:.5} 17%{opacity:0} 18%{opacity:.2} 19%{opacity:0} 100%{opacity:0} }

                .fog-layer { position: absolute; width: 200%; height: 100%; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%); animation-timing-function: linear; animation-iteration-count: infinite; }
                .fog-layer-1 { animation-name: fog-drift; animation-duration: 40s; }
                .fog-layer-2 { animation-name: fog-drift; animation-duration: 50s; animation-direction: reverse; }
                .fog-layer-3 { bottom: -50%; height: 150%; animation-name: fog-drift; animation-duration: 60s; }
                @keyframes fog-drift { from { transform: translateX(-50%); } to { transform: translateX(0); } }

                .dust-particle { position: absolute; background-color: rgba(255, 255, 255, 0.3); border-radius: 50%; animation-name: dust-drift; animation-timing-function: linear; animation-iteration-count: infinite; }
                @keyframes dust-drift { from { transform: translateX(-20px) translateY(0px) rotate(0deg); opacity: 0; } 50% { opacity: 1; } to { transform: translateX(20px) translateY(40px) rotate(360deg); opacity: 0; } }

                .wind-gust { position: absolute; left: -10%; width: 50px; height: 2px; background: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.4)); border-radius: 2px; animation-name: wind-blow; animation-timing-function: ease-in; animation-iteration-count: infinite; }
                @keyframes wind-blow { from { transform: translateX(0); } to { transform: translateX(120vw); } }

                .overcast-layer { position: absolute; top: 0; left: 0; width: 200%; height: 200%; background-image: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.05) 0%, transparent 30%); animation: slow-pan 60s linear infinite; }
                @keyframes slow-pan { from { transform: translate(0, 0); } to { transform: translate(-50%, -50%); } }

                .animate-cloud-pan { animation-name: cloud-pan-anim; animation-timing-function: linear; animation-iteration-count: infinite; }
                @keyframes cloud-pan-anim { from { transform: translateX(-150%); } to { transform: translateX(150%); } }
            `}</style>
            
            {Animations.map((Anim, index) => <Anim key={index} />)}

            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold">{data.location}</h3>
                        <p className="text-sm sm:text-base capitalize opacity-80">{data.description}</p>
                    </div>
                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 -mt-2 -mr-2 ${color}`}>
                        <Icon className={`w-full h-full drop-shadow-lg ${iconAnimationClass}`} />
                    </div>
                </div>

                <div className="mt-4 sm:mt-8 flex justify-between items-end">
                    <div className="flex items-start">
                        <p className="text-5xl sm:text-7xl font-bold tracking-tighter">{Math.round(data.temperature)}</p>
                        <span className="text-2xl sm:text-3xl font-medium mt-1">°C</span>
                    </div>
                    <div className="text-right text-xs sm:text-sm">
                        <p>Feels like {Math.round(data.feels_like)}°</p>
                        <p>H: {Math.round(data.max_temp)}° / L: {Math.round(data.min_temp)}°</p>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 opacity-70" />
                        <span>Humidity: {data.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 opacity-70" />
                        <span>Wind: {formatWindSpeed(data.wind_speed)} m/s</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherCard;