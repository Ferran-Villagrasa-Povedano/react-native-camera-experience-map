import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function AlbumsCard({ album }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      className="flex-1 m-2 bg-white rounded-3xl shadow-md overflow-hidden"
      onPress={() => router.push(`/album/${album.id}`)}
    >
      <Image
        source={{ uri: album.cover }}
        className="w-full aspect-square"
        resizeMode="cover"
      />
      <View className="absolute bottom-0 w-full bg-black/50 bg-opacity-50 p-2">
        <Text className="text-white text-center text-lg font-semibold">
          {album.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
