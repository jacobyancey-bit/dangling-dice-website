# GIS Land Acreage, Polygon Math & Map Coordinates API

[![Sub-Millisecond](https://img.shields.io/badge/Compute-%3C2ms-brightgreen)](#)
[![GIS Precision](https://img.shields.io/badge/Precision-Ellipsoidal%20Spherical-blue)](#)
[![Geofencing](https://img.shields.io/badge/Math-Ray--Casting-orange)](#)

A high-precision geospatial computation and polygon math engine (<2ms latency). Calculate exact surveyed land parcel acreage, hectares, square footage, boundary perimeter lengths, and polygon centroids from GPS latitude/longitude coordinates. Includes high-accuracy Haversine distance, initial bearing degrees, spherical midpoints, ray-casting point-in-polygon geofencing, and WireGuard VPN mesh configuration generators.

Built for **proptech/real estate platforms, agricultural drone flight planners, land surveyors, GIS developers, and logistics tracking**.

---

## 🗺️ Why Developers Use This API

1. **Real Estate & PropTech**: Instantly calculate exact acreage, lot square footage, and perimeter boundaries from map polygon vertices.
2. **Agriculture & Drone Mapping**: Calculate field acreage and perimeter paths for drone fertilizer spraying and harvest estimates.
3. **Logistics & Geofencing**: Determine whether delivery drivers or assets are currently inside complex polygonal delivery zones or restricted territory.
4. **Distance & Flight Path Vectors**: Get great-circle distance (meters, km, miles, feet), initial bearing degrees, and spherical path midpoints with sub-millisecond execution.

---

## ⚡ Core Endpoints

### 1. `POST /v1/geo/parcel-metrics`
Calculates exact surface area over the Earth's curvature (spherical excess math), perimeter, and geographic centroid.

#### Request Example:
```json
{
  "coordinates": [
    { "lat": 30.2672, "lng": -97.7431 },
    { "lat": 30.2700, "lng": -97.7431 },
    { "lat": 30.2700, "lng": -97.7400 },
    { "lat": 30.2672, "lng": -97.7400 }
  ]
}
```

#### Response Example:
```json
{
  "success": true,
  "engine": "geo",
  "latencyMs": 0.45,
  "data": {
    "acreage": 19.82,
    "hectares": 8.02,
    "squareFeet": 863334.12,
    "squareMeters": 80206.5,
    "perimeterFeet": 3724.8,
    "perimeterMeters": 1135.32,
    "centroid": {
      "lat": 30.2686,
      "lng": -97.7415
    },
    "vertexCount": 4
  }
}
```

---

### 2. `POST /v1/geo/distance`
Computes Haversine spherical distance between two points, initial compass bearing (with compass card direction e.g. `NE`, `SSW`), and the exact midpoint coordinate.

#### Request Example:
```json
{
  "from": { "lat": 40.7128, "lng": -74.006 },
  "to": { "lat": 34.0522, "lng": -118.2437 }
}
```

#### Response Example:
```json
{
  "success": true,
  "engine": "geo",
  "latencyMs": 0.38,
  "data": {
    "distanceMeters": 3935746.25,
    "distanceKilometers": 3935.75,
    "distanceMiles": 2445.56,
    "distanceFeet": 12912553.31,
    "initialBearingDegrees": 273.12,
    "compassDirection": "W",
    "midpoint": {
      "lat": 39.5162,
      "lng": -97.1352
    }
  }
}
```

---

### 3. `POST /v1/geo/point-in-polygon`
Ray-casting containment verification for geofencing and delivery boundary checking.

#### Request Example:
```json
{
  "point": { "lat": 30.2685, "lng": -97.7415 },
  "polygon": [
    { "lat": 30.2672, "lng": -97.7431 },
    { "lat": 30.2700, "lng": -97.7431 },
    { "lat": 30.2700, "lng": -97.7400 },
    { "lat": 30.2672, "lng": -97.7400 }
  ]
}
```

#### Response Example:
```json
{
  "success": true,
  "engine": "geo",
  "data": {
    "inside": true,
    "point": { "lat": 30.2685, "lng": -97.7415 },
    "vertexCount": 4
  }
}
```

---

### 4. `POST /v1/geo/wireguard-config`
Generates cryptographically valid Curve25519 WireGuard client and server configurations with pre-shared keys and interface addresses.

---

## 💻 Quickstart Implementations

### Python (with RapidAPI)
```python
import requests

url = "https://gis-land-acreage-polygon-math-api.p.rapidapi.com/v1/geo/parcel-metrics"

payload = {
    "coordinates": [
        {"lat": 37.7749, "lng": -122.4194},
        {"lat": 37.7755, "lng": -122.4194},
        {"lat": 37.7755, "lng": -122.4180},
        {"lat": 37.7749, "lng": -122.4180}
    ]
}

headers = {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "gis-land-acreage-polygon-math-api.p.rapidapi.com",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## ⚡ Latency & SLA
- Average response time: **< 1.0 ms**
- All geospatial math executed transiently in-memory with zero persistent logging.
