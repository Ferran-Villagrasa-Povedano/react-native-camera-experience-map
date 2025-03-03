import AlbumCard from "@components/AlbumCard";
import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Add from "@assets/Add";
import EmailInput from "@components/EmailInput";

const INITIAL_ALBUMS = Array.from({ length: 10 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `Album ${i + 1}`,
  cover: `https://picsum.photos/200?random=${i + 1}`,
}));

export default function AlbumsScreen() {
  const [albums, setAlbums] = useState(INITIAL_ALBUMS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");

  const loadMoreAlbums = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      const newAlbums = Array.from({ length: 10 }, (_, i) => ({
        id: (albums.length + i + 1).toString(),
        name: `Album ${albums.length + i + 1}`,
        cover: `https://picsum.photos/200?random=${albums.length + i + 1}`,
      }));
      setAlbums((prev) => [...prev, ...newAlbums]);
      setLoadingMore(false);
    }, 1000);
  }, [loadingMore, albums]);

  const refreshAlbums = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setAlbums(INITIAL_ALBUMS);
      setRefreshing(false);
    }, 1000);
  }, []);

  const [newAlbumEmails, setNewAlbumEmails] = useState([]);

  const handleCreateAlbum = () => {
    if (newAlbumName.trim() === "") return;

    const newAlbum = {
      id: (albums.length + 1).toString(),
      name: newAlbumName,
      cover: `https://picsum.photos/200?random=${albums.length + 1}`,
      sharedWith: newAlbumEmails,
    };

    setAlbums((prev) => [newAlbum, ...prev]);
    setNewAlbumName("");
    setNewAlbumEmails([]);
    setModalVisible(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Albums" }} />
      <View className="flex-1 bg-gray-100 p-4">
        {/* Create New Album Button */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="bg-gray-500 py-3 rounded-xl mb-4"
        >
          <View className="flex-row items-center justify-center">
            <Add className="w-8 h-8 text-white" color="#fff" />
            <Text className="text-center text-white text-lg ml-2">
              Create New Album
            </Text>
          </View>
        </TouchableOpacity>

        {/* Albums List */}
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAlbums} />
          }
          renderItem={({ item }) => <AlbumCard album={item} />}
          onEndReached={loadMoreAlbums}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="large" className="my-4" />
            ) : null
          }
        />

        {/* Modal for Creating New Album */}
        <Modal
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          animationType="fade"
        >
          <View className="flex-1 justify-center items-center p-4">
            <View className="w-full p-4 bg-white rounded-xl">
              <Text className="text-xl font-bold mb-4">New Album</Text>

              {/* Album Name Input */}
              <TextInput
                value={newAlbumName}
                onChangeText={setNewAlbumName}
                placeholder="Enter album name"
                className="border border-gray-300 rounded-md p-3 mb-4"
              />

              {/* User Emails Input */}
              <EmailInput
                emails={newAlbumEmails}
                onEmailsChange={setNewAlbumEmails}
              />

              {/* Buttons */}
              <View className="flex-row items-center justify-center gap-4">
                <TouchableOpacity
                  className="bg-gray-300 py-3 rounded-md mt-4 flex-1"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="text-center text-gray-700 text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-500 py-3 rounded-md mt-4 flex-1"
                  onPress={handleCreateAlbum}
                >
                  <Text className="text-center text-white text-lg">
                    Create Album
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
