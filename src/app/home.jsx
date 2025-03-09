import Add from "@assets/Add";
import AlbumCard from "@components/AlbumCard";
import EmailInput from "@components/EmailInput";
import { auth, db } from "@src/services/firebase";
import { Stack, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
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

export default function AlbumsScreen() {
  const [albums, setAlbums] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [creatingAlbum, setCreatingOrUpdatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumEmails, setNewAlbumEmails] = useState([]);
  const [newAlbumError, setNewAlbumError] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(false);
  const [albumToEdit, setAlbumToEdit] = useState(null);

  const ALBUMS_PER_PAGE = 10;

  const router = useRouter();

  useEffect(() => {
    fetchAlbums(true);
  }, []);

  const fetchAlbums = async (isRefresh = false) => {
    if (loadingMore || (lastVisible === null && !isRefresh)) return;

    setLoadingMore(true);

    try {
      const albumsRef = collection(db, "albums");

      let q = query(
        albumsRef,
        orderBy("updatedAt", "desc"),
        limit(ALBUMS_PER_PAGE),
        where("authorId", "==", doc(db, "users", auth.currentUser.uid))
      );

      if (!isRefresh && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      console.log("Fetching albums");

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
    setCreatingOrUpdatingAlbum(false);
    setEditingAlbum(false);
    setAlbumToEdit(null);
    setNewAlbumName("");
    setNewAlbumEmails([]);
    setNewAlbumError(null);
  };

  const handleCreateOrUpdateAlbum = async () => {
    setCreatingOrUpdatingAlbum(true);

    setNewAlbumName(newAlbumName.trim());
    if (!newAlbumName.trim()) {
      setNewAlbumError("Album name is required.");
      setCreatingOrUpdatingAlbum(false);
      return;
    }

    let userRefs = [];

    try {
      userRefs = await resolveEmailsToUserReferences(newAlbumEmails);
      console.log("Resolved emails to user references:", userRefs);
    } catch (error) {
      setNewAlbumError("One or more emails are invalid.");
      console.error("Error resolving emails to user references:", error);
      setCreatingOrUpdatingAlbum(false);
      return;
    }

    try {
      const authorRef = doc(db, "users", auth.currentUser.uid);

      const albumData = {
        authorId: authorRef,
        name: newAlbumName,
        coverRef: null,
        sharedWith: userRefs,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingAlbum) {
        const albumRef = doc(db, "albums", albumToEdit.id);
        await updateDoc(albumRef, albumData);
        console.log("Album updated successfully.");
      } else {
        const albumDoc = await addDoc(collection(db, "albums"), albumData);
        console.log("Album created successfully.");
        router.push(`/album/${albumDoc.id}`);
      }

      handleCancelAlbumCreation();
      await refreshAlbums();
    } catch (error) {
      console.error("Error saving album:", error);
    }

    setCreatingOrUpdatingAlbum(false);
  };

  const handleDeleteAlbum = async () => {
    try {
      const albumId = albumToEdit.id;

      const albumRef = doc(db, "albums", albumId);
      await deleteDoc(albumRef);
      setAlbums((prevAlbums) =>
        prevAlbums.filter((album) => album.id !== albumId)
      );

      await fetchAlbums(true);

      console.log("Album deleted:", albumId);
      handleCancelAlbumCreation();
    } catch (error) {
      console.error("Error al eliminar el álbum:", error);
    }
  };

  const resolveEmailsToUserReferences = async (emails) => {
    const userRefs = [];

    for (const email of emails) {
      const userSnapshot = await getDocs(
        query(collection(db, "users"), where("email", "==", email))
      );

      if (userSnapshot.empty) {
        throw new Error(`Cannot resolve email ${email} to user reference`);
      }

      userSnapshot.forEach((docSnapshot) => {
        const userRef = doc(db, "users", docSnapshot.id);
        userRefs.push(userRef);
      });
    }

    return userRefs;
  };

  const handleEditAlbum = (album) => {
    setModalVisible(true);
    setEditingAlbum(true);
    setAlbumToEdit(album);
    setNewAlbumName(album.name);
    const emails = album.sharedWith.map(async (ref) => {
      const doc = await getDoc(ref);
      return doc.data().email;
    });
    setNewAlbumEmails(emails);
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
          renderItem={({ item }) => (
            <AlbumCard album={item} handleEditAlbum={handleEditAlbum} />
          )}
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
              <Text className="text-xl font-bold mb-4">
                {editingAlbum ? "Edit Album" : "New Album"}
              </Text>

              <TextInput
                value={newAlbumName}
                onChangeText={setNewAlbumName}
                placeholder="Enter album name"
                className="border border-gray-300 rounded-md p-3 mb-4"
              />

              <EmailInput
                emails={newAlbumEmails}
                onEmailsChange={setNewAlbumEmails}
                placeholder="Enter album emails"
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
                  className="bg-red-500 py-3 rounded-md mt-4 flex-1"
                  onPress={handleDeleteAlbum}
                  disabled={creatingAlbum}
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-center text-white text-lg">
                      Delete
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-blue-500 py-3 rounded-md mt-4 flex-1"
                  onPress={handleCreateOrUpdateAlbum}
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
                      {creatingAlbum
                        ? "Saving..."
                        : editingAlbum
                        ? "Save Changes"
                        : "Create Album"}
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
