import AddAPhoto from "@assets/AddAPhoto";
import AddPhotoAlternate from "@assets/AddPhotoAlternate";
import MediaCard from "@components/MediaCard";
import { db } from "@services/firebase";
import { ImagePicker } from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AlbumScreen() {
  const { albumId } = useLocalSearchParams();

  const [album, setAlbum] = useState(null);
  const [media, setMedia] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const MEDIA_PER_PAGE = 10;

  const router = useRouter();

  const albumRef = doc(db, "albums", albumId);

  useEffect(() => {
    if (!albumId) return;

    const unsubscribe = onSnapshot(albumRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setAlbum(docSnapshot.data());
      }
    });

    return () => unsubscribe();
  });

  useEffect(() => {
    fetchMedia(true);
  }, []);

  const fetchMedia = async (isRefresh = false) => {
    if (loadingMore) return;

    setLoadingMore(true);
    const mediaRef = collection(db, `albums/${albumId}/media`);
    let q = query(mediaRef, orderBy("timestamp"), limit(MEDIA_PER_PAGE));

    if (!isRefresh && lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMedia = [];
      snapshot.forEach((doc) => {
        newMedia.push({ id: doc.id, albumId, ...doc.data() });
      });

      setMedia((prevMedia) => [...prevMedia, ...newMedia]);

      setLastVisible(
        snapshot.docs.length < MEDIA_PER_PAGE
          ? null
          : snapshot.docs[snapshot.docs.length - 1]
      );

      setLoadingMore(false);
    });

    return () => unsubscribe();
  };

  const refreshMedia = async () => {
    setRefreshing(true);
    await fetchMedia(true);
    console.log(media);
    setRefreshing(false);
  };

  const handleImportFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      // Handle the selected image (result.uri)
      console.log("Selected image from gallery:", result.uri);
    }
  };

  // Navigate to camera screen
  const handleTakePhoto = () => {
    router.push({ pathname: "/camera", params: { albumId } });
  };

  if (!album) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: album?.name }} />
      <View className="flex-1">
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
          renderItem={({ item }) => <MediaCard media={item} />}
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
    </>
  );
}
