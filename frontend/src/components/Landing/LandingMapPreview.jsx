import { useState, useEffect, useRef } from "react";
import { Map } from "@/components/ui/map";

const openStreetMapStyle = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: "osm-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const styles = {
  default: undefined,
  openstreetmap: openStreetMapStyle,
  openstreetmap3d: "https://demotiles.maplibre.org/style.json",
};

export default function LandingMapPreview() {
  const mapRef = useRef(null);
  const [style, setStyle] = useState("default");
  const selectedStyle = styles[style];
  const is3D = style === "openstreetmap3d";

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 500 });
  }, [is3D]);

  return (
    <section id="gis-map" className="py-28 px-6 bg-[#fefae0]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#bc6c25]">
            GIS Heatmap & Routing Matrix
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#283618] tracking-tight mt-2">
            Interactive Pilot Zone View
          </h2>
        </div>

        <div className="h-[460px] rounded-3xl overflow-hidden border border-[#d4cc9a] shadow-xl relative">
          <Map
            ref={mapRef}
            center={[83.2185, 17.6868]}
            zoom={14}
            styles={
              selectedStyle
                ? { light: selectedStyle, dark: selectedStyle }
                : undefined
            }
          />
          <div className="absolute top-4 right-4 z-10">
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="bg-[#faf5d0] text-[#283618] rounded-md border border-[#d4cc9a] px-3 py-1.5 text-sm shadow font-semibold focus:outline-none cursor-pointer"
            >
              <option value="default">Default (Carto)</option>
              <option value="openstreetmap">OpenStreetMap</option>
              <option value="openstreetmap3d">OpenStreetMap 3D</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
