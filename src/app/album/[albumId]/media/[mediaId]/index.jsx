import { db } from "@services/firebase";
import { Stack, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, View } from "react-native";

export default function MediaScreen() {
  const { albumId, mediaId } = useLocalSearchParams();

  const [media, setMedia] = useState(null);

  const mediaRef = doc(db, `albums/${albumId}/media/${mediaId}`);

  useEffect(() => {
    if (!mediaId) return;

    const unsubscribe = onSnapshot(mediaRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setMedia(docSnapshot.data());
      }
    });

    return () => unsubscribe();
  }, []);

  if (!media) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Media" }} />
      <View className="flex-1 justify-center items-center bg-black">
        <Image
          source={{ uri: media.base64 }}
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />
      </View>
    </>
  );
}
