import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { fileUrl } from "@/src/lib/api/client";
import { useApi } from "@/src/lib/api/useApi";
import { colors } from "@/src/theme";

/** Asks camera vs gallery, uploads the image, and returns the backend path. */
export function usePickAndUpload() {
  const api = useApi();
  const [uploading, setUploading] = useState(false);

  const pick = (onUploaded: (path: string) => void) => {
    const launch = async (source: "camera" | "library") => {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", `Allow ${source === "camera" ? "camera" : "photo"} access in Settings.`);
        return;
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6, allowsEditing: true, aspect: [4, 3] };
      const result =
        source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      setUploading(true);
      try {
        const { url } = await api.uploadImage(result.assets[0].uri);
        onUploaded(url);
      } catch (error) {
        Alert.alert("Upload failed", (error as Error).message);
      } finally {
        setUploading(false);
      }
    };

    Alert.alert("Add photo", undefined, [
      { text: "Take photo", onPress: () => launch("camera") },
      { text: "Choose from gallery", onPress: () => launch("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return { pick, uploading };
}

export function PhotoPicker({ value, onChange }: { value: string | null; onChange: (path: string) => void }) {
  const { pick, uploading } = usePickAndUpload();
  return (
    <Pressable
      onPress={() => pick(onChange)}
      accessibilityRole="button"
      accessibilityLabel={value ? "Change photo" : "Add photo"}
      className="h-44 bg-surface border border-dashed border-border rounded-2xl items-center justify-center overflow-hidden mb-4"
    >
      {uploading ? (
        <ActivityIndicator color={colors.primary} />
      ) : value ? (
        <Image source={{ uri: fileUrl(value) }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="items-center">
          <Text className="text-3xl mb-1">📷</Text>
          <Text className="text-muted">Add a photo so you can identify it fast</Text>
        </View>
      )}
    </Pressable>
  );
}
