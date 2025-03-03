import AlbumCard from "@components/AlbumCard";
import { auth, db } from "@src/services/firebase";
import { Stack } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
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

export default function AlbumsScreen() {
  const [albums, setAlbums] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumEmails, setNewAlbumEmails] = useState([]);
  const [newAlbumError, setNewAlbumError] = useState(null);
  const ALBUMS_PER_PAGE = 10;

  useEffect(() => {
    fetchAlbums(true);
  }, []);

  const fetchAlbums = async (isRefresh = false) => {
    if (loadingMore || (lastVisible === null && !isRefresh)) return;

    setLoadingMore(true);

    try {
      let q = collection(db, "albums");

      q = query(
        q,
        orderBy("updatedAt", "desc"),
        limit(ALBUMS_PER_PAGE),
        where("authorId", "==", doc(db, "users", auth.currentUser.uid))
      );

      if (!isRefresh && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const newAlbums = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sharedAlbumsQuery = query(
        collection(db, "albums"),
        where(
          "sharedWith",
          "array-contains",
          doc(db, "users", auth.currentUser.uid)
        ),
        orderBy("updatedAt", "desc"),
        limit(ALBUMS_PER_PAGE)
      );

      const sharedSnapshot = await getDocs(sharedAlbumsQuery);
      const sharedAlbums = sharedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const combinedAlbums = [...newAlbums, ...sharedAlbums];
      const uniqueAlbums = [
        ...new Map(combinedAlbums.map((album) => [album.id, album])).values(),
      ];

      if (isRefresh) {
        setAlbums(uniqueAlbums);
      } else {
        setAlbums((prev) => {
          const albumIds = new Set(prev.map((album) => album.id));
          const uniqueNewAlbums = uniqueAlbums.filter(
            (album) => !albumIds.has(album.id)
          );
          return [...prev, ...uniqueNewAlbums];
        });
      }

      setLastVisible(
        snapshot.docs.length < ALBUMS_PER_PAGE
          ? null
          : snapshot.docs[snapshot.docs.length - 1]
      );
    } catch (error) {
      console.error("Error fetching albums:", error);
    }

    setLoadingMore(false);
  };

  const refreshAlbums = async () => {
    setRefreshing(true);
    await fetchAlbums(true);
    setRefreshing(false);
  };

  const handleCancelAlbumCreation = () => {
    setModalVisible(false);
    setCreatingAlbum(false);
    setNewAlbumName("");
    setNewAlbumEmails([]);
    setNewAlbumError(null);
  };

  const handleCreateAlbum = async () => {
    setCreatingAlbum(true);
    setNewAlbumName(newAlbumName.trim());
    if (!newAlbumName.trim()) {
      setNewAlbumError("Album name is required.");
      setCreatingAlbum(false);
      return;
    }

    let userRefs = [];

    try {
      userRefs = await resolveEmailsToUserReferences(newAlbumEmails);
      console.log("Resolved emails to user references:", userRefs);
    } catch (error) {
      setNewAlbumError("One or more emails are invalid.");
      console.error("Error resolving emails to user references:", error);
      setCreatingAlbum(false);
      return;
    }

    try {
      const authorRef = doc(db, "users", auth.currentUser.uid);

      const newAlbum = {
        authorId: authorRef,
        name: newAlbumName,
        cover: `https://picsum.photos/200?random=${Math.random()}`,
        sharedWith: userRefs,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "albums"), newAlbum);
      handleCancelAlbumCreation();
      await refreshAlbums();
    } catch (error) {
      console.error("Error adding album:", error);
    }

    setCreatingAlbum(false);
  };

  const resolveEmailsToUserReferences = async (emails) => {
    const userRefs = [];

    for (const email of emails) {
      const userSnapshot = await getDocs(
        query(collection(db, "users"), where("email", "==", email))
      );

      if (userSnapshot.empty) {
        // Throw an error if no user is found for the given email
        throw new Error(`Cannot resolve email ${email} to user reference`);
      }

      // Store the user document reference
      userSnapshot.forEach((docSnapshot) => {
        const userRef = doc(db, "users", docSnapshot.id);
        userRefs.push(userRef);
      });
    }

    return userRefs;
  };

  return (
    <>
      <Stack.Screen options={{ title: "Albums" }} />
      <View className="flex-1 p-4">
        <TouchableOpacity
          className="bg-gray-500 py-3 rounded-xl mb-4"
          onPress={() => setModalVisible(true)}
        >
          <View className="flex-row items-center justify-center">
            <Add className="w-8 h-8 text-white" color="#fff" />
            <Text className="text-center text-white text-lg ml-2">
              New Album
            </Text>
          </View>
        </TouchableOpacity>
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAlbums} />
          }
          renderItem={({ item }) => <AlbumCard album={item} />}
          onEndReached={() => {
            if (!loadingMore && lastVisible !== null) {
              fetchAlbums();
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-4">
              <Text className="text-gray-500 text-lg text-center">
                You have no albums yet.
              </Text>
              <Text className="text-gray-500 text-lg text-center">
                Start by creating one!
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="large" className="my-4" />
            ) : null
          }
        />

        <Modal
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          animationType="fade"
        >
          <View className="flex-1 justify-center items-center p-4">
            <View className="w-full p-4 bg-white rounded-xl">
              <Text className="text-xl font-bold mb-4">New Album</Text>

              <TextInput
                value={newAlbumName}
                onChangeText={setNewAlbumName}
                placeholder="Enter album name"
                className="border border-gray-300 rounded-md p-3 mb-4"
              />

              <EmailInput
                emails={newAlbumEmails}
                onEmailsChange={setNewAlbumEmails}
              />

              {newAlbumError && (
                <Text className="text-red-500 text-center mb-4">
                  {newAlbumError}
                </Text>
              )}

              <View className="flex-row items-center justify-center gap-4">
                <TouchableOpacity
                  className="bg-gray-300 py-3 rounded-md mt-4 flex-1"
                  onPress={handleCancelAlbumCreation}
                >
                  <Text className="text-center text-gray-700 text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-500 py-3 rounded-md mt-4 flex-1"
                  onPress={handleCreateAlbum}
                  disabled={creatingAlbum}
                >
                  <View className="flex-row items-center justify-center">
                    {creatingAlbum && (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        className="mr-2"
                      />
                    )}
                    <Text className="text-center text-white text-lg">
                      {creatingAlbum ? "Creating..." : "Create Album"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
