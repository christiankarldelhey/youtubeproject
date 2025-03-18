import L from 'leaflet';
import "leaflet/dist/leaflet.css";

export function useMap() {

    window.L = L;
    
    const initializeLeaflet = () => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
            iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
            shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
        });
    };

    const mapsList = {
        stadia: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
        carto: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        cartoDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        openstreetmap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        wikimedia: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",
        voyager: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        stamenToner: "https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
        watercolor: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}{r}.jpg",
        stadia2: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    }

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
    };
}
