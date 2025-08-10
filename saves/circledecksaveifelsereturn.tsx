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
  const [animationComplete, setAnimationComplete] = useState(false);

  const angleOffset = useRef(new Animated.Value(0)).current;
  const angleBase = useRef(
    Array(deckSize)
      .fill(0)
      .map((_, i) => (i - Math.floor(deckSize / 2)) * ANGLE_DELTA)
  ).current;

  // İlk animasyonlar için scale ve position değerleri
  const scaleValues = useRef(
    Array(deckSize)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  const positionValues = useRef(
    Array(deckSize)
      .fill(0)
      .map(() => new Animated.ValueXY({ x: centerX, y: bottomY }))
  ).current;

  const pan = useRef({ x: 0 }).current;
  const currentAngle = useRef(0);

  const rotateDeckByDelta = (dx: number) => {
    if (!animationComplete) return; // Animasyon tamamlanmadan döndürme yapma

    const angleChange = (dx / width) * Math.PI * 0.3;

    currentAngle.current += angleChange;

    Animated.spring(angleOffset, {
      toValue: currentAngle.current,
      useNativeDriver: false,
      speed: 10,
      bounciness: 0,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        animationComplete && Math.abs(gesture.dx) > 5, // Sadece animasyon tamamlandıktan sonra
      onPanResponderMove: (_, gesture) => {
        if (animationComplete) {
          rotateDeckByDelta(gesture.dx - pan.x);
          pan.x = gesture.dx;
        }
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

  // İlk animasyonları başlat
  useEffect(() => {
    growCards();
  }, []);

  const growCards = () => {
    // Kartları büyütme animasyonu
    const growAnimations = scaleValues.map((scale) =>
      Animated.timing(scale, {
        toValue: 1.25,
        duration: 500,
        useNativeDriver: true,
      })
    );

    // Kartları büyütme işlemi bitince yayılmaya başla
    Animated.stagger(50, growAnimations).start(() => {
      spreadCircle();
    });
  };

  const spreadCircle = () => {
    // Kartları yaymak için animasyon
    const spreadAnimations = positionValues.map((position, i) => {
      const angle = angleBase[i];
      const x = centerX + RADIUS * Math.cos(angle);
      const y = bottomY + RADIUS * Math.sin(angle);

      return Animated.spring(position, {
        toValue: { x, y },
        useNativeDriver: true,
        speed: 10,
        bounciness: 5,
      });
    });

    // Yayılma animasyonlarını başlat
    Animated.stagger(50, spreadAnimations).start(() => {
      setAnimationComplete(true); // Animasyon tamamlandı, döndürme aktif
    });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#000", overflow: "hidden" }}
      {...panResponder.panHandlers}
    >
      {angleBase.map((baseAngle, i) => {
        if (!animationComplete) {
          // İlk animasyon aşamasında
          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                transform: [
                  { translateX: positionValues[i].x },
                  { translateY: positionValues[i].y },
                  { scale: scaleValues[i] },
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
        } else {
          // Animasyon tamamlandıktan sonra - orijinal döndürme sistemi
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
        }
      })}
    </View>
  );
};
