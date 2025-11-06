import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
  FeatureGroup
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "./App.css";

// Leaftlet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Center map
function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 13);
    }
  }, [lat, lon, map]);
  return null;
}

function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [position, setPosition] = useState([40.4168, -3.7038]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [drawnLayers, setDrawnLayers] = useState([]); // ahora se usa

  const fetchSuggestions = async (text) => {
    if (!text) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          text
        )}&addressdetails=1&limit=5`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setPosition([lat, lon]);
    setMarkerPosition([lat, lon]);
    setSelectedAddress(place.display_name);
    setQuery(place.display_name);
    setSuggestions([]);
  };

  const handleSearch = async () => {
    if (!query) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        handleSelect(data[0]);
      } else {
        alert("Address not found :(");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const { BaseLayer, Overlay } = LayersControl;

  // Polygon management
  const onCreated = (e) => {
    const layer = e.layer;
    setDrawnLayers((prev) => [...prev, layer]);
    console.log("Polygon created :", layer.getLatLngs());
  };

  const onDeleted = (e) => {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      setDrawnLayers((prev) => prev.filter((l) => l !== layer));
    });
  };

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {/* Banner */}
      <div className="banner">
        Urban Access Viewer
        <div className="input-container">
          <input
            type="text"
            placeholder="Search an address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>

          {suggestions.length > 0 && (
            <ul className="autocomplete-list">
              {suggestions.map((place) => (
                <li key={place.place_id} onClick={() => handleSelect(place)}>
                  {place.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Map + Layers + Poly */}
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "90%", width: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer name="OSM classic">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OSM'
            />
          </BaseLayer>
          <BaseLayer name="Dark">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OSM &copy; CARTO"
              subdomains="abcd"
              maxZoom={19}
            />
          </BaseLayer>
          <BaseLayer checked name="Gray">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OSM &copy; CARTO"
              subdomains="abcd"
              maxZoom={19}
            />
          </BaseLayer>

          {markerPosition && (
            <Overlay checked name="Marker">
              <Marker position={markerPosition}>
                <Popup>{selectedAddress}</Popup>
              </Marker>
            </Overlay>
          )}
        </LayersControl>

        {/* Poly */}
        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={onCreated}
            onDeleted={onDeleted}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                showArea: true,
                drawError: { color: "red", timeout: 1000 },
                shapeOptions: { color: "purple", fillColor: "purple", fillOpacity: 0.3 },
              },
            }}
            edit={{
              edit: true,
              remove: true,
            }}
          />
        </FeatureGroup>

        <RecenterMap lat={position[0]} lon={position[1]} />
      </MapContainer>

      {/* Poly coords. */}
      {drawnLayers.length > 0 && (
        <div style={{ padding: "10px", background: "#222", color: "white" }}>
          <h4>Polígonos dibujados:</h4>
          {drawnLayers.map((layer, i) => (
            <pre key={i}>{JSON.stringify(layer.getLatLngs(), null, 2)}</pre>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
