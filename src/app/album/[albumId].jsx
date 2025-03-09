import AddAPhoto from "@assets/AddAPhoto";
import AddPhotoAlternate from "@assets/AddPhotoAlternate";
import MediaCard from "@components/MediaCard";
import { auth, db } from "@services/firebase";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { updateProfile } from "firebase/auth";
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
import compressImage from "@utils/compressImage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
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
  const [importingFromGallery, setImportingFromGallery] = useState(false);

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

    console.log("Fetching media:", albumId);

    try {
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
    setImportingFromGallery(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        base64: true,
      });

      if (result.canceled || !result.assets.length) return;

      const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");

      const location = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
      });

      const latitude = location?.coords?.latitude || 0;
      const longitude = location?.coords?.longitude || 0;

      const userMediaRef = collection(db, `albums/${albumId}/media`);
      const albumRef = doc(db, `albums/${albumId}`);

      const uploadPromises = result.assets.map(async (asset) => {
        const fileName = `IMG_${timestamp}_LAT${latitude}_LON${longitude}.jpg`;
        const targetSize = 1_000_000;

        const { compressedPhoto, quality } = await compressImage(
          asset,
          targetSize
        );

        console.log(`Quality: ${quality.toFixed(2)}`);
        console.log(`Original photo size: ${asset.base64.length}`);
        console.log(`Compressed photo size: ${compressedPhoto.base64.length}`);

        const photoData = {
          author: doc(db, `users/${auth.currentUser.uid}`),
          type: "image/jpeg",
          fileName,
          base64: `data:image/jpeg;base64,${compressedPhoto.base64}`,
          quality,
          latitude,
          longitude,
          timestamp,
        };

        const mediaDocRef = await addDoc(userMediaRef, photoData);
        console.log("Imported photo added to Firestore:", mediaDocRef.path);

        return mediaDocRef;
      });

      const mediaRefs = await Promise.all(uploadPromises);

      await updateDoc(albumRef, { updatedAt: new Date().toISOString() });

      const mediaSnapshot = await getDocs(userMediaRef);
      if (mediaSnapshot.size === mediaRefs.length) {
        await updateDoc(albumRef, { coverRef: mediaRefs[0] });
        console.log("Updated album cover");
      }

      await fetchMedia(true);
    } catch (error) {
      console.error("Error importing from gallery:", error);
    } finally {
      setImportingFromGallery(false);
    }
  };

  const handleTakePhoto = () => {
    router.push({ pathname: "/camera", params: { albumId } });
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      const mediaRef = doc(db, "albums", albumId, "media", mediaId);
      await deleteDoc(mediaRef);
      await fetchMedia(true);

      console.log("Media deleted:", mediaRef.path);
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const handleDownloadMedia = async (mediaId) => {
    try {
      const mediaRef = doc(db, "albums", albumId, "media", mediaId);
      const mediaDoc = await getDoc(mediaRef);

      if (!mediaDoc.exists()) {
        Alert.alert("Error", "Media not found.");
        return;
      }

      const { fileName, base64 } = mediaDoc.data();

      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");

      const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(tempPath);
      const album = await MediaLibrary.getAlbumAsync("Pb9Camera Downloads");
      if (!album) {
        await MediaLibrary.createAlbumAsync(
          "Pb9Camera Downloads",
          asset,
          false
        );
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      console.log("File saved to Downloads folder:", asset.uri);
    } catch (error) {
      console.error("Error downloading media:", error);
    }
  };

  const handleSetAsAlbumCover = async (mediaId) => {
    try {
      const mediaRef = doc(db, "albums", albumId, "media", mediaId);
      await updateDoc(doc(db, "albums", albumId), {
        coverRef: mediaRef,
      });
    } catch (error) {
      console.error("Error setting as album cover:", error);
    }
  };

  const handleSetAsProfilePicture = async (mediaId) => {
    try {
      const mediaRef = doc(db, "albums", albumId, "media", mediaId);
      const { base64 } = (await getDoc(mediaRef)).data();

      updateProfile(auth.currentUser, {
        photoURL: base64,
      });

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoURL: base64,
      });
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
              {importingFromGallery ? (
                <ActivityIndicator size="small" color="#fff" className="mr-2" />
              ) : (
                <AddPhotoAlternate
                  className="w-8 h-8 text-white"
                  color="#fff"
                />
              )}
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
              setMenuVisible(false);
            }}
          >
            <Text>Download Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => {
              handleSetAsAlbumCover(media[currentImageIndex].id);
              setMenuVisible(false);
            }}
          >
            <Text>Set as Album Cover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => {
              handleSetAsProfilePicture(media[currentImageIndex].id);
              setMenuVisible(false);
            }}
          >
            <Text>Set as Profile Picture</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}
