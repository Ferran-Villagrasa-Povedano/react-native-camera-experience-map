import FlashAuto from "@assets/FlashAuto";
import FlashOff from "@assets/FlashOff";
import FlashOn from "@assets/FlashOn";
import FlipCameraAndroid from "@assets/FlipCameraAndroid";
import { auth, db } from "@src/services/firebase";
import { Camera, CameraView } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { addDoc, collection, doc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CameraScreen() {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [takingPicture, setTakingPicture] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const cameraRef = useRef();
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");

  const userMediaRef = collection(db, `users/${auth.currentUser.uid}/media`);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (takingPicture) return;
      checkGpsStatus();
      checkPermissions();
    }, 5000);

    return () => clearInterval(interval);
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

  //test@test.com

  if (!permissionsGranted || !gpsEnabled) {
    return (
      <View className="flex-1 justify-center items-center">
        {!gpsEnabled && (
          <Text className="text-center pb-2 text-red-500">
            GPS is disabled. Please enable location services.
          </Text>
        )}
        {!permissionsGranted && (
          <>
            <Text className="text-center pb-2 text-red-500">
              Camera, Location, and Library permissions are not granted.
            </Text>
            <Button onPress={checkPermissions} title="Grant All Permissions" />
          </>
        )}
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlashMode = () => {
    setFlash((current) =>
      current === "off" ? "on" : current === "on" ? "auto" : "off"
    );
  };

  const compressImage = async (photo, targetSize, minQuality = 0.1) => {
    let low = minQuality;
    let high = 1;
    let quality = high;
    let compressedPhoto = photo;

    const targetBase64Size = Math.floor((targetSize * 4) / 3);

    if (photo.base64 && photo.base64.length <= targetBase64Size) {
      return { compressedPhoto: photo, quality };
    }

    while (high - low > 0.01) {
      quality = (low + high) / 2;
      const result = await ImageManipulator.manipulateAsync(photo.uri, [], {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });

      if (result.base64.length > targetBase64Size) {
        high = quality;
      } else {
        low = quality;
        compressedPhoto = result;
      }
    }

    return { compressedPhoto, quality };
  };

  const takePhoto = async () => {
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

      const targetSize = 800000;
      const { compressedPhoto, quality } = await compressImage(
        photo,
        targetSize
      );
      console.log(`TargetSize: ${targetSize}`);
      console.log(`Quality: ${quality.toFixed(2)}`);
      console.log(`Original photo size: ${photo.base64.length}`);
      console.log(`Compressed photo size: ${compressedPhoto.base64.length}`);

      // const asset = await MediaLibrary.createAssetAsync(compressedPhoto.uri);
      albumId = "Ss5t0ZRHcryxNeA7OAtz";
      console.log("User id:", auth.currentUser.uid);
      const userMediaRef = collection(db, `albums/${albumId}/media`);

      const photoData = {
        author: doc(db, `users/${auth.currentUser.uid}`),
        type: "image/jpeg",
        fileName: fileName,
        base64: compressedPhoto.base64,
        latitude,
        longitude,
        timestamp,
      };

      await addDoc(userMediaRef, photoData);
      console.log("Photo added to Firestore");
    } catch (error) {
      console.error("Error taking photo:", error);
    } finally {
      setTakingPicture(false);
    }
  };

  return (
    <View className="flex-1">
      <CameraView
        ref={cameraRef}
        className="flex-1"
        facing={facing}
        flash={flash}
      >
        <View className="w-full h-full bg-transparent flex-row justify-between p-4">
          {/* Top Bar */}
          <View className="absolute top-0 w-full flex-row justify-between p-4">
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
              <FlipCameraAndroid className="w-8 h-8 text-white" color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Bar */}
          <View className="absolute bottom-8 w-full flex-row px-8 justify-center items-center">
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
          </View>
        </View>
      </CameraView>
    </View>
  );
}
