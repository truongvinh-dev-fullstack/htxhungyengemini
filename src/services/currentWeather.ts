const weatherLabel = (code: number): string => {
  if (code === 0) return 'Trời quang';
  if ([1, 2].includes(code)) return 'Ít mây';
  if (code === 3) return 'Nhiều mây';
  if ([45, 48].includes(code)) return 'Có sương mù';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Mưa phùn';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Có mưa';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Có tuyết';
  if ([95, 96, 99].includes(code)) return 'Có dông';
  return 'Thời tiết thay đổi';
};

interface CurrentWeather {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
}

export interface WeatherSuggestion {
  text: string;
  observedAt: string;
}

export const getCurrentWeatherSuggestion = async (): Promise<WeatherSuggestion> => {
  // Demo chỉ có frontend: API getLocation của Zalo trả token, cần server đổi thành tọa độ.
  // Dùng Web Geolocation khi WebView cho phép; form vẫn có nhập tay nếu không lấy được vị trí.
  if (!navigator.geolocation) throw new Error('Thiết bị không hỗ trợ định vị.');

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    });
  });

  const query = new URLSearchParams({
    latitude: String(position.coords.latitude),
    longitude: String(position.coords.longitude),
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
  if (!response.ok) throw new Error('Không lấy được dữ liệu thời tiết.');
  const data = await response.json() as { current?: CurrentWeather };
  if (!data.current || !Number.isFinite(data.current.temperature_2m)) {
    throw new Error('Dữ liệu thời tiết không hợp lệ.');
  }

  const current = data.current;
  const details = [
    `${weatherLabel(current.weather_code)} ${Math.round(current.temperature_2m)}°C`,
    `độ ẩm ${Math.round(current.relative_humidity_2m)}%`,
    `gió ${Math.round(current.wind_speed_10m)} km/h`,
  ];
  if (current.precipitation > 0) details.push(`mưa ${current.precipitation} mm`);
  return { text: details.join(', '), observedAt: current.time };
};
