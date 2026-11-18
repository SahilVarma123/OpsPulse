import React, { useRef, useEffect, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Compass,
  MapPin,
  ArrowRight,
  Maximize2,
  Minimize2,
  Locate,
  Layers,
  RotateCw,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { ResourceItem } from '../types/resource.ts';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

mapboxgl.accessToken = MAPBOX_TOKEN;

export interface RealFacilityNode {
  id: string;
  name: string;
  shortCode: string;
  type: 'Trauma Hospital' | 'Emergency Ward' | 'Care Pavilion' | 'Strategic Depot' | 'My Command Post';
  lat: number;
  lng: number;
  locationMatch: string;
  cluster: 'delhi' | 'bengaluru' | 'mumbai';
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

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || 'Error displaying 3D map' };
  }

  componentDidCatch(error: any, info: any) {
    console.error('3D Map Error Boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-teal-900/60 bg-gradient-to-b from-[#09221F] via-[#0B201D] to-[#071615] p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-700 text-teal-400 flex items-center justify-center mx-auto shadow-lg">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white font-heading">Geospatial 3D Map Display</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {this.state.error}. Click below to reload the 3D map view.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload 3D Map</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Real3DEventMapWrapper(props: Real3DEventMapProps) {
  return (
    <MapErrorBoundary>
      <Real3DEventMapContent {...props} />
    </MapErrorBoundary>
  );
}

function Real3DEventMapContent({
  resources,
  onNavigateToCoordination,
}: Real3DEventMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const currentStyleRef = useRef<string>('mapbox://styles/mapbox/dark-v11');

  // Map state
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapInitError, setMapInitError] = useState<string | null>(null);

  // Cluster & Styles
  const [selectedCluster, setSelectedCluster] = useState<'delhi' | 'bengaluru' | 'mumbai'>('delhi');
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [isAutoOrbit, setIsAutoOrbit] = useState(false);
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

  // Selection & Filters
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

  // Request browser GPS real location and fly with 3D tilt
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

        if (mapRef.current && isMapReady) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15.8,
            pitch: 65,
            bearing: 25,
            duration: 2500,
            essential: true,
          });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationError(`Location detection: ${err.message}. Showing regional network.`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Helper to add 3D extruded buildings layer safely
  const add3DBuildingsLayer = (map: mapboxgl.Map) => {
    try {
      if (!map || !map.isStyleLoaded()) return;
      if (map.getLayer('add-3d-buildings')) return;

      const style = map.getStyle();
      if (!style || !style.layers) return;

      let labelLayerId: string | undefined;
      for (const layer of style.layers) {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          labelLayerId = layer.id;
          break;
        }
      }

      map.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'height'],
              0,
              '#0A2420',
              30,
              '#0E332D',
              70,
              '#13453D',
              150,
              '#195C51',
              300,
              '#217A6C',
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              14.05,
              ['get', 'height'],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              14.05,
              ['get', 'min_height'],
            ],
            'fill-extrusion-opacity': 0.9,
          },
        },
        labelLayerId
      );
    } catch (err) {
      console.warn('3D buildings addition error:', err);
    }
  };

  // Safe Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const initialCenter: [number, number] = [77.2100, 28.5672]; // Delhi AIIMS

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: initialCenter,
        zoom: 14.2,
        pitch: 60,
        bearing: -18,
        antialias: true,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.on('load', () => {
        setIsMapReady(true);
        try {
          map.setFog({
            color: 'rgb(7, 21, 20)',
            'high-color': 'rgb(11, 32, 29)',
            'horizon-blend': 0.12,
            'space-color': 'rgb(4, 12, 11)',
            'star-intensity': 0.4,
          });
          add3DBuildingsLayer(map);
        } catch (e) {
          console.warn('Fog / 3D setup note:', e);
        }
      });

      map.on('error', (e) => {
        console.warn('Mapbox internal event:', e);
      });

      mapRef.current = map;

      return () => {
        setIsMapReady(false);
        map.remove();
        mapRef.current = null;
      };
    } catch (err: any) {
      console.error('Failed to initialize Mapbox GL:', err);
      setMapInitError(err?.message || 'Failed to initialize WebGL 3D Map');
    }
  }, []);

  // Safe Style Change (Dark / Satellite / Streets)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    let targetStyle = 'mapbox://styles/mapbox/dark-v11';
    if (mapStyle === 'satellite') {
      targetStyle = 'mapbox://styles/mapbox/satellite-streets-v12';
    } else if (mapStyle === 'streets') {
      targetStyle = 'mapbox://styles/mapbox/streets-v12';
    }

    if (currentStyleRef.current === targetStyle) return;
    currentStyleRef.current = targetStyle;

    try {
      map.setStyle(targetStyle);
      map.once('style.load', () => {
        add3DBuildingsLayer(map);
      });
    } catch (e) {
      console.warn('Error setting map style:', e);
    }
  }, [mapStyle, isMapReady]);

  // Center camera when cluster changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    if (selectedCluster === 'delhi') {
      map.flyTo({ center: [77.2100, 28.5672], zoom: 14.2, pitch: 60, bearing: -18, duration: 1800 });
    } else if (selectedCluster === 'bengaluru') {
      map.flyTo({ center: [77.5753, 12.9634], zoom: 14.5, pitch: 60, bearing: 20, duration: 1800 });
    } else if (selectedCluster === 'mumbai') {
      map.flyTo({ center: [72.8427, 19.0024], zoom: 14.5, pitch: 62, bearing: -35, duration: 1800 });
    }
  }, [selectedCluster, isMapReady]);

  // Continuous 3D Drone Cinematic Orbit
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !isAutoOrbit) return;

    let animId: number;
    const rotateCamera = () => {
      if (!isAutoOrbit) return;
      map.setBearing((map.getBearing() + 0.15) % 360);
      animId = requestAnimationFrame(rotateCamera);
    };

    animId = requestAnimationFrame(rotateCamera);
    return () => cancelAnimationFrame(animId);
  }, [isAutoOrbit, isMapReady]);

  // Render 3D Markers & Corridors safely when map is ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add 3D Facility Markers
    activeFacilities.forEach((facility) => {
      const { status, deficits } = getNodeStatus(facility);

      if (filterLayer === 'critical' && status !== 'deficit') {
        return;
      }

      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer group select-none';

      let badgeBg = 'bg-teal-600 border-teal-300 text-white';
      let shockwaveHtml = '';

      if (status === 'deficit') {
        badgeBg = 'bg-rose-600 border-rose-300 text-white shadow-rose-950/80';
        shockwaveHtml = `
          <div class="absolute -inset-8 rounded-full border-2 border-rose-500/90 animate-ping pointer-events-none"></div>
          <div class="absolute -inset-4 rounded-full bg-rose-500/35 animate-pulse pointer-events-none"></div>
        `;
      } else if (status === 'surplus') {
        badgeBg = 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-950/80';
        shockwaveHtml = `<div class="absolute -inset-4 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none"></div>`;
      } else if (status === 'user-post') {
        badgeBg = 'bg-amber-500 border-amber-200 text-slate-950 font-black shadow-amber-950/80';
        shockwaveHtml = `
          <div class="absolute -inset-10 rounded-full border-2 border-amber-400/90 animate-ping pointer-events-none"></div>
          <div class="absolute -inset-5 rounded-full bg-amber-400/40 animate-pulse pointer-events-none"></div>
        `;
      }

      const isSelected = selectedNode?.id === facility.id;

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${shockwaveHtml}
          <div class="relative w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] shadow-2xl border-2 transition-transform duration-200 ${badgeBg} ${
        isSelected ? 'scale-125 ring-2 ring-white z-50' : 'group-hover:scale-110'
      }">
            ${facility.shortCode.split('-')[0]}
          </div>
          <div class="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-950/95 text-white text-[10px] font-bold tracking-tight border border-slate-700 whitespace-nowrap shadow-md pointer-events-none">
            ${facility.name.split(' ')[0]} ${deficits.length > 0 ? `<span class="text-rose-400">(${deficits.length} def)</span>` : ''}
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedNode(facility);
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [facility.lng, facility.lat],
            zoom: 15.5,
            pitch: 65,
            duration: 1200,
          });
        }
      });

      try {
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([facility.lng, facility.lat])
          .addTo(map);
        markersRef.current.push(marker);
      } catch (err) {
        console.warn('Marker addition error:', err);
      }
    });

    // Safely add Transfer Corridor GeoJSON line
    try {
      if (!map.isStyleLoaded()) return;

      const donor = activeFacilities.find((f) => getNodeStatus(f).status === 'surplus') || activeFacilities[4];
      const deficit = activeFacilities.find((f) => getNodeStatus(f).status === 'deficit') || activeFacilities[1];

      const lineSourceId = 'transit-corridor-source';
      const lineLayerId = 'transit-corridor-line';

      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getSource(lineSourceId)) map.removeSource(lineSourceId);

      if (donor && deficit && donor.id !== deficit.id && (filterLayer === 'all' || filterLayer === 'routes')) {
        map.addSource(lineSourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [donor.lng, donor.lat],
                [(donor.lng + deficit.lng) / 2 + 0.005, (donor.lat + deficit.lat) / 2 + 0.005],
                [deficit.lng, deficit.lat],
              ],
            },
          },
        });

        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: lineSourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#14B8A6',
            'line-width': 4,
            'line-opacity': 0.85,
            'line-dasharray': [3, 2],
          },
        });
      }
    } catch (e) {
      console.warn('Corridor line drawing note:', e);
    }
  }, [activeFacilities, filterLayer, selectedNode, isMapReady]);

  // Distance computation between measured nodes
  const distanceStats = useMemo(() => {
    if (!measureFromNode || !measureToNode) return null;
    const geodesicKm = calculateHaversineKm(
      measureFromNode.lat,
      measureFromNode.lng,
      measureToNode.lat,
      measureToNode.lng
    );
    const roadKm = parseFloat((geodesicKm * 1.28).toFixed(1));
    const ambulanceEtaMins = Math.max(Math.round((roadKm / 55) * 60), 2);
    return { geodesicKm, roadKm, ambulanceEtaMins };
  }, [measureFromNode, measureToNode]);

  // Camera presets
  const handleCameraPreset = (preset: '3d-tilt' | 'birds-eye' | 'top-down') => {
    const map = mapRef.current;
    if (!map) return;

    if (preset === '3d-tilt') {
      map.easeTo({ pitch: 65, bearing: -25, zoom: 15.2, duration: 1000 });
    } else if (preset === 'birds-eye') {
      map.easeTo({ pitch: 45, bearing: 0, zoom: 14.5, duration: 1000 });
    } else if (preset === 'top-down') {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
    }
  };

  if (mapInitError) {
    return (
      <div className="rounded-2xl border border-rose-900/60 bg-gradient-to-b from-[#180A0A] to-[#0A0606] p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-700 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white font-heading">3D Map Initialization Notice</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          {mapInitError}. Please verify that your device has WebGL hardware acceleration enabled.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload 3D Geospatial Map</span>
        </button>
      </div>
    );
  }

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
              Real 3D Geospatial Operations Map
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-700/60 font-mono">
              3D EXTRUDED GIS
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Photorealistic 3D city buildings, real GPS detection, 360° pitch orbit, and active emergency transit corridors.
          </p>
        </div>

        {/* Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Detect User Real Location */}
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            title="Detect device GPS real location and fly 3D camera to your location"
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

          {/* 3D Camera Angles */}
          <div className="flex items-center bg-[#071E1B] border border-teal-800/80 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => handleCameraPreset('3d-tilt')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-teal-900 transition-colors cursor-pointer font-medium"
              title="65° 3D Isometric View"
            >
              3D Tilt
            </button>
            <button
              onClick={() => handleCameraPreset('birds-eye')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-teal-900 transition-colors cursor-pointer font-medium"
              title="45° Bird's Eye View"
            >
              Bird's Eye
            </button>
            <button
              onClick={() => handleCameraPreset('top-down')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-teal-900 transition-colors cursor-pointer font-medium"
              title="2D Top-Down View"
            >
              Top-Down
            </button>
          </div>

          {/* 3D Drone Cinematic Orbit Toggle */}
          <button
            onClick={() => setIsAutoOrbit(!isAutoOrbit)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
              isAutoOrbit
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 shadow-sm'
                : 'bg-[#071E1B] text-slate-300 border-teal-800 hover:text-white'
            }`}
            title="Continuous 360° drone camera rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoOrbit ? 'animate-spin' : ''}`} />
            <span>{isAutoOrbit ? 'Orbiting' : '360° Orbit'}</span>
          </button>

          {/* Map Style Selector */}
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as any)}
            className="bg-[#071E1B] text-slate-200 border border-teal-800/80 rounded-xl px-2.5 py-1 text-xs font-semibold cursor-pointer outline-none"
          >
            <option value="dark">Clinical Dark 3D</option>
            <option value="satellite">Satellite Earth 3D</option>
            <option value="streets">Daylight Streets 3D</option>
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
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[500px]">
        {/* Left 3 Columns: Mapbox GL WebGL 3D Canvas */}
        <div className="lg:col-span-3 relative h-[460px] sm:h-[540px] bg-[#051312] overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Map Filter Tabs */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-[#061514]/90 border border-teal-800/80 p-1 rounded-xl shadow-lg backdrop-blur-md text-xs">
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

          {/* Floating Map Legend & 3D Building Hint */}
          <div className="absolute bottom-4 left-4 z-10 p-3 rounded-xl bg-[#061514]/90 border border-teal-900/80 text-[11px] text-slate-300 space-y-1.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Critical Deficit (Expanding Shockwave)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Surplus Donor Hub</span>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-300 font-bold">My Real Location (GPS)</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-teal-400" />
              <span>Active Supply Route Arc</span>
            </div>
            <div className="pt-1 border-t border-teal-900/60 text-[10px] text-teal-300/80 font-mono">
              Tip: Right-click & drag to rotate 3D angle 360°
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
