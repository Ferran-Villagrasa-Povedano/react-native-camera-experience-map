import FlashAuto from "@assets/FlashAuto";
import FlashOff from "@assets/FlashOff";
import FlashOn from "@assets/FlashOn";
import FlipCameraAndroid from "@assets/FlipCameraAndroid";
import PermMedia from "@assets/PermMedia";
import { auth, db } from "@services/firebase";
import compressImage from "@utils/compressImage";
import { Camera, CameraView } from "expo-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
export default function CameraScreen() {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [takingPicture, setTakingPicture] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const cameraRef = useRef();
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");

  const { albumId } = useLocalSearchParams();

  const router = useRouter();

  useEffect(() => {
    checkPermissions();
    checkGpsStatus();
  }, []);

  const checkGpsStatus = async () => {
    const status = await Location.hasServicesEnabledAsync();
    setGpsEnabled(status);
  };

  const checkPermissions = async () => {
    setCheckingPermissions(true);

    const { status: cameraStatus } =
      await Camera.requestCameraPermissionsAsync();
    const { status: locationStatus } =
      await Location.requestForegroundPermissionsAsync();
    const { status: mediaStatus } =
      await MediaLibrary.requestPermissionsAsync();

    if (
      cameraStatus === "granted" &&
      locationStatus === "granted" &&
      mediaStatus === "granted"
    ) {
      setPermissionsGranted(true);
    } else {
      setPermissionsGranted(false);
    }

    setCheckingPermissions(false);
  };

  // if (!permissionsGranted || !gpsEnabled) {
  //   return (
  //     <View className="flex-1 justify-center items-center">
  //       {!gpsEnabled && (
  //         <Text className="text-center pb-2 text-red-500">
  //           GPS is disabled. Please enable location services.
  //         </Text>
  //       )}
  //       {!permissionsGranted && (
  //         <>
  //           <Text className="text-center pb-2 text-red-500">
  //             Camera, Location, and Library permissions are not granted.
  //           </Text>
  //           <Button onPress={checkPermissions} title="Grant All Permissions" />
  //         </>
  //       )}
  //     </View>
  //   );
  // }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlashMode = () => {
    setFlash((current) =>
      current === "off" ? "on" : current === "on" ? "auto" : "off"
    );
  };

  const takePhoto = async () => {
    checkPermissions();
    checkGpsStatus();

    if (!cameraRef.current) {
      return;
    }

    setTakingPicture(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });

      const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");
      console.log(
        "Location enabled:",
        await Location.hasServicesEnabledAsync()
      );
      const location = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
      });

      const latitude = location?.coords?.latitude || 0;
      const longitude = location?.coords?.longitude || 0;

      const fileName = `IMG_${timestamp}_LAT${latitude}_LON${longitude}.jpg`;

      const targetSize = 1_000_000;
      const { compressedPhoto, quality } = await compressImage(
        photo,
        targetSize
      );
      console.log(`Quality: ${quality.toFixed(2)}`);
      console.log(`TargetSize: ${targetSize}`);
      console.log(`Original photo size: ${photo.base64.length}`);
      console.log(`Compressed photo size: ${compressedPhoto.base64.length}`);

      const userMediaRef = collection(db, `albums/${albumId}/media`);

      const photoData = {
        author: doc(db, `users/${auth.currentUser.uid}`),
        type: "image/jpeg",
        fileName: fileName,
        base64: `data:image/jpeg;base64,${compressedPhoto.base64}`,
        quality: quality,
        latitude,
        longitude,
        timestamp,
      };

      const mediaDocRef = await addDoc(userMediaRef, photoData);

      const albumRef = doc(db, `albums/${albumId}`);
      await updateDoc(albumRef, { updatedAt: new Date().toISOString() });

      const mediaSnapshot = await getDocs(userMediaRef);
      if (mediaSnapshot.size === 1) {
        await updateDoc(albumRef, { coverRef: mediaDocRef });
        console.log("Updated album cover");
      }

      console.log("Photo added to Firestore", mediaDocRef.path);
    } catch (error) {
      console.error("Error taking photo:", error);
    } finally {
      setTakingPicture(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Camera" }} />
      <View className="flex-1">
        <CameraView
          ref={cameraRef}
          className="flex-1"
          facing={facing}
          flash={flash}
        >
          <View className="w-full h-full p-4 bg-transparent flex-row justify-between items-center">
            {/* Top Bar */}
            <View className="absolute top-0 w-full p-4 flex-row justify-between items-center">
              <TouchableOpacity
                className="p-4 bg-black/50 rounded-full"
                onPress={toggleFlashMode}
              >
                {flash === "off" ? (
                  <FlashOff className="w-8 h-8 text-white" color="#fff" />
                ) : flash === "on" ? (
                  <FlashOn className="w-8 h-8 text-white" color="#fff" />
                ) : (
                  <FlashAuto className="w-8 h-8 text-white" color="#fff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="p-4 bg-black/50 rounded-full"
                onPress={toggleCameraFacing}
              >
                <FlipCameraAndroid
                  className="w-8 h-8 text-white"
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View className="absolute bottom-8 w-full p-8 flex-row justify-between items-center">
              <TouchableOpacity
                className="p-4 bg-black/50 rounded-full"
                onPress={() => router.push("/home")}
              >
                <PermMedia className="w-8 h-8 text-white" color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 justify-center items-center"
                onPress={takePhoto}
              >
                {takingPicture && (
                  <ActivityIndicator
                    className="z-10"
                    size="large"
                    color="#d1d5db"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity></TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </>
  );
}
