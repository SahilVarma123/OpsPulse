import React, { useRef, useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Compass,
  Layers,
  MapPin,
  ArrowRight,
  Crosshair,
  Maximize2,
  Minimize2,
  RefreshCw,
  Locate,
  Radio,
} from 'lucide-react';
import { ResourceItem } from '../types/resource.ts';

export interface RealFacilityNode {
  id: string;
  name: string;
  shortCode: string;
  type: 'Trauma Hospital' | 'Emergency Ward' | 'Care Pavilion' | 'Strategic Depot' | 'My Command Post';
  lat: number;
  lng: number;
  locationMatch: string;
  cluster: 'delhi' | 'bengaluru' | 'mumbai' | 'user';
}

const PRESET_FACILITIES: RealFacilityNode[] = [
  // Delhi NCR Medical Corridor
  {
    id: 'aiims-delhi',
    name: 'AIIMS Apex Trauma Center',
    shortCode: 'AIIMS-01',
    type: 'Trauma Hospital',
    lat: 28.5672,
    lng: 77.2100,
    locationMatch: 'Metro Central',
    cluster: 'delhi',
  },
  {
    id: 'safdarjung',
    name: 'Safdarjung Emergency Block',
    shortCode: 'SMC-02',
    type: 'Emergency Ward',
    lat: 28.5700,
    lng: 77.2075,
    locationMatch: 'Metro South',
    cluster: 'delhi',
  },
  {
    id: 'max-saket',
    name: 'Max Super Speciality Pavilion',
    shortCode: 'MAX-03',
    type: 'Care Pavilion',
    lat: 28.5284,
    lng: 77.2117,
    locationMatch: 'North Pavilion',
    cluster: 'delhi',
  },
  {
    id: 'fortis-okhla',
    name: 'Fortis Escorts Care Center',
    shortCode: 'FES-04',
    type: 'Care Pavilion',
    lat: 28.5603,
    lng: 77.2798,
    locationMatch: 'East Hub',
    cluster: 'delhi',
  },
  {
    id: 'medanta-gurugram',
    name: 'Medanta Strategic Logistics Depot',
    shortCode: 'MED-05',
    type: 'Strategic Depot',
    lat: 28.4395,
    lng: 77.0423,
    locationMatch: 'Central Hub',
    cluster: 'delhi',
  },
  {
    id: 'lnjp-hospital',
    name: 'LNJP Trauma Emergency Outpost',
    shortCode: 'LNJ-06',
    type: 'Emergency Ward',
    lat: 28.6366,
    lng: 77.2407,
    locationMatch: 'West Logistics',
    cluster: 'delhi',
  },

  // Bengaluru Health Corridor
  {
    id: 'victoria-blr',
    name: 'Victoria Trauma Hospital',
    shortCode: 'VIC-01',
    type: 'Trauma Hospital',
    lat: 12.9634,
    lng: 77.5753,
    locationMatch: 'Metro Central',
    cluster: 'bengaluru',
  },
  {
    id: 'nimhans-blr',
    name: 'NIMHANS Emergency Center',
    shortCode: 'NIM-02',
    type: 'Emergency Ward',
    lat: 12.9392,
    lng: 77.5956,
    locationMatch: 'Metro South',
    cluster: 'bengaluru',
  },
  {
    id: 'narayana-blr',
    name: 'Narayana Health City Depot',
    shortCode: 'NAR-03',
    type: 'Strategic Depot',
    lat: 12.8093,
    lng: 77.6974,
    locationMatch: 'Central Hub',
    cluster: 'bengaluru',
  },

  // Mumbai Emergency Zone
  {
    id: 'kem-mumbai',
    name: 'KEM Memorial Trauma Hospital',
    shortCode: 'KEM-01',
    type: 'Trauma Hospital',
    lat: 19.0024,
    lng: 72.8427,
    locationMatch: 'Metro Central',
    cluster: 'mumbai',
  },
  {
    id: 'lilavati-mumbai',
    name: 'Lilavati Emergency Center',
    shortCode: 'LIL-02',
    type: 'Emergency Ward',
    lat: 19.0518,
    lng: 72.8291,
    locationMatch: 'Metro South',
    cluster: 'mumbai',
  },
  {
    id: 'hinduja-mumbai',
    name: 'Hinduja Logistics Hub',
    shortCode: 'HIN-03',
    type: 'Strategic Depot',
    lat: 19.0330,
    lng: 72.8407,
    locationMatch: 'Central Hub',
    cluster: 'mumbai',
  },
];

// Calculate Haversine distance in kilometers
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

interface Real3DEventMapProps {
  resources: ResourceItem[];
  onNavigateToCoordination?: () => void;
}

export default function Real3DEventMap({
  resources,
  onNavigateToCoordination,
}: Real3DEventMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  // Active Cluster & Map Config
  const [selectedCluster, setSelectedCluster] = useState<'delhi' | 'bengaluru' | 'mumbai'>('delhi');
  const [tileLayerType, setTileLayerType] = useState<'carto-dark' | 'esri-satellite' | 'osm'>('carto-dark');
  const [is3DMode, setIs3DMode] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // User Real GPS Location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Node Selection & Transit Calculator
  const [selectedNode, setSelectedNode] = useState<RealFacilityNode | null>(PRESET_FACILITIES[0]);
  const [measureFromNode, setMeasureFromNode] = useState<RealFacilityNode | null>(PRESET_FACILITIES[4]);
  const [measureToNode, setMeasureToNode] = useState<RealFacilityNode | null>(PRESET_FACILITIES[1]);
  const [filterLayer, setFilterLayer] = useState<'all' | 'critical' | 'routes'>('all');

  // Compute live node deficit/surplus status based on telemetry
  const getNodeStatus = (node: RealFacilityNode) => {
    if (node.type === 'My Command Post') {
      return { status: 'user-post', deficits: [], surpluses: [], items: [] };
    }
    const matched = resources.filter((r) =>
      r.location.toLowerCase().includes(node.locationMatch.toLowerCase())
    );
    const deficits = matched.filter((r) => r.available < r.required);
    const surpluses = matched.filter((r) => r.available > r.required);
    const isCritical = deficits.some((d) => d.status === 'critical');

    const status = isCritical || deficits.length > 0 ? 'deficit' : surpluses.length > 0 ? 'surplus' : 'nominal';
    return { status, deficits, surpluses, items: matched };
  };

  // Combine Preset Facilities with User Real Location if available
  const activeFacilities = useMemo(() => {
    const list = PRESET_FACILITIES.filter((f) => f.cluster === selectedCluster);
    if (userLocation) {
      list.push({
        id: 'user-real-location',
        name: 'My Command Post (Live GPS)',
        shortCode: 'MY-GPS',
        type: 'My Command Post',
        lat: userLocation.lat,
        lng: userLocation.lng,
        locationMatch: 'Local Post',
        cluster: 'delhi',
      });
    }
    return list;
  }, [selectedCluster, userLocation]);

  // Request browser GPS real location
  const handleDetectLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const now = new Date().toLocaleTimeString();
        const detected = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          timestamp: now,
        };
        setUserLocation(detected);
        setIsLocating(false);

        // Fly camera to user's real location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, {
            duration: 1.5,
          });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationError(`Location detection: ${err.message}. Using default corridor.`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Delhi center
      const map = L.map(mapContainerRef.current, {
        center: [28.5672, 77.2100],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let subdomains = 'abcd';

    if (tileLayerType === 'esri-satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = 'abc';
    } else if (tileLayerType === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
    }

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains,
    });
    tileLayer.addTo(map);
  }, [tileLayerType]);

  // Center map when cluster changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedCluster === 'delhi') {
      map.flyTo([28.5672, 77.2100], 12, { duration: 1.2 });
    } else if (selectedCluster === 'bengaluru') {
      map.flyTo([12.9634, 77.5753], 12, { duration: 1.2 });
    } else if (selectedCluster === 'mumbai') {
      map.flyTo([19.0150, 72.8400], 12, { duration: 1.2 });
    }
  }, [selectedCluster]);

  // Render Markers and Shockwaves on Real Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routesLayer = routesLayerRef.current;
    if (!map || !markersLayer || !routesLayer) return;

    markersLayer.clearLayers();
    routesLayer.clearLayers();

    // 1. Render Facility Markers with Shockwave Beacons
    activeFacilities.forEach((facility) => {
      const { status, deficits } = getNodeStatus(facility);

      if (filterLayer === 'critical' && status !== 'deficit') {
        return;
      }

      // Build custom HTML Marker
      let badgeColor = 'bg-teal-600 border-teal-300 text-white';
      let haloColor = 'border-teal-500 bg-teal-500/20';
      let shockwaveHtml = '';

      if (status === 'deficit') {
        badgeColor = 'bg-rose-600 border-rose-300 text-white shadow-rose-950/80';
        haloColor = 'border-rose-500 bg-rose-500/30';
        // Pulsing Shockwave for Deficit Event Detection
        shockwaveHtml = `
          <div class="absolute -inset-6 rounded-full border border-rose-500/80 animate-ping pointer-events-none"></div>
          <div class="absolute -inset-3 rounded-full bg-rose-500/30 animate-pulse pointer-events-none"></div>
        `;
      } else if (status === 'surplus') {
        badgeColor = 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-950/80';
        haloColor = 'border-emerald-500 bg-emerald-500/20';
        shockwaveHtml = `<div class="absolute -inset-3 rounded-full bg-emerald-500/25 animate-pulse pointer-events-none"></div>`;
      } else if (status === 'user-post') {
        badgeColor = 'bg-amber-500 border-amber-200 text-slate-950 font-black shadow-amber-950/80';
        shockwaveHtml = `
          <div class="absolute -inset-8 rounded-full border-2 border-amber-400/90 animate-ping pointer-events-none"></div>
          <div class="absolute -inset-4 rounded-full bg-amber-400/30 animate-pulse pointer-events-none"></div>
        `;
      }

      const isSelected = selectedNode?.id === facility.id;

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group select-none">
          ${shockwaveHtml}
          <div class="relative w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] shadow-xl border-2 transition-transform duration-200 ${badgeColor} ${
        isSelected ? 'scale-125 ring-2 ring-white z-50' : 'group-hover:scale-110'
      }">
            ${facility.shortCode.split('-')[0]}
          </div>
          <div class="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-950/90 text-white text-[10px] font-bold tracking-tight border border-slate-700 whitespace-nowrap shadow-md pointer-events-none">
            ${facility.name.split(' ')[0]} ${deficits.length > 0 ? `<span class="text-rose-400">(${deficits.length} def)</span>` : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([facility.lat, facility.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedNode(facility);
      });
      marker.addTo(markersLayer);
    });

    // 2. Render Transfer Corridors (Curved Transit Lines between Nodes)
    if (filterLayer === 'all' || filterLayer === 'routes') {
      const donor = activeFacilities.find((f) => getNodeStatus(f).status === 'surplus') || activeFacilities[4];
      const deficit = activeFacilities.find((f) => getNodeStatus(f).status === 'deficit') || activeFacilities[1];

      if (donor && deficit && donor.id !== deficit.id) {
        const latlngs: [number, number][] = [
          [donor.lat, donor.lng],
          [deficit.lat, deficit.lng],
        ];

        // Polyline connecting donor to recipient
        const polyline = L.polyline(latlngs, {
          color: '#14B8A6',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8, 8',
        });
        polyline.addTo(routesLayer);

        // Marker for moving photon payload along corridor
        const midpoint: [number, number] = [
          (donor.lat + deficit.lat) / 2,
          (donor.lng + deficit.lng) / 2,
        ];

        const transitPulseIcon = L.divIcon({
          html: `<div class="w-3.5 h-3.5 rounded-full bg-white border-2 border-teal-400 shadow-lg shadow-teal-400/80 animate-ping"></div>`,
          className: 'transit-pulse-icon',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker(midpoint, { icon: transitPulseIcon }).addTo(routesLayer);
      }
    }
  }, [activeFacilities, filterLayer, selectedNode]);

  // Distance computation between measured nodes
  const distanceStats = useMemo(() => {
    if (!measureFromNode || !measureToNode) return null;
    const geodesicKm = calculateHaversineKm(
      measureFromNode.lat,
      measureFromNode.lng,
      measureToNode.lat,
      measureToNode.lng
    );
    const roadKm = parseFloat((geodesicKm * 1.28).toFixed(1)); // 1.28 urban road routing factor
    const ambulanceEtaMins = Math.max(Math.round((roadKm / 55) * 60), 2); // 55 km/h emergency response speed
    return { geodesicKm, roadKm, ambulanceEtaMins };
  }, [measureFromNode, measureToNode]);

  return (
    <div
      className={`relative rounded-2xl border border-teal-900/60 bg-gradient-to-b from-[#09221F] via-[#0B201D] to-[#071615] shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullScreen ? 'fixed inset-4 z-50' : 'w-full'
      }`}
    >
      {/* Real-time Map Header Bar */}
      <div className="relative border-b border-teal-900/60 bg-[#061514]/95 px-5 sm:px-7 py-3.5 flex flex-wrap items-center justify-between gap-4 z-20">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight">
              Real-Time Geospatial Operations Map
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-700/60 font-mono">
              LIVE GIS FEED
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Real geographic coordinates, live browser GPS location sync, and regional emergency transit corridors.
          </p>
        </div>

        {/* Cluster & Location Actions */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Detect User Real Location */}
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            title="Detect your device GPS real location and place your Command Post on the map"
          >
            <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting GPS...' : 'Detect My Real Location'}</span>
          </button>

          {/* Regional Cluster Selector */}
          <div className="flex items-center bg-[#071E1B] border border-teal-800/80 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setSelectedCluster('delhi')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                selectedCluster === 'delhi'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Delhi NCR
            </button>
            <button
              onClick={() => setSelectedCluster('bengaluru')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                selectedCluster === 'bengaluru'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bengaluru
            </button>
            <button
              onClick={() => setSelectedCluster('mumbai')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                selectedCluster === 'mumbai'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mumbai
            </button>
          </div>

          {/* 3D Drone Perspective vs 2D Plan View Toggle */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
              is3DMode
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60'
                : 'bg-[#071E1B] text-slate-300 border-teal-800 hover:text-white'
            }`}
          >
            <span>{is3DMode ? '3D Drone View: ON' : '2D Plan View'}</span>
          </button>

          {/* Basemap Tile Switcher */}
          <select
            value={tileLayerType}
            onChange={(e) => setTileLayerType(e.target.value as any)}
            className="bg-[#071E1B] text-slate-200 border border-teal-800/80 rounded-xl px-2.5 py-1 text-xs font-semibold cursor-pointer outline-none"
          >
            <option value="carto-dark">Carto Dark (ICCC)</option>
            <option value="esri-satellite">Satellite Imagery</option>
            <option value="osm">OpenStreetMap</option>
          </select>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-xl bg-[#071E1B] text-slate-300 hover:text-white border border-teal-800 cursor-pointer"
            title="Toggle fullscreen"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Real GPS Feedback Banner if active */}
      {userLocation && (
        <div className="bg-[#0A2E28] border-b border-teal-700/60 px-5 py-2 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold text-amber-300">Live GPS Connected:</span>
            <span>
              Lat: <strong>{userLocation.lat.toFixed(4)}°</strong>, Lng: <strong>{userLocation.lng.toFixed(4)}°</strong> (Accuracy ±{userLocation.accuracy}m)
            </span>
          </div>
          <span className="text-[11px] text-teal-300 font-mono">Synced at {userLocation.timestamp}</span>
        </div>
      )}

      {locationError && (
        <div className="bg-amber-950/60 border-b border-amber-800 px-5 py-1.5 text-xs text-amber-300">
          {locationError}
        </div>
      )}

      {/* Main Map View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[480px]">
        {/* Left 3 Columns: Leaflet Real Map with optional 3D Perspective Tilt */}
        <div className="lg:col-span-3 relative h-[440px] sm:h-[500px] overflow-hidden bg-[#051312]">
          <div
            className={`w-full h-full transition-transform duration-500 ease-out origin-bottom ${
              is3DMode ? 'scale-[1.08] perspective-[1100px] [transform:rotateX(34deg)_rotateZ(-2deg)] shadow-2xl' : ''
            }`}
          >
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Floating Map Overlay: Filter & Live Telemetry Controls */}
          <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-1.5 bg-[#061514]/90 border border-teal-800/80 p-1 rounded-xl shadow-lg backdrop-blur-md text-xs">
            <button
              onClick={() => setFilterLayer('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterLayer === 'all'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Facilities ({activeFacilities.length})
            </button>
            <button
              onClick={() => setFilterLayer('critical')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterLayer === 'critical'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Deficits Only
            </button>
            <button
              onClick={() => setFilterLayer('routes')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterLayer === 'routes'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transfer Corridors
            </button>
          </div>

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 left-4 z-[400] p-3 rounded-xl bg-[#061514]/90 border border-teal-900/80 text-[11px] text-slate-300 space-y-1.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Critical Deficit (Expanding Shockwave)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Surplus Donor Facility</span>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-300 font-bold">My Real Location (GPS Beacon)</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-teal-400" />
              <span>Active Resource Transit Arc</span>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Telemetry Inspector & Point-to-Point Calculator */}
        <div className="border-t lg:border-t-0 lg:border-l border-teal-900/60 bg-[#08221E] p-5 flex flex-col justify-between space-y-5">
          {/* Facility Inspector Card */}
          {selectedNode ? (
            (() => {
              const { status, deficits, surpluses, items } = getNodeStatus(selectedNode);

              return (
                <div className="space-y-4">
                  <div className="border-b border-teal-900/60 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-teal-400 font-bold">
                        {selectedNode.shortCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          status === 'deficit'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : status === 'surplus'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : status === 'user-post'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-teal-950 text-teal-300 border border-teal-800'
                        }`}
                      >
                        {status === 'deficit'
                          ? 'Deficit Alert'
                          : status === 'surplus'
                            ? 'Surplus Donor'
                            : status === 'user-post'
                              ? 'GPS Command Post'
                              : 'Nominal'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white font-heading mt-1">
                      {selectedNode.name}
                    </h3>

                    <div className="mt-1 text-[11px] text-slate-400 font-mono">
                      GPS: {selectedNode.lat.toFixed(4)}°N, {selectedNode.lng.toFixed(4)}°E
                    </div>
                  </div>

                  {/* Deficit Alert Warning */}
                  {deficits.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 space-y-1.5">
                      <span className="text-xs font-bold text-rose-300 block">
                        Active Deficit ({deficits.length} items)
                      </span>
                      {deficits.map((d) => (
                        <div key={d.id} className="text-xs text-slate-200 flex justify-between">
                          <span>{d.name}:</span>
                          <span className="text-rose-400 font-bold">
                            {d.available} / {d.required} {d.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Surplus Items */}
                  {surpluses.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5">
                      <span className="text-xs font-bold text-emerald-300 block">
                        Buffer Capacity ({surpluses.length} items)
                      </span>
                      {surpluses.map((s) => (
                        <div key={s.id} className="text-xs text-slate-200 flex justify-between">
                          <span>{s.name}:</span>
                          <span className="text-emerald-400 font-bold">
                            +{s.available - s.required} {s.unit} surplus
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Local Inventory List */}
                  {items.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
                        Telemetry Streams:
                      </span>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {items.map((it) => (
                          <div
                            key={it.id}
                            className="p-1.5 rounded-lg bg-[#061816] border border-teal-900/60 flex items-center justify-between text-xs"
                          >
                            <span className="truncate text-slate-300">{it.name}</span>
                            <span className="text-slate-400 shrink-0 font-mono font-medium">
                              {it.available} {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Click any hospital node on the real map to inspect telemetry
            </div>
          )}

          {/* Real-Time Point-to-Point Distance & Transit Calculator */}
          <div className="pt-3 border-t border-teal-900/60 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading block">
              Transit & Distance Routing
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block font-medium mb-1">From (Origin):</label>
                <select
                  value={measureFromNode?.id || ''}
                  onChange={(e) => {
                    const node = activeFacilities.find((f) => f.id === e.target.value);
                    if (node) setMeasureFromNode(node);
                  }}
                  className="w-full bg-[#061816] border border-teal-800 text-white rounded-lg p-1.5 text-xs"
                >
                  {activeFacilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name.split(' ')[0]} ({f.shortCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block font-medium mb-1">To (Destination):</label>
                <select
                  value={measureToNode?.id || ''}
                  onChange={(e) => {
                    const node = activeFacilities.find((f) => f.id === e.target.value);
                    if (node) setMeasureToNode(node);
                  }}
                  className="w-full bg-[#061816] border border-teal-800 text-white rounded-lg p-1.5 text-xs"
                >
                  {activeFacilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name.split(' ')[0]} ({f.shortCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Distance Results Box */}
            {distanceStats && (
              <div className="p-3 rounded-xl bg-[#061816] border border-teal-900/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Road Corridor Distance:</span>
                  <span className="text-teal-300 font-bold font-mono">{distanceStats.roadKm} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Straight-Line Geodesic:</span>
                  <span className="text-slate-300 font-mono">{distanceStats.geodesicKm} km</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-teal-900/60">
                  <span className="text-amber-400 font-bold">Ambulance ETA:</span>
                  <span className="text-amber-300 font-black font-mono">
                    ~{distanceStats.ambulanceEtaMins} mins
                  </span>
                </div>
              </div>
            )}

            {/* Action CTA */}
            {onNavigateToCoordination && (
              <button
                onClick={onNavigateToCoordination}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 transition-all cursor-pointer"
              >
                <span>Authorize Transit on Coordination Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
