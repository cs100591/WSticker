
export interface WeatherData {
    temperature: number;
    weatherCode: number;
    isDay: number; // 1 for day, 0 for night
}

export const weatherService = {
    async getWeather(lat: number, lon: number): Promise<WeatherData | null> {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            const data = await response.json();

            if (data.current_weather) {
                return {
                    temperature: data.current_weather.temperature,
                    weatherCode: data.current_weather.weathercode,
                    isDay: data.current_weather.is_day,
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching weather:', error);
            return null;
        }
    },

    getGreetingAndEmoji(weather: WeatherData | null): { greeting: string; emoji: string } {
        const hour = new Date().getHours();
        let timeGreeting = 'Good day';
        if (hour < 12) timeGreeting = 'Good morning';
        else if (hour < 18) timeGreeting = 'Good afternoon';
        else timeGreeting = 'Good evening';

        if (!weather) {
            return { greeting: timeGreeting, emoji: '👋' };
        }

        const { weatherCode, temperature } = weather;

        // Very hot?
        if (temperature > 30) return { greeting: "It's a hot one!", emoji: '🥵' };

        // Very cold?
        if (temperature < 0) return { greeting: "Brrr, it's cold!", emoji: '🥶' };

        // Weather codes
        // 0: Clear sky
        if (weatherCode === 0) return { greeting: "Sunshine today!", emoji: '☀️' };

        // 1-3: Cloudy
        if (weatherCode >= 1 && weatherCode <= 3) return { greeting: "Nice & cloudy", emoji: '⛅' };

        // 51-67: Rain / Drizzle
        if (weatherCode >= 51 && weatherCode <= 67) return { greeting: "Don't forget an umbrella!", emoji: '☔️' };

        // 71-77: Snow
        if (weatherCode >= 71 && weatherCode <= 77) return { greeting: "Snow day!", emoji: '❄️' };

        // 80-99: Showers / Thunderstorm
        if (weatherCode >= 80) return { greeting: "Stormy weather!", emoji: '⚡️' };

        return { greeting: timeGreeting, emoji: '👋' };
    }
};
