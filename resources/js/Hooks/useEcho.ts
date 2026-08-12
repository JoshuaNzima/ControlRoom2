import { useEffect } from 'react';

export default function useEcho() {
  return (window as any).Echo;
}