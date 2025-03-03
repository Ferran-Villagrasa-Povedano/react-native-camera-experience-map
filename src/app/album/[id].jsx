import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function AlbumScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View className="flex-1 justify-center items-center">
      <Text>Album {id}</Text>
    </View>
  );
}
