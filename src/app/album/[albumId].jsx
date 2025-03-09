import AddAPhoto from "@assets/AddAPhoto";
import AddPhotoAlternate from "@assets/AddPhotoAlternate";
import MediaCard from "@components/MediaCard";
import { db, logQuery } from "@services/firebase";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MoreVert from "@assets/MoreVert";
import ImageViewer from "react-native-image-zoom-viewer";

export default function AlbumScreen() {
  const { albumId } = useLocalSearchParams();

  const [album, setAlbum] = useState(null);
  const [media, setMedia] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  const MEDIA_PER_PAGE = 10;
  const router = useRouter();

  useEffect(() => {
    if (!albumId) return;
    const albumRef = doc(db, "albums", albumId);
    getDoc(albumRef).then((doc) => {
      if (doc.exists()) {
        setAlbum({ id: doc.id, ...doc.data() });
      }
    });
  });

  useEffect(() => {
    fetchMedia(true);
  }, []);

  const fetchMedia = async (isRefresh = false) => {
    if (loadingMore) return;

    setLoadingMore(true);
    const mediaRef = collection(db, `albums/${albumId}/media`);
    let q = query(
      mediaRef,
      orderBy("timestamp", "desc"),
      limit(MEDIA_PER_PAGE)
    );

    if (!isRefresh && lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    try {
      logQuery(q);
      const snapshot = await getDocs(q);
      const newMedia = [];

      snapshot.forEach((doc) => {
        newMedia.push({ id: doc.id, albumId, ...doc.data() });
      });

      if (isRefresh) {
        setMedia(newMedia);
      } else {
        setMedia((prevMedia) => [...prevMedia, ...newMedia]);
      }

      setLastVisible(
        snapshot.docs.length < MEDIA_PER_PAGE
          ? null
          : snapshot.docs[snapshot.docs.length - 1]
      );
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshMedia = async () => {
    setRefreshing(true);
    await fetchMedia(true);
    setRefreshing(false);
  };

  const handleImportFromGallery = async () => {
    // TODO: finish
  };

  const handleTakePhoto = () => {
    router.push({ pathname: "/camera", params: { albumId } });
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      await deleteDoc(doc(db, "albums", albumId, "media", mediaId));
      await refreshMedia();
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const handleDownloadMedia = async (mediaId) => {
    try {
      // TODO: finish
    } catch (error) {
      console.error("Error downloading media:", error);
    }
  };

  const handleSetAsAlbumCover = async (mediaId) => {
    try {
      // TODO: finish
    } catch (error) {
      console.error("Error setting as album cover:", error);
    }
  };

  const handleSetAsProfilePicture = async (mediaId) => {
    try {
      // TODO: finish
    } catch (error) {
      console.error("Error setting as profile picture:", error);
    }
  };

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setIsImageViewerVisible(true);
  };

  if (!album) {
    return (
      <>
        <Stack.Screen options={{ title: "Album" }} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      </>
    );
  }

  const imageUrls = media.map((item) => ({ url: item.base64 }));
  return (
    <>
      <Stack.Screen options={{ title: album?.name }} />
      <View className="flex-1 p-4">
        <View className="flex-row justify-between p-4">
          <TouchableOpacity
            onPress={handleImportFromGallery}
            className="bg-gray-500 py-3 rounded-xl mb-4 flex-1 mr-2"
          >
            <View className="flex-row items-center justify-center">
              <AddPhotoAlternate className="w-8 h-8 text-white" color="#fff" />
              <Text className="text-center text-white text-lg ml-2">
                Add Photo
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleTakePhoto}
            className="bg-gray-500 py-3 rounded-xl mb-4 flex-1 ml-2"
          >
            <View className="flex-row items-center justify-center">
              <AddAPhoto className="w-8 h-8 text-white" color="#fff" />
              <Text className="text-center text-white text-lg ml-2">
                Take Photo
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <FlatList
          data={media}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => openImageViewer(index)}
              style={{
                flexBasis: "33%",
                maxWidth: "33%",
              }}
            >
              <MediaCard media={item} />
            </TouchableOpacity>
          )}
          numColumns={3}
          onEndReached={() => {
            if (!loadingMore && lastVisible !== null) {
              fetchMedia();
            }
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshMedia} />
          }
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500 text-lg text-center">
                You have no media yet.
              </Text>
              <Text className="text-gray-500 text-lg text-center">
                Start by taking a photo!
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="large" /> : null
          }
        />
      </View>

      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        onRequestClose={() => setIsImageViewerVisible(false)}
        animationType="fade"
      >
        <ImageViewer
          imageUrls={imageUrls}
          index={currentImageIndex}
          renderIndicator={() => null}
          onSwipeDown={() => setIsImageViewerVisible(false)}
          enableSwipeDown={true}
          backgroundColor="black"
          renderHeader={() => (
            <View className="flex-row justify-end items-center p-4 bg-black bg-opacity-50">
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <MoreVert className="w-8 h-8 text-white" color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      </Modal>

      <Modal visible={menuVisible} transparent={true} animationType="fade">
        <TouchableOpacity
          className="w-full h-full bg-black/50 bg-opacity-50"
          onPress={() => setMenuVisible(false)}
        />
        <View
          className="flex-col items-start"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: "white",
            padding: 8,
            borderRadius: 5,
            elevation: 5,
          }}
        >
          <TouchableOpacity
            className="p-2"
            onPress={() => {
              handleDeleteMedia(media[currentImageIndex].id);
              setMenuVisible(false);
              setIsImageViewerVisible(false);
            }}
          >
            <Text>Delete Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => {
              handleDownloadMedia(media[currentImageIndex].id);
            }}
          >
            <Text>Download Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => handleSetAsAlbumCover(media[currentImageIndex].id)}
          >
            <Text>Set as Album Cover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() =>
              handleSetAsProfilePicture(media[currentImageIndex].id)
            }
          >
            <Text>Set as Profile Picture</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}
