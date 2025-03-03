import { useRouter } from "expo-router";
import { Image, View } from "react-native";

export default function MediaCard({ media }) {
  const router = useRouter();
  return (
    <View className="flex-1 m-1 overflow-hidden items-center justify-center">
      <Image
        source={{ uri: media.base64 }}
        className="w-full aspect-square"
        resizeMode="cover"
      />
    </View>
  );
}
