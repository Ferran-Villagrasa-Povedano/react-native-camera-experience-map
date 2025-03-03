import Logout from "@assets/Logout";
import Avatar from "@components/Avatar";
import { auth } from "@services/firebase";
import "@src/global.css";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Layout() {
  const [user, setUser] = useState(null);
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  const router = useRouter();
  const toggleDropdown = () => setDropdownVisible(!isDropdownVisible);

  const handleLogout = () => {
    auth.signOut();
    setDropdownVisible(false);
    router.replace("/login");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#3f3f3f" },
          headerTintColor: "white",
          headerRight: () =>
            user && (
              <TouchableOpacity
                onPressIn={toggleDropdown}
                style={{ paddingRight: 10 }}
              >
                <Avatar user={user} />
              </TouchableOpacity>
            ),
        }}
      />

      <Modal
        transparent
        animationType="fade"
        visible={isDropdownVisible}
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/20 justify-center items-center"
          onPress={() => setDropdownVisible(false)}
        >
          <View className="absolute top-16 right-5 bg-white p-4 rounded-lg w-48 shadow-lg">
            <Text className="mb-3 font-semibold text-black">
              {user?.displayName}
            </Text>
            <Text className="mb-3 font-semibold text-black">{user?.email}</Text>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-blue-500 p-2 rounded-lg flex-row items-center justify-center"
            >
              <Text className="text-white text-center font-bold mx-2">
                Log out
              </Text>
              <Logout fill="#fff" width={24} height={24} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
