import { auth } from "@src/services/firebase";
import { useRouter,  } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    };
      //test@test.com
    const timeoutId = setTimeout(() => {
      checkAuthStatus();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator />
    </View>
  );
};
