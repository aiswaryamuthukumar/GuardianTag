import { useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { OptionSheet } from "@/src/components/ui/ConfirmSheet";
import { fileUrl } from "@/src/lib/api/client";
import { useApi } from "@/src/lib/api/useApi";
import { toastBus } from "@/src/lib/toast";
import { colors } from "@/src/theme";

/**
 * Camera vs gallery choice, upload, and the backend path back. Render `sheet`
 * somewhere in the screen. On web there's no camera, so it opens the file picker directly.
 */
export function usePickAndUpload() {
  const api = useApi();
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<((path: string) => void) | null>(null);

  const launch = async (source: "camera" | "library", onUploaded: (path: string) => void) => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toastBus.show({ icon: "lock", title: "Permission needed", subtitle: `Allow ${source === "camera" ? "camera" : "photo"} access in Settings`, tone: "warning" });
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
      toastBus.show({ icon: "alert-circle", title: "Upload failed", subtitle: (error as Error).message, tone: "warning" });
    } finally {
      setUploading(false);
    }
  };

  const pick = (onUploaded: (path: string) => void) => {
    if (Platform.OS === "web") launch("library", onUploaded);
    else setPending(() => onUploaded);
  };

  const sheet = (
    <OptionSheet
      visible={!!pending}
      title="Add photo"
      options={[
        { label: "Take photo", onPress: () => pending && launch("camera", pending) },
        { label: "Choose from gallery", onPress: () => pending && launch("library", pending) },
      ]}
      onCancel={() => setPending(null)}
    />
  );

  return { pick, uploading, sheet };
}

export function PhotoPicker({ value, onChange }: { value: string | null; onChange: (path: string) => void }) {
  const { pick, uploading, sheet } = usePickAndUpload();
  return (
    <>
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
            <Feather name="camera" size={28} color={colors.muted} style={{ marginBottom: 6 }} />
            <Text className="text-muted">Add a photo so you can identify it fast</Text>
          </View>
        )}
      </Pressable>
      {sheet}
    </>
  );
}
