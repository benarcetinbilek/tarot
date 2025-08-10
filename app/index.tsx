import HorizontalCardButton from "@/components/card-buttons/HorizontalCardButon";
import HorizontalScrollCardButton from "@/components/card-buttons/horizontalScrollCardButton";
import SquareCardButton from "@/components/card-buttons/SquareCardButton";
import { useRouter } from "expo-router";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Header from "../components/header/Header";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../assets/images/bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Header title="Ana Sayfa" />

        <HorizontalCardButton
          title="AI Chatbot"
          onPress={() => router.push("/chatbot")}
          imageUrl={require("../assets/images/logo.png")}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          <HorizontalScrollCardButton
            title="Classic Spread"
            onPress={() => router.push("/spreads")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <HorizontalScrollCardButton
            title="Option Comparison"
            onPress={() => router.push("/spreads")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <HorizontalScrollCardButton
            title="Compatibility"
            onPress={() => router.push("/spreads")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <HorizontalScrollCardButton
            title="Spiritual Development"
            onPress={() => router.push("/spreads")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <HorizontalScrollCardButton
            title="Marriage"
            onPress={() => router.push("/spreads")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <HorizontalScrollCardButton
            title="Gates of Life"
            onPress={() => router.push("/spreads")}
            imageUrl={require("../assets/images/logo.png")}
          />
          {/* İstediğin kadar devam ettir */}
        </ScrollView>

        <View style={styles.grid}>
          <SquareCardButton
            title="Spreads"
            onPress={() => router.push("/spreads")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <SquareCardButton
            title="Learning"
            onPress={() => router.push("/learning")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <SquareCardButton
            title="Wheel of Fortune"
            onPress={() => router.push("/wheel-of-fortune")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <SquareCardButton
            title="Popular Spreads"
            onPress={() => router.push("/spreads")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <SquareCardButton
            title="Tarot Journal"
            onPress={() => router.push("/journal")}
            imageUrl={require("../assets/images/logo.png")}
          />
          <SquareCardButton
            title="Daily Card"
            onPress={() => router.push("/daily-card")}
            imageUrl={require("../assets/images/logo.png")}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    marginTop: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10, // React Native 0.71+ destekliyor, değilse kaldır
    marginTop: 10,
  },
  horizontalScroll: {
    height: 180,
    marginTop: 15,
    // backgroundColor: "red",
  },
});
