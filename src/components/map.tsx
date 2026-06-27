/**
 * Reusable map wrapper around react-native-maps. On iOS it uses Apple Maps
 * (no API key); on Android it uses Google Maps (needs a key, added in Phase 6).
 * Renders color-coded markers and animates to a focused coordinate. The
 * `children` slot lets later screens draw polylines (routes, M3).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { LatLng } from '@/lib/geo';

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface MapProps {
  initialRegion: Region;
  markers?: MapMarkerData[];
  selectedId?: string | null;
  /** When set, the map animates to center on this coordinate. */
  focus?: LatLng | null;
  onMarkerPress?: (id: string) => void;
  height?: number;
  style?: ViewStyle;
  children?: ReactNode;
}

export function Map({
  initialRegion,
  markers = [],
  selectedId,
  focus,
  onMarkerPress,
  height,
  style,
  children,
}: MapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (focus) {
      mapRef.current?.animateToRegion(
        { ...focus, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        350,
      );
    }
  }, [focus]);

  return (
    <View style={[height !== undefined ? { height } : styles.fill, style]}>
      <MapView
        ref={mapRef}
        style={styles.fill}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}>
        {markers.map((m) => (
          <PinMarker
            key={m.id}
            data={m}
            selected={m.id === selectedId}
            onPress={() => onMarkerPress?.(m.id)}
          />
        ))}
        {children}
      </MapView>
    </View>
  );
}

function PinMarker({
  data,
  selected,
  onPress,
}: {
  data: MapMarkerData;
  selected: boolean;
  onPress: () => void;
}) {
  // tracksViewChanges is expensive; keep it on briefly so the custom view
  // renders (and re-renders when selection changes), then turn it off.
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 600);
    return () => clearTimeout(t);
  }, [selected]);

  return (
    <Marker
      coordinate={{ latitude: data.latitude, longitude: data.longitude }}
      onPress={onPress}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 1 }}>
      <View
        style={[
          styles.pin,
          {
            backgroundColor: data.color,
            borderColor: selected ? '#fff' : 'rgba(255,255,255,0.7)',
            transform: [{ scale: selected ? 1.25 : 1 }],
          },
        ]}>
        <MaterialCommunityIcons name={data.icon} size={16} color="#fff" />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
});
