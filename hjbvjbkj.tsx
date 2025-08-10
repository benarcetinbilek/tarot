import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 80;
const RADIUS = 200;
const TOTAL_CARDS = 78;

const Deck = () => {
  const [visibleCount, setVisibleCount] = useState(12); // <== Kaç kart gösterilsin burada ayarlanır

  const anglePerCard = (2 * Math.PI) / visibleCount; // 360 derece eşit dağılım
  const baseAngle = Math.PI / 2; // Yukarı bakan orta nokta

  const initialDeck = Array.from({ length: visibleCount }, (_, i) => {
    const angle = baseAngle + i * anglePerCard;
    return { offset: i, angle };
  });

  const [deck, setDeck] = useState(initialDeck);
  const pan = useRef({ x: 0 }).current;
  const baseCardId = useRef(0); // Orta kartın id’si

  const rotateDeckByDelta = (dx) => {
    const angleChange = (dx / width) * Math.PI; // Kaydırmaya göre açı
    setDeck((prev) =>
      prev.map((card) => ({
        ...card,
        angle: card.angle + angleChange,
      }))
    );

    const offsetDelta = Math.round(angleChange / anglePerCard);
    baseCardId.current =
      (baseCardId.current - offsetDelta + TOTAL_CARDS) % TOTAL_CARDS;
  };

  const normalizeAngle = (angle) => {
    let a = angle % (2 * Math.PI);
    return a < 0 ? a + 2 * Math.PI : a;
  };

  const calculateCoordinates = (angle) => {
    const x = width / 2 - CARD_WIDTH / 2 + RADIUS * Math.cos(angle);
    const y = 300 - RADIUS * Math.sin(angle);
    return { x, y };
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
      onPanResponderMove: (_, gesture) => {
        const delta = gesture.dx - pan.x;
        pan.x = gesture.dx;
        rotateDeckByDelta(delta);
      },
      onPanResponderRelease: () => {
        pan.x = 0;
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.wrapper}>
        {deck.map(({ offset, angle }) => {
          const normalized = normalizeAngle(angle);
          const id = (baseCardId.current + offset) % TOTAL_CARDS;
          const { x, y } = calculateCoordinates(normalized);
          return (
            <Image
              key={offset}
              source={require("../../assets/images/cards/1-resized.png")}
              style={[styles.card, { left: x, top: y }]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    borderColor: "red",
    borderWidth: 1,
  },
  wrapper: {
    borderColor: "green",
    borderWidth: 1,
    backgroundColor: "red",
    zIndex: 999,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    position: "absolute",
    resizeMode: "contain",
  },
});

export default Deck;
