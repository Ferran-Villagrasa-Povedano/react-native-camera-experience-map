import { useRouter } from "expo-router";
import { Image, TouchableOpacity } from "react-native";

export default function MediaCard({ media }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      className="flex-1 items-center m-2"
      onPress={() => router.push(`/album/${media.albumId}/media/${media.id}`)}
    >
      <Image
        source={{ uri: media.base64 }}
        style={{ width: 100, height: 100 }}
      />
    </TouchableOpacity>
  );
}
