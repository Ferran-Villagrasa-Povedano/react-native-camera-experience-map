import { useRouter } from "expo-router";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

export default function App() {
  const router = useRouter();
  return (
    <View className="w-full h-1/2 flex-col p-2">
      <View className="flex-row w-full h-1/2 space-x-1">
        <TouchableOpacity
          onPress={() => router.push("/gallery")}
          className="flex-row w-[50%] space-x-1"
        >
          <ImageBackground
            className="flex-1 w-full justify-end"
            source={{
              uri: "https://cdn.pixabay.com/photo/2022/07/30/07/50/gallery-7353267_1280.png",
            }}
          >
            <View className="flex-1 p-2 justify-end bg-gray-900/80 border-2 border-white ">
              <Text className="text-left text-white font-bold">Galeria</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/camera")}
          className="flex-row w-[50%] space-x-1"
        >
          <ImageBackground
            className="flex-1 justify-end"
            source={{
              uri: "https://static.vecteezy.com/system/resources/previews/024/758/773/original/camera-icon-clipart-transparent-background-free-png.png",
            }}
          >
            <View className="flex-1 p-2 justify-end bg-gray-900/80 border-2 border-white ">
              <Text className="text-left text-white font-bold">Camara</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>
      <View className="flex-row w-full h-1/2 space-x-1">
        <TouchableOpacity
          onPress={() => router.push("/map")}
          className="flex-row w-full space-x-1"
        >
          <ImageBackground
            className="flex-1 w-full justify-end "
            source={{
              uri: "https://img.freepik.com/fotos-premium/mapa-pequena-isla-ficticia_14117-413923.jpg",
            }}
          >
            <View className="flex-1 p-5 w-full justify-end bg-gray-900/80 border-2 border-white">
              <Text className="text-left text-white font-bold ">Mapa</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </View>
  );
}
