import { WeatherData } from '../types';

// IMPORTANT: This service requires an API key from OpenWeatherMap.
// 1. Sign up for a free account at https://openweathermap.org/api to get your key.
// 2. Make this key available as an environment variable named 'OPENWEATHERMAP_API_KEY'.
// The application's weather tool will not function correctly without it.
const API_KEY = process.env.OPENWEATHERMAP_API_KEY || '30125ae34580b0a0f25e7d68a81d3629';

export const getWeather = async (locationQuery: string): Promise<WeatherData> => {
    if (!API_KEY) {
        throw new Error("OpenWeatherMap API key is not configured. Please set the OPENWEATHERMAP_API_KEY environment variable.");
    }
    
    const isCoords = locationQuery.includes('lat=') && locationQuery.includes('lon=');
    const endpoint = isCoords
        ? `https://api.openweathermap.org/data/2.5/weather?${locationQuery}&units=metric&appid=${API_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationQuery)}&units=metric&appid=${API_KEY}`;

    try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Invalid OpenWeatherMap API key.");
            }
            if (response.status === 404) {
                 throw new Error(`Could not find weather data for "${locationQuery}".`);
            }
            throw new Error(`Failed to fetch weather data (status: ${response.status}).`);
        }
        
        const data = await response.json();

        return {
            location: data.name,
            temperature: data.main.temp,
            feels_like: data.main.feels_like,
            min_temp: data.main.temp_min,
            max_temp: data.main.temp_max,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            wind_speed: data.wind.speed,
            icon: data.weather[0].icon,
            id: data.weather[0].id,
        };
        
    } catch (error) {
        console.error("Error fetching weather data:", error);
        if (error instanceof Error) {
            throw error; // Re-throw known errors
        }
        throw new Error("An unknown error occurred while fetching weather data.");
    }
};