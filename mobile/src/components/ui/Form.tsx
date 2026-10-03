import { useState } from "react";
import { Pressable, Switch, Text, TextInput, View, type TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/src/theme";

/** Labelled input. With secureTextEntry it gets a show/hide toggle. */
export function TextField({
  label,
  error,
  hint,
  secureTextEntry,
  ...props
}: TextInputProps & { label?: string; error?: string | null; hint?: string }) {
  const [hidden, setHidden] = useState(true);
  const border = error ? "border-emergency" : "border-border";
  return (
    <View className="mb-3">
      {label ? <Text className="text-muted text-[13px] mb-1.5">{label}</Text> : null}
      <View className={`flex-row items-center bg-surface-alt rounded-xl border ${border}`}>
        <TextInput
          placeholderTextColor={colors.muted}
          className="flex-1 text-foreground px-4 py-3 text-[15px]"
          accessibilityLabel={label}
          secureTextEntry={secureTextEntry && hidden}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            className="px-3"
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Feather name={hidden ? "eye" : "eye-off"} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-emergency text-[12px] mt-1">{error}</Text> : null}
      {!error && hint ? <Text className="text-muted text-[12px] mt-1">{hint}</Text> : null}
    </View>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
  icon,
  isLast = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row items-center py-3.5 ${isLast ? "" : "border-b border-hairline"}`}>
      {icon ? (
        <View className="w-9 h-9 rounded-full bg-surface-alt items-center justify-center mr-3">
          <Feather name={icon} size={17} color={colors.mutedLight} />
        </View>
      ) : null}
      <View className="flex-1 pr-3">
        <Text className="text-foreground text-[15px] font-medium">{label}</Text>
        {description ? <Text className="text-muted text-[13px] mt-0.5">{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Filter chips for choosing one option (filters, tabs, categories). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="px-3 py-1.5 rounded-full border"
            style={{ backgroundColor: active ? colors.primary : "transparent", borderColor: active ? colors.primary : colors.border }}
          >
            <Text className={`text-[13px] font-medium ${active ? "text-background" : "text-muted"}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
