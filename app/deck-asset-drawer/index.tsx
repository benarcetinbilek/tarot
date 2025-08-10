import { View } from "react-native";
import Header from "../../components/header/Header";

const DeckAssetDrawer = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <Header title="Deste Varlıkları" showDeckAssetDrawer={false} />
      {/* Deck asset drawer content will go here */}
    </View>
  );
};

export default DeckAssetDrawer;
