import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import colors from "../constants/colors";

const PUNJAB_DISTRICTS = [
  "Attock",
  "Bahawalnagar",
  "Bahawalpur",
  "Bhakkar",
  "Chakwal",
  "Chiniot",
  "Dera Ghazi Khan",
  "Faisalabad",
  "Gujranwala",
  "Gujrat",
  "Hafizabad",
  "Jhang",
  "Jhelum",
  "Kasur",
  "Khanewal",
  "Khushab",
  "KotAddu",
  "Lahore",
  "Layyah",
  "Lodhran",
  "Mandi Bahauddin",
  "Mianwali",
  "Multan",
  "Murree",
  "Muzaffargarh",
  "Nankana Sahib",
  "Narowal",
  "Okara",
  "Pakpattan",
  "Rahimyar Khan",
  "Rajanpur",
  "Rawalpindi",
  "Sahiwal",
  "Sargodha",
  "Sheikhupura",
  "Sialkot",
  "Talagang",
  "Toba Tek Singh",
  "Tunsa",
  "Vehari",
  "Wazirabad"
];

export default function DistrictPicker({ value, onChange, dark = false, allowClear = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedDistrict = value || "";
  const filteredDistricts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return PUNJAB_DISTRICTS;
    return PUNJAB_DISTRICTS.filter((district) => district.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const selectDistrict = (district) => {
    onChange(district);
    close();
  };

  const clearDistrict = () => {
    onChange(null);
    close();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={`h-14 justify-center rounded-[24px] px-5 ${dark ? "bg-white/5" : "bg-sage-50"}`}
      >
        <Text className={`text-base font-bold ${selectedDistrict ? (dark ? "text-white" : "text-ink") : "text-[#A09689]"}`}>
          {selectedDistrict || "Select District"}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View className="flex-1 justify-end bg-black/40">
          <View className={`max-h-[78%] rounded-t-[30px] p-5 ${dark ? "bg-sage-900" : "bg-white"}`}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className={`text-xl font-black ${dark ? "text-white" : "text-ink"}`}>Select District</Text>
              <Pressable onPress={close} className={`h-10 w-10 items-center justify-center rounded-full ${dark ? "bg-white/5" : "bg-sage-50"}`}>
                <Text className={`text-lg font-black ${dark ? "text-white" : "text-ink"}`}>x</Text>
              </Pressable>
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search district..."
              placeholderTextColor="#A09689"
              className={`mb-3 h-12 rounded-[20px] px-4 text-base font-bold ${dark ? "bg-white/5 text-white" : "bg-sage-50 text-ink"}`}
            />

            {allowClear ? (
              <Pressable
                onPress={clearDistrict}
                className={`mb-2 rounded-[18px] px-4 py-3 ${dark ? "bg-white/5" : "bg-sage-50"}`}
              >
                <Text className="font-black text-[#E24B4A]">Clear</Text>
              </Pressable>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredDistricts.map((district) => {
                const selected = selectedDistrict === district;
                return (
                  <Pressable
                    key={district}
                    onPress={() => selectDistrict(district)}
                    className="mb-2 rounded-[18px] px-4 py-3"
                    style={{ backgroundColor: selected ? colors.primary : dark ? "rgba(255,255,255,0.05)" : "#F3F8EF" }}
                  >
                    <Text className={`font-bold ${selected ? "text-white" : dark ? "text-white" : "text-ink"}`}>{district}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
