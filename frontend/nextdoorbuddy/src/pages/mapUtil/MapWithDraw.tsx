import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import { useEffect } from 'react';

const MapWithDraw = () => {
    useEffect(() => {
        const map = L.map('map').setView([48.8566, 2.3522], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            draw: {
                polyline: false,
                rectangle: false,
                circle: false,
                marker: false,
                circlemarker: false,
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                },
            },
            edit: {
                featureGroup: drawnItems,
            },
        });
        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, (event: any) => {
            const layer = event.layer;
            drawnItems.addLayer(layer);
            const geojson = layer.toGeoJSON();
            console.log('Polygon GeoJSON:', geojson);

            // POST vers le backend
            fetch('/api/quartiers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'Quartier A',
                    geometry: geojson.geometry, // On envoie uniquement la géométrie
                }),
            });
        });
    }, []);

    return <div id="map" style={{ height: '500px', width: '100%' }} />;
};

export default MapWithDraw;
