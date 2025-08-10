import { Stack } from "expo-router";
import { Text, View } from "react-native";
import Header from "../../components/header/Header";

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          //   headerBackTitleVisible: false,
        }}
      />
      <Header
        showBackButton={true}
        showLogo={false}
        showDeckAssetDrawer={false}
        showSettings={false}
        title="Ayarlar"
      />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Settings Sayfasi</Text>
      </View>
    </>
  );
}
