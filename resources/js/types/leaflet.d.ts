declare module 'leaflet' {
    export interface Map {
        setView(center: LatLngExpression, zoom: number): this;
        getZoom(): number;
    }

    export type LatLngExpression = L.LatLngExpression | [number, number] | { lat: number; lng: number };
    export type LatLngTuple = [number, number];

    export class Icon {
        constructor(options: IconOptions);
    }

    export interface IconOptions {
        iconUrl: string;
        iconSize?: [number, number];
        iconAnchor?: [number, number];
        popupAnchor?: [number, number];
        shadowUrl?: string;
        shadowSize?: [number, number];
        shadowAnchor?: [number, number];
        className?: string;
    }

    export function map(id: string, options?: MapOptions): Map;
    export function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;
    export function circleMarker(latlng: LatLngExpression, options?: CircleMarkerOptions): CircleMarker;

    export interface MapOptions {
        center?: LatLngExpression;
        zoom?: number;
    }

    export interface TileLayerOptions {
        attribution?: string;
        maxZoom?: number;
        minZoom?: number;
    }

    export interface CircleMarkerOptions {
        radius?: number;
        color?: string;
        fillColor?: string;
        fillOpacity?: number;
        weight?: number;
        opacity?: number;
    }

    export type LeafletEventHandlerFn = (e: LeafletEvent) => void;
    
    export interface LeafletEvent {
        type: string;
        target: any;
    }

    export interface TileLayer {
        addTo(map: Map): this;
    }

    export interface CircleMarker {
        addTo(map: Map): this;
        bindPopup(content: string): this;
        on(type: string, fn: LeafletEventHandlerFn): this;
    }
}
