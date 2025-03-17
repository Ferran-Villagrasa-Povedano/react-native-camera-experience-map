import { auth, db } from "@services/firebase";
import * as Location from "expo-location";
import { collection, query, getDocs  } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View, TouchableOpacity, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import Map from "@assets/Map";


export default function App() {
  const [location, setLocation] = React.useState(null);
  const [media, setMedia] = useState([]);
  const [mapType, setMapType] = useState("standard");

  const { albumId } = useLocalSearchParams();

  useEffect(() => {
    fetchMedia();
  }, []);

  useEffect(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      console.log("Current location:", location);  
    } catch (error) {
      console.error("Error getting location:", error);
    }
  }, []);

  const fetchMedia = async () => {
    const mediaRef = collection(db, `albums/${albumId}/media`);
    let q = query(mediaRef);

    
    try {
      console.log("Fetching media:", albumId);
      const snapshot = await getDocs(q);
      const newMedia = [];

      snapshot.forEach((doc) => {
        newMedia.push({ id: doc.id, albumId, ...doc.data() });
      });

      setMedia(newMedia);

    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  console.log("Media:", media.length);

  const toggleMapType = () => {
    setMapType(mapType === "standard" ? "hybrid" : "standard");
  }

  return (
    <View className="flex-1">
      <MapView
        style={styles.map}
        mapType={mapType}
        initialRegion={
          location
            ? {
                latitude: location?.coords?.latitude,
                longitude: location?.coords?.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }
            : null
        }
      >
        {media.map((image) => (
          <Marker
            key={image.id}
            coordinate={{
              latitude: image.latitude,
              longitude: image.longitude,
            }}
          >
          <Image
            source={{ uri: image.base64 }}
            style={{ width: 1000, height: 1000 }}
          />
          </Marker>
        ))}
      </MapView>

      <View className="absolute bottom-8 w-full p-8 flex-row justify-between items-center">
        <TouchableOpacity
          className="p-4 bg-black/50 rounded-full"
          onPress={toggleMapType}
        >
          <Map className="w-8 h-8 text-white" />
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});
