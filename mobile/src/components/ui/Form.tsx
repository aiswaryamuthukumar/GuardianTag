import { Pressable, Switch, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/src/theme";

export function TextField({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label?: string; error?: string | null; hint?: string }) {
  return (
    <View className="mb-3">
      {label ? <Text className="text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        className={`bg-surface text-white rounded-xl px-4 py-3 border ${error ? "border-emergency" : "border-border"}`}
        accessibilityLabel={label}
        {...props}
      />
      {error ? <Text className="text-emergency text-xs mt-1">{error}</Text> : null}
      {!error && hint ? <Text className="text-muted text-xs mt-1">{hint}</Text> : null}
    </View>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center py-3">
      <View className="flex-1 pr-3">
        <Text className="text-white font-medium">{label}</Text>
        {description ? <Text className="text-muted text-xs mt-0.5">{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
        accessibilityLabel={label}
      />
    </View>
  );
}

/** A row of pill buttons for choosing one option (filters, tabs, categories). */
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
            className={`px-3.5 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-surface border-border"}`}
          >
            <Text className={`text-sm font-medium ${active ? "text-white" : "text-muted"}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
