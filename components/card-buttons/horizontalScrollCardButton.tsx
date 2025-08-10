import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function HorizontalScrollCardButton({
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
      <Image source={imageUrl} style={styles.img} />
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 100,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  text: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  img: {
    width: 40,
    height: 40,
  },
});
