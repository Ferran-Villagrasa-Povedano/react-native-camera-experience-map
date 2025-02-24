import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, Text, TouchableOpacity, View } from 'react-native';
import FlipCameraAndroid from '@assets/FlipCameraAndroid';
import FlashAuto from '@assets/FlashAuto';
import FlashOff from '@assets/FlashOff';
import FlashOn from '@assets/FlashOn';


export default function App() {
  const [facing, setFacing] = useState('back'); // back, front
  const [flash, setFlash] = useState('off'); // off, on, auto
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-center pb-2">We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const toggleFlashMode = () => {
    setFlash(current => (current === 'off' ? 'on' : (current === 'on' ? 'auto' : 'off')));
  }

  const takePhoto = () => {
    cameraRef.current.takePictureAsync().then(data => {
      console.log(data.uri);
    });
  }

  return (
    <View className="flex-1">
      <CameraView ref={cameraRef} className="flex-1" facing={facing} flash={flash}>
        <View className="w-full h-full bg-transparent flex-row justify-between p-4">

          <View className="absolute top-0 w-full flex-row justify-between p-4">
            <TouchableOpacity className="p-4 bg-black/50 rounded-full" onPress={toggleFlashMode}>
              {flash === 'off' ? (
                <FlashOff className="w-8 h-8 text-white" color="#fff" />
              ) : (
                flash === 'on' ? (
                  <FlashOn className="w-8 h-8 text-white" color="#fff" />
                ) : (
                  <FlashAuto className="w-8 h-8 text-white" color="#fff" />
                ))}
            </TouchableOpacity>

            <TouchableOpacity className="p-4 bg-black/50 rounded-full" onPress={toggleCameraFacing}>
              <FlipCameraAndroid className="w-8 h-8 text-white" color="#fff" />
            </TouchableOpacity>
          </View>


          <View className="absolute bottom-8 w-full flex-row justify-center px-8 items-center">
            <TouchableOpacity className="w-16 h-16 bg-white rounded-full border-4 border-gray-300" onPress={takePhoto} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}
