import * as ImageManipulator from "expo-image-manipulator";

export default async function compressImage(photo, targetSize, minQuality = 0.1) {
    let low = minQuality;
    let high = 1;
    let quality = high;
    let compressedPhoto = photo;

    if (photo.base64 && photo.base64.length <= targetSize) {
        return { compressedPhoto: photo, quality };
    }

    while (high - low > 0.01) {
        quality = (low + high) / 2;
        const result = await ImageManipulator.manipulateAsync(photo.uri, [], {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
        });

        if (result.base64.length > targetSize) {
            high = quality;
        } else {
            low = quality;
            compressedPhoto = result;
        }
    }

    return { compressedPhoto, quality };
};
