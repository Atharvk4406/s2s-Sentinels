import os
import json
import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.features import shapes
from shapely.geometry import shape, mapping, box
import geopandas as gpd
from skimage.morphology import binary_opening, binary_closing, disk

try:
    import osmnx as ox
except Exception:
    ox = None


def analyze_flood(aoi_geojson, sentinel_band_paths=None, sample_data_dir=None, ndwi_thresh=0.2):
    """
    Simple NDWI-based flood analyzer.

    Parameters:
    - aoi_geojson: GeoJSON Feature representing AOI polygon
    - sentinel_band_paths: dict with keys 'B03' (green) and 'B08' (nir) to explicit file paths
    - sample_data_dir: directory to look for sample sentinel bands named B03.tif and B08.tif

    Returns: dict matching DisasterAnalyzer interface
    """
    # Determine band file paths
    if sentinel_band_paths is None:
        if sample_data_dir is None:
            raise FileNotFoundError('No sentinel band paths provided and no sample_data_dir set')
        b03 = os.path.join(sample_data_dir, 'B03.tif')
        b08 = os.path.join(sample_data_dir, 'B08.tif')
    else:
        b03 = sentinel_band_paths.get('B03')
        b08 = sentinel_band_paths.get('B08')

    if not (os.path.exists(b03) and os.path.exists(b08)):
        raise FileNotFoundError(f'Sentinel band files not found. Expected: {b03}, {b08}')

    # Read and crop bands to AOI
    geom = aoi_geojson['geometry']

    with rasterio.open(b03) as src_g:
        g_img, g_transform = mask(src_g, [geom], crop=True)
        g_meta = src_g.meta.copy()

    with rasterio.open(b08) as src_n:
        n_img, n_transform = mask(src_n, [geom], crop=True)
        n_meta = src_n.meta.copy()

    # Convert to float arrays and compute NDWI
    # g_img and n_img shapes: (bands, rows, cols) — take first band
    g = g_img[0].astype('float32')
    n = n_img[0].astype('float32')

    # Avoid division by zero
    denom = (g + n)
    denom[denom == 0] = 1e-6
    ndwi = (g - n) / denom

    # Threshold to get water mask
    water_mask = ndwi > ndwi_thresh

    # Morphological cleaning
    selem = disk(3)
    water_mask = binary_opening(water_mask, selem)
    water_mask = binary_closing(water_mask, selem)

    # Vectorize mask
    transform = g_transform
    mask_uint8 = (water_mask.astype('uint8'))

    results = []
    for geom_dict, value in shapes(mask_uint8, mask=mask_uint8, transform=transform):
        if value == 1:
            geom_shp = shape(geom_dict)
            # Filter tiny areas
            if geom_shp.area > 0:
                results.append(mapping(geom_shp))

    if len(results) == 0:
        affected_gdf = gpd.GeoDataFrame(columns=['geometry'])
    else:
        affected_gdf = gpd.GeoDataFrame(geometry=[shape(g) for g in results], crs=src_g.crs)

    # Compute affected area in km2 (project to metric CRS)
    if not affected_gdf.empty:
        try:
            affected_gdf = affected_gdf.to_crs(epsg=3857)
            affected_gdf['area_m2'] = affected_gdf.geometry.area
            total_area_km2 = affected_gdf['area_m2'].sum() / 1e6
        except Exception:
            # fallback: estimate using planar area in current CRS (may be degrees)
            total_area_km2 = affected_gdf.geometry.area.sum() / 1e6
    else:
        total_area_km2 = 0.0

    # Simple severity metric: ratio of flooded area to AOI bbox area
    aoi_geom = shape(aoi_geojson['geometry'])
    try:
        aoi_gdf = gpd.GeoDataFrame(geometry=[aoi_geom], crs=src_g.crs).to_crs(epsg=3857)
        aoi_area_m2 = aoi_gdf.geometry.area.iloc[0]
    except Exception:
        aoi_area_m2 = aoi_geom.area
    severity = float(total_area_km2 * 1e6 / (aoi_area_m2 + 1e-9)) if aoi_area_m2 > 0 else 0.0
    severity = min(1.0, severity)

    # Intersect with OSM roads if osmnx is available
    affected_roads = []
    if ox is not None:
        try:
            # use AOI bbox to download OSM within area
            minx, miny, maxx, maxy = aoi_geom.bounds
            # osmnx expects north, south, east, west -> (north, south, east, west)
            north, south, east, west = maxy, miny, maxx, minx
            G = ox.graph_from_bbox(north, south, east, west, network_type='drive')
            edges = ox.graph_to_gdfs(G, nodes=False, edges=True)
            if not edges.empty and not affected_gdf.empty:
                edges = edges.to_crs(affected_gdf.crs)
                intersected = gpd.overlay(edges, affected_gdf, how='intersection')
                # simplify list of road names
                if 'name' in intersected.columns:
                    affected_roads = intersected['name'].dropna().unique().tolist()
                else:
                    affected_roads = intersected.index.astype(str).tolist()
        except Exception:
            affected_roads = []

    result = {
        'disasterType': 'flood',
        'affectedGeometry': {
            'type': 'FeatureCollection',
            'features': [
                {'type': 'Feature', 'properties': {}, 'geometry': mapping(g)} for g in (affected_gdf.geometry.to_crs(epsg=4326) if not affected_gdf.empty else [])
            ]
        },
        'affectedArea_km2': float(total_area_km2),
        'severity': float(severity),
        'confidence': 0.8,
        'affectedRoads': affected_roads,
        'affectedFacilities': [],
        'populationExposure': 0,
        'timestamps': {'observation': None, 'analysis': None}
    }

    return result
