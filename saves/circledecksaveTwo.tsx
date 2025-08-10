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
  const bottomY = height - 100;

  const [deckSize] = useState(19);

  const angleOffset = useRef(new Animated.Value(0)).current;
  const angleBase = useRef(
    Array(deckSize)
      .fill(0)
      .map((_, i) => (i - Math.floor(deckSize / 2)) * ANGLE_DELTA)
  ).current;

  const pan = useRef({ x: 0 }).current;
  const currentAngle = useRef(0);

  const rotateDeckByDelta = (dx: number) => {
    const angleChange = (dx / width) * Math.PI * 0.3;

    currentAngle.current += angleChange;

    Animated.spring(angleOffset, {
      toValue: currentAngle.current,
      useNativeDriver: false, // çünkü konumu manuel hesaplıyoruz
      speed: 10,
      bounciness: 0,
    }).start();
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

  const [angleVal, setAngleVal] = useState(0);

  useEffect(() => {
    const listener = angleOffset.addListener(({ value }) => {
      setAngleVal(value);
    });

    return () => angleOffset.removeListener(listener);
  }, []);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#000", overflow: "hidden" }}
      {...panResponder.panHandlers}
    >
      {angleBase.map((baseAngle, i) => {
        const angle = baseAngle + angleVal;
        const x = centerX + RADIUS * Math.cos(angle);
        const y = bottomY + RADIUS * Math.sin(angle);

        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              transform: [
                { translateX: new Animated.Value(x) },
                { translateY: new Animated.Value(y) },
                { scale: new Animated.Value(1.25) },
              ],
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
        );
      })}
    </View>
  );
};
