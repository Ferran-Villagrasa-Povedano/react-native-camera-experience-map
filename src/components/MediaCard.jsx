import { useRouter } from "expo-router";
import { Image, View } from "react-native";

export default function MediaCard({ media }) {
  const router = useRouter();
  return (
    <View className="flex-1 items-center m-2">
      <Image
        source={{ uri: media.base64 }}
        style={{ width: 100, height: 100 }}
      />
    </View>
  );
}
