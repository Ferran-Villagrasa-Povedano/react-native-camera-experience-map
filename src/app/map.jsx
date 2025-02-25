import * as Location from "expo-location";
import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function App() {
  const [location, setLocation] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      const location = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
      });
      setLocation(location);
    })();
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
          coordinate={{ latitude: 41.610241, longitude: 2.194169 }}
          image={{
            uri: "https://fastly.picsum.photos/id/16/200/300.jpg?hmac=k64O1qCMBhaU0Ep_qML5_xDxqLVR1MhNm8VMqgdAsxA",
          }}
        >
          {/* <Text>Holaaaaa</Text> */}
        </Marker>
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
