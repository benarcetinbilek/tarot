import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  TouchableOpacity,
  View,
} from "react-native";

const ANGLE_DELTA = Math.PI / 10;
const RADIUS = 200;
const CARD_WIDTH = 85;
const CARD_HEIGHT = 150;

type Props = {};

export const CircleDeck: React.FC<Props> = ({}) => {
  const { width, height } = Dimensions.get("window");
  const centerX = width / 2 - CARD_WIDTH / 2;
  const bottomY = height;

  const [deckSize] = useState(19);

  const pan = useRef({ x: 0 }).current;
  const globalAngleOffset = useRef(0); // 🔧 Değiştirilebilir useRef

  // Animated değerleri ve açılar
  const visibleDeck = useRef(
    Array(deckSize)
      .fill(0)
      .map(() => ({
        position: new Animated.ValueXY({ x: centerX, y: bottomY }),
        scale: new Animated.Value(1),
      }))
  ).current;

  const angleBase = useRef(
    Array(deckSize)
      .fill(0)
      .map((_, i) => (i - Math.floor(deckSize / 2)) * ANGLE_DELTA)
  ).current;

  useEffect(() => {
    growCards();
  }, []);

  const growCards = () => {
    const animations = visibleDeck.map(({ scale }) =>
      Animated.timing(scale, {
        toValue: 1.25,
        duration: 400,
        useNativeDriver: true,
      })
    );

    Animated.stagger(40, animations).start(() => {
      spreadCircle();
    });
  };

  const spreadCircle = () => {
    visibleDeck.forEach(({ position }, i) => {
      const angle = angleBase[i];
      const x = centerX + RADIUS * Math.cos(angle);
      const y = bottomY + RADIUS * Math.sin(angle);

      Animated.spring(position, {
        toValue: { x, y },
        useNativeDriver: true,
      }).start();
    });
  };

  const rotateDeckByDelta = (dx: number) => {
    const angleChange = (dx / width) * Math.PI * 0.3;
    globalAngleOffset.current += angleChange;

    visibleDeck.forEach(({ position }, i) => {
      const angle = angleBase[i] + globalAngleOffset.current;
      const x = centerX + RADIUS * Math.cos(angle);
      const y = bottomY + RADIUS * Math.sin(angle);

      Animated.spring(position, {
        toValue: { x, y },
        useNativeDriver: true,
      }).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
      onPanResponderMove: (_, gesture) => {
        rotateDeckByDelta(gesture.dx - pan.x);
        pan.x = gesture.dx;
      },
      onPanResponderRelease: () => {
        pan.x = 0;
      },
    })
  ).current;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#000", overflow: "hidden" }}
      {...panResponder.panHandlers}
    >
      {visibleDeck.map(({ position, scale }, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            transform: [...position.getTranslateTransform(), { scale }],
          }}
        >
          <TouchableOpacity activeOpacity={0.8}>
            <Image
              source={require("../../assets/images/cards/1-resized.png")}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                resizeMode: "contain",
              }}
            />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};
