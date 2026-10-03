import { useEffect, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { Segmented, TextField } from "@/src/components/ui/Form";
import { SectionTitle } from "@/src/components/ui/Display";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { PhotoPicker } from "@/src/features/assets/PhotoPicker";
import { useAsset, useSaveAsset } from "@/src/features/assets/api";
import { useDevices } from "@/src/features/devices/api";
import { categoryIcons, categoryLabels } from "@/src/lib/format";
import type { AssetCategory } from "@/src/types/api";

const CATEGORIES = (Object.keys(categoryLabels) as AssetCategory[]).map((value) => ({
  value,
  label: `${categoryIcons[value]} ${categoryLabels[value]}`,
}));

/** Create a belonging, or edit one when `id` is given. */
export default function AssetFormScreen({ id, deviceId }: { id?: string; deviceId?: string }) {
  const existing = useAsset(id);
  const devices = useDevices();
  const save = useSaveAsset(id);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("bag");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [device, setDevice] = useState<string>(deviceId ?? "none");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const a = existing.data;
    if (!a) return;
    setName(a.name);
    setCategory(a.category);
    setLocation(a.location ?? "");
    setDescription(a.description ?? "");
    setPhoto(a.photo_url);
    setDevice(a.device_id ?? "none");
  }, [existing.data]);

  const onSave = () => {
    if (name.trim().length < 2) return setError("Give it a name, e.g. 'Black backpack'.");
    setError(null);
    save.mutate(
      {
        name: name.trim(),
        category,
        location: location.trim() || null,
        description: description.trim() || null,
        photo_url: photo,
        device_id: device === "none" ? null : device,
      },
      { onSuccess: (asset) => (id ? router.back() : router.replace(`/assets/${asset.id}`)) },
    );
  };

  const deviceOptions = [
    { value: "none", label: "No device" },
    ...(devices.data ?? []).map((d) => ({ value: d.id, label: `📡 ${d.name}` })),
  ];

  return (
    <ScreenContainer>
      <ScreenHeader title={id ? "Edit belonging" : "New belonging"} subtitle="Something GuardianTag should protect" showBack />
      <PhotoPicker value={photo} onChange={setPhoto} />
      <TextField label="Name" placeholder="Black backpack" value={name} onChangeText={setName} />
      <Text className="text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">Category</Text>
      <Segmented options={CATEGORIES} value={category} onChange={setCategory} />
      <SectionTitle title="Where is it?" />
      <TextField label="Location" placeholder="Under the bed / Locker 3" value={location} onChangeText={setLocation} />
      <TextField
        label="Notes"
        placeholder="Serial number, colour, what's inside…"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <SectionTitle title="Guarded by" />
      <Segmented options={deviceOptions} value={device} onChange={setDevice} />
      <Text className="text-muted text-xs mt-2 mb-5">
        Alerts from this device are attributed to this belonging, and ignored while it is disarmed.
      </Text>
      {error || save.error ? <Text className="text-emergency mb-3">{error ?? save.error?.message}</Text> : null}
      <Button label={id ? "Save changes" : "Add belonging"} onPress={onSave} loading={save.isPending} />
    </ScreenContainer>
  );
}
