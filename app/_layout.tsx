import { Stack } from "expo-router";
import { ImageBackground, StyleSheet } from "react-native";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground
      source={require("../assets/images/bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      >
        {children}
      </Stack>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
});
