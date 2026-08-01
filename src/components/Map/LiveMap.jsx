import { useState, useEffect, useRef } from 'react';
import { Map, MapMarker, MarkerContent, MapControls } from '@/components/ui/map';
import { Layers } from 'lucide-react';

const openStreetMapStyle = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const mapStyles = {
  default: undefined,
  openstreetmap: openStreetMapStyle,
  openstreetmap3d: 'https://demotiles.maplibre.org/style.json',
};

const DEFAULT_CENTER = [83.2185, 17.6868]; // Visakhapatnam
const DEFAULT_ZOOM = 14;

export default function LiveMap({
  complaints = [],
  sensorEvents = [],
  fieldTeams = [],
  selectedIncident = null,
  onMarkerClick,
}) {
  const mapRef = useRef(null);
  const [styleKey, setStyleKey] = useState('default');
  const selectedStyle = mapStyles[styleKey];
  const is3D = styleKey === 'openstreetmap3d';

  // Toggle 3D pitch tilt on style change
  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 600 });
  }, [is3D]);

  // Fly to selected incident marker
  useEffect(() => {
    if (!mapRef.current || !selectedIncident) return;

    const lng = selectedIncident.longitude || selectedIncident.location?.lng || DEFAULT_CENTER[0];
    const lat = selectedIncident.latitude || selectedIncident.location?.lat || DEFAULT_CENTER[1];

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      duration: 1000,
      essential: true,
    });
  }, [selectedIncident]);

  return (
    <div className="map-container relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden shadow-lg border border-[#d4cc9a]">
      {/* Interactive Map */}
      <Map
        ref={mapRef}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        pitch={is3D ? 60 : 0}
        bearing={0}
        styles={
          selectedStyle
            ? { light: selectedStyle, dark: selectedStyle }
            : undefined
        }
      >
        <MapControls position="bottom-right" showZoom showCompass />

        {/* Complaint Markers */}
        {complaints.map((c) => {
          const id = c.id || c.complaint_id;
          const lng = c.longitude || c.location?.lng || DEFAULT_CENTER[0];
          const lat = c.latitude || c.location?.lat || DEFAULT_CENTER[1];
          const title = c.title || c.description || 'Incident';
          const isCritical = c.priority === 'CRITICAL' || c.priority === 'HIGH';

          return (
            <MapMarker
              key={`complaint-${id}`}
              longitude={lng}
              latitude={lat}
              onClick={() => onMarkerClick?.('complaint', c)}
            >
              <MarkerContent>
                <div
                  className="relative group flex items-center justify-center cursor-pointer transition-transform hover:scale-125"
                  title={`${title} (${id})`}
                >
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCritical ? 'bg-red-500 opacity-75' : 'bg-amber-500 opacity-60'}`}></span>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: isCritical ? '#e63946' : '#dda15e',
                      border: '3px solid #ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
              </MarkerContent>
            </MapMarker>
          );
        })}

        {/* Field Team Markers */}
        {fieldTeams.map((team) => {
          const id = team.id || team.team_id;
          const lng = team.longitude || team.location?.lng || team.currentLng || DEFAULT_CENTER[0] + 0.005;
          const lat = team.latitude || team.location?.lat || team.currentLat || DEFAULT_CENTER[1] + 0.005;
          const name = team.name || team.team_id || 'Field Team';

          return (
            <MapMarker
              key={`team-${id}`}
              longitude={lng}
              latitude={lat}
              onClick={() => onMarkerClick?.('team', team)}
            >
              <MarkerContent>
                <div
                  className="flex items-center justify-center cursor-pointer transition-transform hover:scale-125"
                  title={`Field Team: ${name}`}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '8px',
                      background: '#2563eb',
                      border: '2.5px solid #ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    🛡️
                  </div>
                </div>
              </MarkerContent>
            </MapMarker>
          );
        })}

        {/* Sensor Event Markers */}
        {sensorEvents.map((sns) => {
          const id = sns.id || `SNS-${Math.random()}`;
          const lng = sns.longitude || sns.lng || DEFAULT_CENTER[0] - 0.004;
          const lat = sns.latitude || sns.lat || DEFAULT_CENTER[1] - 0.003;

          return (
            <MapMarker
              key={`sensor-${id}`}
              longitude={lng}
              latitude={lat}
              onClick={() => onMarkerClick?.('sensor', sns)}
            >
              <MarkerContent>
                <div
                  className="flex items-center justify-center cursor-pointer transition-transform hover:scale-125"
                  title={`Sensor Node: ${sns.type || sns.id}`}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#bc6c25',
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}
                  />
                </div>
              </MarkerContent>
            </MapMarker>
          );
        })}
      </Map>

      {/* Style Switcher Selector matching Landing Page */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#faf5d0]/95 backdrop-blur border border-[#d4cc9a] p-1.5 rounded-xl shadow-md">
        <Layers size={15} className="text-[#bc6c25] ml-1" />
        <select
          value={styleKey}
          onChange={(e) => setStyleKey(e.target.value)}
          className="bg-transparent text-[#283618] text-xs font-extrabold focus:outline-none cursor-pointer pr-1"
        >
          <option value="default">Default (Carto Voyager)</option>
          <option value="openstreetmap">OpenStreetMap Raster</option>
          <option value="openstreetmap3d">OpenStreetMap 3D Pitch</option>
        </select>
      </div>
    </div>
  );
}
