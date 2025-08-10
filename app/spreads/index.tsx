import SquareCardButton from "@/components/card-buttons/SquareCardButton";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header/Header";
import { spreads } from "./spreadList";

const Spreads = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Açılımlar" />
      <ScrollView contentContainerStyle={styles.grid}>
        {spreads.map((spread, index) => (
          <View key={index} style={styles.item}>
            <SquareCardButton
              title={spread.title}
              subtitle={spread.cards}
              onPress={() => {
                router.push(`/shuffle-card/${spread.id}`);
              }}
              imageUrl={require("../../assets/images/logo.png")}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 20,
    gap: 10,
  },
  item: {
    width: "48%",
    marginBottom: 12,
  },
});

export default Spreads;
