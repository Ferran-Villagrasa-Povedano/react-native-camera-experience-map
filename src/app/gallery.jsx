import { db, auth } from "@src/services/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useState, useEffect } from "react";
import { View, Text, Image, FlatList } from "react-native";

export default function GalleryScreen() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return; 

    const userMediaRef = collection(db, `users/${currentUser.uid}/media`);
    const userMediaRefSorted = query(userMediaRef, orderBy("timestamp", "asc")); 

    const unsubscribe = onSnapshot(userMediaRefSorted, (querySnapshot) => {
      const images = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setImages(images);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View className="flex-1 justify-center items-center">
      <FlatList
        className="mt-1"
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={3} 
        columnWrapperStyle={{ justifyContent: "left" }} 
        renderItem={({ item }) => (
          <View style={{ margin: 3 }}>
            {item.base64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${item.base64}` }}
                style={{ width: 123, height: 123 }}
              />
            ) : (
              <Text>No hay imagen</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}
