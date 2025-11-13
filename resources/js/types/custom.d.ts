import * as L from 'leaflet';

declare module 'react-leaflet' {
  interface MapContainerProps {
    center: L.LatLngExpression;
    zoom: number;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  interface TileLayerProps {
    url: string;
    attribution?: string;
  }

  interface MarkerProps {
    position: L.LatLngExpression;
    icon?: L.Icon;
    children?: React.ReactNode;
  }
}