import * as Location from "expo-location";
import React from "react";
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "@src/services/firebase";
import { StyleSheet, View, Image } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function App() {
  const [location, setLocation] = React.useState(null);
  const [images, setImages] = useState([]);

  React.useEffect(() => {
    (async () => {
      const location = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
      });
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
      const currentUser = auth.currentUser;
      if (!currentUser) return; 
  
      const userMediaRef = collection(db, `users/${currentUser.uid}/media`);
  
      const unsubscribe = onSnapshot(userMediaRef, (querySnapshot) => {
        const images = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setImages(images);

        console.log(images);
      });
  
      return () => unsubscribe();
    }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={
          location
            ? {
                latitude: location?.coords?.latitude,
                longitude: location?.coords?.longitude,
                latitudeDelta: 0.0922, // Adjust as needed
                longitudeDelta: 0.0421, // Adjust as needed
              }
            : null
        }
      >
        <Marker
          className="border-2 border-white rounded-full w-10 h-10 bg-red"
          coordinate={{ latitude: 41.610241, longitude: 2.194169 }}
          image={{
            uri: "https://fastly.picsum.photos/id/16/200/300.jpg?hmac=k64O1qCMBhaU0Ep_qML5_xDxqLVR1MhNm8VMqgdAsxA",
          }}
        >
        </Marker>

        {images.map((image) => (
          <Marker
          key={image.id}
          coordinate={{ latitude: image.latitude, longitude: image.longitude }}
        >
          <View style={{ width: 30, height: 30}}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${image.base64}` }}
              style={{ width: 30, height: 30 }}
            />
          </View>
        </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
