import { BlurView } from "expo-blur";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const cardWidth = (Dimensions.get("window").width - 60) / 2;
const cardHeight = Dimensions.get("window").height;

export default function SquareCardButton({
  title,
  onPress,
  imageUrl,
  subtitle,
}: {
  title: string;
  onPress: () => void;
  imageUrl: any;
  subtitle?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btn, { width: cardWidth }]}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>deck: {subtitle} cards</Text>
        )}
      </View>
      <Image source={imageUrl} style={styles.img} />
      <BlurView intensity={40} tint="light" style={styles.blur}></BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: cardHeight * 0.2,
    backgroundColor: "rgba(133, 161, 232, 0.04)",
    overflow: "hidden",
    borderRadius: 10,
    position: "relative",
  },
  textContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 100,
    flexDirection: "column",
  },
  title: {
    color: "white",
    fontSize: 16,
    zIndex: 100,
  },
  subtitle: { color: "white", fontSize: 10 },
  img: {
    position: "absolute",
    bottom: 0,
    right: 0,
    height: "100%",
    zIndex: 50,
  },
  blur: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0.3,
  },
});
