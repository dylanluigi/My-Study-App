import React, { createContext, useContext, useEffect, useState } from 'react';

// Types
export type ThemeMode = 'manual' | 'auto';
export type ThemeType = 'gradient' | 'forest'; // Extendable
export type TimeOfDay = 'day' | 'night';
export type WeatherCondition = 'clear' | 'rain' | 'cloudy' | 'snow';

interface ThemeState {
    mode: ThemeMode;
    theme: ThemeType;
    timeOfDay: TimeOfDay;
    weather: WeatherCondition;
}

interface ThemeContextType extends ThemeState {
    setMode: (mode: ThemeMode) => void;
    setTheme: (theme: ThemeType) => void;
    // For manual override or dev testing
    setManualTime: (time: TimeOfDay) => void;
    setManualWeather: (weather: WeatherCondition) => void;

    // Manual Location
    manualLocation: string | null;
    setManualLocation: (location: string | null) => void;

    // Visual Settings
    blurIntensity: number;
    setBlurIntensity: (value: number) => void;
    panelOpacity: number;
    setPanelOpacity: (value: number) => void;

    geoError?: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('auto');
    const [theme, setTheme] = useState<ThemeType>('forest'); // Default to our new fancy theme

    // Auto-detected state
    const [autoTime, setAutoTime] = useState<TimeOfDay>('day');
    const [autoWeather, setAutoWeather] = useState<WeatherCondition>('clear');

    // Manual overrides (used when mode === 'manual', or as fallbacks)
    const [manualTime, setManualTime] = useState<TimeOfDay>('day');
    const [manualWeather, setManualWeather] = useState<WeatherCondition>('clear');

    // Manual Location State (for Auto mode override)
    const [manualLocation, setManualLocation] = useState<string | null>(() => localStorage.getItem('theme_manual_location'));

    // Save manual location to storage
    useEffect(() => {
        if (manualLocation) localStorage.setItem('theme_manual_location', manualLocation);
        else localStorage.removeItem('theme_manual_location');
    }, [manualLocation]);

    // Error state
    const [geoError, setGeoError] = useState<string | null>(null);

    // Visual Settings State
    const [blurIntensity, setBlurIntensity] = useState<number>(() => {
        const saved = localStorage.getItem('theme_blur');
        return saved ? parseInt(saved) : 12; // default 12px
    });
    const [panelOpacity, setPanelOpacity] = useState<number>(() => {
        const saved = localStorage.getItem('theme_opacity');
        return saved ? parseFloat(saved) : 0.65; // default 0.65
    });

    // Save visual settings
    useEffect(() => {
        localStorage.setItem('theme_blur', blurIntensity.toString());
        localStorage.setItem('theme_opacity', panelOpacity.toString());
    }, [blurIntensity, panelOpacity]);

    // Effective state
    const timeOfDay = mode === 'auto' ? autoTime : manualTime;
    const weather = mode === 'auto' ? autoWeather : manualWeather;

    // 1. Logic to update CSS variables based on state
    useEffect(() => {
        const root = document.documentElement;

        // Reset base styles
        if (theme === 'gradient') {
            root.style.removeProperty('--bg-image');
            root.style.setProperty('--bg-overlay-opacity', '0');
        } else if (theme === 'forest') {
            // Logic to pick the best available asset based on time and weather
            let filename = `${timeOfDay}.png`; // default fallback

            if (weather === 'rain') {
                filename = `${timeOfDay}_rain.png`;
            } else if (weather === 'cloudy' && timeOfDay === 'day') {
                // only have day_cloudy so far
                filename = 'day_cloudy.png';
            }

            const imagePath = `/themes/forest/${filename}`;

            root.style.setProperty('--bg-image', `url('${imagePath}')`);

            // Adjust overlay for readability based on time
            const opacity = timeOfDay === 'night' ? '0.3' : '0.1';
            root.style.setProperty('--bg-overlay-opacity', opacity);
        }

    }, [theme, timeOfDay, weather, blurIntensity, panelOpacity]);

    // 2. Fetch Weather & Time (Open-Meteo)
    // 2. Fetch Weather & Time (Open-Meteo)
    useEffect(() => {
        if (mode !== 'auto') return;

        const fetchWeatherData = async (latitude: number, longitude: number) => {
            try {
                // Fetch from Open-Meteo (Free, No API Key)
                // Params: current=is_day,weather_code
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=is_day,weather_code&timezone=auto`
                );
                const data = await response.json();

                console.log("[WeatherDebug] Fetched:", {
                    lat: latitude,
                    long: longitude,
                    weatherCode: data.current?.weather_code,
                    is_day: data.current?.is_day,
                    fullData: data
                });

                if (data.current) {
                    setGeoError(null); // Clear previous errors if successful

                    // is_day: 1 = day, 0 = night
                    setAutoTime(data.current.is_day === 1 ? 'day' : 'night');

                    // Map WMO Weather Codes to our simplified types
                    // https://open-meteo.com/en/docs
                    const code = data.current.weather_code;
                    if (code >= 51 && code <= 67) setAutoWeather('rain'); // Drizzle/Rain
                    else if (code >= 80 && code <= 82) setAutoWeather('rain'); // Showers
                    else if (code >= 71 && code <= 77) setAutoWeather('snow');
                    else if (code >= 95) setAutoWeather('rain'); // Thunderstorm
                    else if (code >= 1 && code <= 3) setAutoWeather('cloudy');
                    else setAutoWeather('clear');
                }
            } catch (error) {
                console.error("Failed to fetch weather:", error);
                setGeoError("Failed to fetch weather data.");
            }
        };

        const resolveLocationAndFetch = async () => {
            // Case A: Manual Location set (Geocoding)
            if (manualLocation) {
                try {
                    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualLocation)}&count=1&language=en&format=json`);
                    const geoData = await geoResponse.json();

                    if (geoData.results && geoData.results.length > 0) {
                        const { latitude, longitude, name, country } = geoData.results[0];
                        console.log(`[GeoDebug] Resolved '${manualLocation}' to ${name}, ${country} (${latitude}, ${longitude})`);
                        await fetchWeatherData(latitude, longitude);
                    } else {
                        setGeoError(`Could not find location: "${manualLocation}"`);
                    }
                } catch (error) {
                    console.error("Geocoding error:", error);
                    setGeoError("Location search failed.");
                }
                return;
            }

            // Case B: Browser Geolocation
            if (!navigator.geolocation) {
                console.warn("Geolocation not supported");
                setGeoError("Geolocation not supported");
                return;
            }

            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                await fetchWeatherData(latitude, longitude);
            }, (error) => {
                const msg = error.code === 1 ? "Permission Denied. Use 'Manual Location' below." : error.message;
                console.warn("Geolocation permission denied or error:", error);
                setGeoError(msg);
            });
        };

        resolveLocationAndFetch();
        const interval = setInterval(resolveLocationAndFetch, 10 * 60 * 1000); // Poll every 10m

        return () => clearInterval(interval);
    }, [mode, manualLocation]);

    return (
        <ThemeContext.Provider value={{
            mode, setMode,
            theme, setTheme,
            timeOfDay,
            weather,
            setManualTime,
            setManualWeather,
            manualLocation,
            setManualLocation,
            geoError,
            blurIntensity,
            setBlurIntensity,
            panelOpacity,
            setPanelOpacity
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
}
