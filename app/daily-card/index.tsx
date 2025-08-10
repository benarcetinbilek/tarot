import { View } from "react-native";
import Header from "../../components/header/Header";

const DailyCard = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <Header title="Günün Kartı" />
      {/* Daily card content goes here */}
    </View>
  );
};

export default DailyCard;
