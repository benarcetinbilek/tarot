import React, { useState } from "react";
import { Button, Dimensions, Image, StyleSheet, View } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 80;
const RADIUS = 200;

const ANGLE_MIN = Math.PI / 4;
const ANGLE_MAX = (3 * Math.PI) / 4;
const ANGLE_DELTA = Math.PI / 10;

const TOTAL_CARDS = 78;

const Deck = () => {
  const [visibleDeck, setVisibleDeck] = useState([
    { id: 75, angle: Math.PI / 2 - 3 * ANGLE_DELTA }, // -3
    { id: 76, angle: Math.PI / 2 - 2 * ANGLE_DELTA }, // -2
    { id: 77, angle: Math.PI / 2 - 1 * ANGLE_DELTA }, // -1
    { id: 0, angle: Math.PI / 2 }, //  0 (center)
    { id: 1, angle: Math.PI / 2 + 1 * ANGLE_DELTA }, // +1
    { id: 2, angle: Math.PI / 2 + 2 * ANGLE_DELTA }, // +2
    { id: 3, angle: Math.PI / 2 + 3 * ANGLE_DELTA }, // +3
  ]);

  const [isTurning, setIsTurning] = useState("");

  // useEffect(() => {
  //   // Kaydırma sonrası açıları kontrol et
  //   isCardOutOfAngle(visibleDeck);
  // }, [visibleDeck]);

  const isCardOutOfAngle = (deck) => {
    let updatedDeck = [...deck];

    if (isTurning === "left") {
      const last = deck[deck.length - 1];
      if (last.angle < ANGLE_MIN) {
        updatedDeck.pop(); // en sağdaki çıktı
        const maxAngle = Math.max(...updatedDeck.map((c) => c.angle));
        const maxId = Math.max(...updatedDeck.map((c) => c.id));
        updatedDeck.push({ id: maxId + 1, angle: maxAngle + ANGLE_DELTA });
      }
    } else if (isTurning === "right") {
      const first = deck[0];
      if (first.angle > ANGLE_MAX) {
        updatedDeck.shift(); // en soldaki çıktı
        const minAngle = Math.min(...updatedDeck.map((c) => c.angle));
        const minId = Math.min(...updatedDeck.map((c) => c.id));
        updatedDeck.unshift({ id: minId - 1, angle: minAngle - ANGLE_DELTA });
      }
    }

    setVisibleDeck(updatedDeck);
  };

  const calculateCoordinates = (angle) => {
    const x = width / 2 - CARD_WIDTH / 2 + RADIUS * Math.cos(angle);
    const y = 300 - RADIUS * Math.sin(angle);
    return { x, y };
  };

  const getWrappedId = (id) => {
    return (id + TOTAL_CARDS) % TOTAL_CARDS;
  };

  const handleMove = (direction) => {
    console.log(visibleDeck);
    setIsTurning(direction);

    setVisibleDeck((prevDeck) => {
      // 1. Açıları güncelle
      let updated = prevDeck.map((card) => ({
        ...card,
        angle:
          direction === "left"
            ? card.angle - ANGLE_DELTA
            : card.angle + ANGLE_DELTA,
      }));

      // 2. Yay içindekileri tut
      updated = updated.filter(
        (c) => c.angle >= ANGLE_MIN && c.angle <= ANGLE_MAX
      );

      // 3. Kart sayısı 7'den azsa ekle
      while (updated.length < 7) {
        if (direction === "left") {
          const rightmost = updated.reduce((a, b) =>
            a.angle > b.angle ? a : b
          );
          const newAngle = rightmost.angle + ANGLE_DELTA;
          const newId = getWrappedId(rightmost.id + 1);
          updated.push({ id: newId, angle: newAngle });
        } else {
          const leftmost = updated.reduce((a, b) =>
            a.angle < b.angle ? a : b
          );
          const newAngle = leftmost.angle - ANGLE_DELTA;
          const newId = getWrappedId(leftmost.id - 1);
          updated.unshift({ id: newId, angle: newAngle });
        }
      }

      return updated;
    });
  };

  return (
    <View style={styles.container}>
      {visibleDeck
        .filter((c) => c.angle >= ANGLE_MIN && c.angle <= ANGLE_MAX)
        .map((card, i) => {
          const { x, y } = calculateCoordinates(card.angle);
          return (
            <Image
              key={i}
              source={require("../../assets/images/cards/1-resized.png")}
              style={[styles.card, { left: x, top: y }]}
            />
          );
        })}

      <View style={styles.controls}>
        <Button title="← Sola Kaydır" onPress={() => handleMove("left")} />
        <Button title="→ Sağa Kaydır" onPress={() => handleMove("right")} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    position: "absolute",
    resizeMode: "contain",
  },
  controls: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default Deck;
