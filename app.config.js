// app.config.js
import 'dotenv/config';

export default ({ config }) => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.EXPO_PUBLIC_MAP_ID || 'DEMO_MAP_ID';

    // Optional debug to your terminal on startup:
    console.log('[app.config.js] GOOGLE_MAPS_API_KEY present?', Boolean(apiKey));
    if (apiKey) console.log('[app.config.js] key starts with:', apiKey.slice(0, 6));

    return {
        ...config,
        extra: {
            ...(config.extra || {}),
            GOOGLE_MAPS_API_KEY: apiKey,
            MAP_ID: mapId,
        },
    };
};
