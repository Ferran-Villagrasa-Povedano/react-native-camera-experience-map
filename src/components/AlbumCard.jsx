import MoreVert from "@assets/MoreVert";
import { useRouter } from "expo-router";
import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function AlbumsCard({ album, handleEditAlbum }) {
  const [base64Uri, setBase64Uri] = useState(null);

  useEffect(() => {
    try {
      getDoc(album.coverRef).then((doc) => {
        setBase64Uri(doc.data().base64);
      });
    } catch (error) {
      console.error("Error fetching album cover:", error);
    }
  }, []);

  const router = useRouter();
  return (
    <TouchableOpacity
      style={{
        flexBasis: "48%",
        maxWidth: "48%",
      }}
      className="flex-1 m-2 bg-white rounded-3xl shadow-md overflow-hidden items-center justify-center"
      onPress={() => router.push(`/album/${album.id}`)}
    >
      <Image
        source={{ uri: base64Uri }}
        className="w-full aspect-square"
        resizeMode="cover"
      />
      <View className="absolute bottom-0 w-full bg-black/50 bg-opacity-50 p-2">
        <Text className="text-white text-center text-lg font-semibold">
          {album.name}
        </Text>
        <TouchableOpacity
          onPress={() => handleEditAlbum(album)}
          className="absolute bottom-0 right-0 p-2"
        >
          <MoreVert className="w-8 h-8 text-white" color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
