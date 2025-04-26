import L from 'leaflet';
import "leaflet/dist/leaflet.css";

export function useMap() {
    window.L = L;

    const mapsList = {
        stadia: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
        carto: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        cartoLight: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        cartoDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        openstreetmap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        wikimedia: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",
        voyager: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        stamenToner: "https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
        watercolor: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}{r}.jpg",
        stadia2: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    };

    const heartIcon = L.divIcon({
        html: `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>`,
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });

    const defaultIcon = L.icon({
        iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    const initializeLeaflet = () => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
            iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
            shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
        });
    };

    const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('User location:', latitude, longitude);
                        resolve({ latitude, longitude });
                    },
                    (error) => {
                        console.warn('Location error, using default:', error);
                        reject(error);
                    }
                );
            } else {
                reject(new Error('Geolocation not supported by this browser.'));
            }
        });
    };

    return {
        initializeLeaflet,
        getUserLocation,
        mapsList,
        heartIcon,
        defaultIcon,
    };
}
