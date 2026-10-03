import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Badge } from "@/src/components/ui/Badge";
import { ProgressBar } from "@/src/components/ui/Display";
import { formatDateTime, timeAgo } from "@/src/lib/format";
import { colors, tint } from "@/src/theme";
import type { Notice } from "@/src/types/api";

/**
 * One notice. Students see an unread dot and the full text once opened;
 * wardens see delivery and read receipts that update live.
 */
export function NoticeCard({
  notice,
  view,
  expanded = true,
  onPress,
  onDelete,
}: {
  notice: Notice;
  view: "student" | "warden";
  expanded?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const urgent = notice.priority === "urgent";
  const unread = view === "student" && !notice.is_read;
  const border = urgent ? "border-emergency/60" : unread ? "border-primary/50" : "border-border";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      className={`bg-surface border rounded-2xl p-4 mb-3 ${border}`}
    >
      <View className="flex-row items-start">
        <View
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: urgent ? tint(colors.emergency, 0.14) : colors.surfaceAlt }}
        >
          <Feather name={urgent ? "alert-octagon" : "volume-2"} size={17} color={urgent ? colors.emergency : colors.mutedLight} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            {unread ? <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: colors.primary }} /> : null}
            <Text className={`text-[15px] flex-1 ${unread || view === "warden" ? "text-foreground font-semibold" : "text-foreground"}`}>
              {notice.title}
            </Text>
            {urgent ? <Badge label="Urgent" tone="emergency" /> : null}
          </View>
          <Text className="text-muted text-[12px] mt-0.5">
            {notice.hostel_block ? `Block ${notice.hostel_block}` : "Whole hostel"}
            {notice.author_name ? ` · ${notice.author_name}` : ""} · {timeAgo(notice.created_at)}
          </Text>
          <Text className="text-foreground text-[14px] mt-2 leading-5" numberOfLines={expanded ? undefined : 2}>
            {notice.body}
          </Text>

          {view === "warden" ? (
            <View className="mt-3">
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-muted text-[12px]">
                  Delivered to {notice.recipients} student{notice.recipients === 1 ? "" : "s"}
                </Text>
                <Text className="text-primary-light text-[12px] font-medium">
                  {notice.read_count}/{notice.recipients} read
                </Text>
              </View>
              <ProgressBar value={notice.read_count} max={notice.recipients || 1} />
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-muted text-[11px]">{formatDateTime(notice.created_at)}</Text>
                {onDelete ? (
                  <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" className="flex-row items-center">
                    <Feather name="trash-2" size={14} color={colors.emergency} />
                    <Text className="text-emergency-light text-[12px] ml-1">Withdraw</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
