import { Modal, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onCancel}>
        <Pressable className="bg-surface rounded-t-3xl p-5 pb-8 border-t border-border" onPress={() => {}}>
          <View className="w-10 h-1 rounded-full bg-border self-center mb-4" />
          <Text className="text-foreground text-[17px] font-bold mb-1.5">{title}</Text>
          {message ? <Text className="text-muted text-[14px] mb-5">{message}</Text> : null}
          <Button label={confirmLabel} variant={destructive ? "danger" : "primary"} onPress={onConfirm} />
          <View className="mt-2.5">
            <Button label="Cancel" variant="secondary" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
