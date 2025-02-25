import FlashAuto from "@assets/FlashAuto";
import FlashOff from "@assets/FlashOff";
import FlashOn from "@assets/FlashOn";
import FlipCameraAndroid from "@assets/FlipCameraAndroid";
import { Camera, CameraView } from "expo-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useRef, useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [takingPicture, setTakingPicture] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const cameraRef = useRef();
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");

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

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    setTakingPicture(true);

    try {
      const photo = await cameraRef.current.takePictureAsync();
      const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");

      const location = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        timeout: 1000,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const fileName = `IMG_${timestamp}_LAT${latitude}_LON${longitude}.jpg`;

      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      console.log(`Image saved as ${fileName}`, asset);
    } catch (error) {
      console.error("Error taking photo:", error);
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
          <View className="absolute bottom-8 w-full flex-row justify-center px-8 items-center">
            <TouchableOpacity
              className="w-16 h-16 bg-white rounded-full border-4 border-gray-300"
              onPress={takePhoto}
            />
          </View>
        </View>
      </CameraView>
    </View>
  );
}
