import { BlurView } from "expo-blur";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function HorizontalCardButton({
  title,
  onPress,
  imageUrl,
}: {
  title: string;
  onPress: () => void;
  imageUrl: any;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn}>
      <Text style={styles.text}>{title}</Text>
      <Image source={imageUrl} style={styles.img} />
      <BlurView intensity={40} tint="light" style={styles.blur}></BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: "100%",
    height: "12%",
    backgroundColor: "rgba(133, 161, 232, 0.04)",
    borderRadius: 10,
    overflow: "hidden",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    color: "white",
    zIndex: 100,
  },
  img: {
    zIndex: 500,
    width: 20,
    height: 20,
  },
  blur: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.3,
  },
});
