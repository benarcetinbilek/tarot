import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  TouchableOpacity,
  View,
} from "react-native";

const ANGLE_DELTA = Math.PI / 10; // Kartlar arasındaki açı farkı
const RADIUS = 200; // Çemberin yarıçapı

export const CircleDeck: React.FC<{}> = ({}) => {
  const [cardWidth, setCardWidth] = useState(85);
  const [cardHeight, setCardHeight] = useState(150);

  const visibleDeck = useRef(
    Array(20)
      .fill(0)
      .map(() => ({
        position: new Animated.ValueXY({ x: 0, y: 0 }),
        scale: new Animated.Value(1),
        angle: new Animated.Value(0), // Eklenen açı değerleri
      }))
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        rotateCircle(dx); // Parmak kaydırıldıkça çemberin etrafında döndür
      },
    })
  ).current;

  useEffect(() => {
    const { width, height } = Dimensions.get("window");
    const centerX = width / 2; // Çemberin merkezi X
    const centerY = height - 150 - 20; // Çemberin merkezi Y

    visibleDeck.forEach(({ position }) => {
      position.setValue({ x: centerX, y: centerY });
    });

    growingCards(); // Kartlar büyüyecek
  }, []);

  const growingCards = () => {
    const growAnimations = visibleDeck.map(({ scale }) =>
      Animated.timing(scale, {
        toValue: 1.25, // Kartların büyümesi
        duration: 400,
        useNativeDriver: true,
      })
    );

    Animated.stagger(40, growAnimations).start(() => {
      spreadCircle(); // Kartlar çembere yayılacak
    });
  };

  const spreadCircle = () => {
    const { width, height } = Dimensions.get("window");
    const centerX = width / 2; // Çemberin merkezi X
    const centerY = height - 150 - 20; // Çemberin merkezi Y
    const radius = RADIUS; // Çemberin yarıçapı

    visibleDeck.forEach(({ position, angle }, i) => {
      const angleValue = (i - Math.floor(visibleDeck.length / 2)) * ANGLE_DELTA; // Kartların açısını ayarlama

      // Çemberin etrafına yayılacak kartların x ve y pozisyonları
      const x = centerX + radius * Math.cos(angleValue);
      const y = centerY + radius * Math.sin(angleValue);

      Animated.spring(position, {
        toValue: { x, y },
        useNativeDriver: true,
      }).start();

      // Açı değerlerini güncelle
      angle.setValue(angleValue);
    });
  };

  const rotateCircle = (dx: number) => {
    const rotationFactor = 0.005; // Parmak kaydırma hızını kontrol et
    const rotation = dx * rotationFactor; // Döndürme miktarı

    visibleDeck.forEach(({ angle }) => {
      // Çemberin merkezine göre yeni açı değerini hesapla
      Animated.spring(angle, {
        toValue: angle._value + rotation, // Yeni açı
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={{ flex: 1, overflow: "hidden" }} {...panResponder.panHandlers}>
      {visibleDeck.map(({ position, scale, angle }, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            transform: [
              ...position.getTranslateTransform(),
              { scale: scale },
              {
                rotate: angle.interpolate({
                  inputRange: [-Math.PI, Math.PI],
                  outputRange: ["-180deg", "180deg"], // Kartların dönmesi için dönüşüm
                }),
              },
            ],
          }}
        >
          <TouchableOpacity>
            <Image
              source={require("../../assets/images/cards/1-resized.png")}
              style={{
                width: cardWidth,
                height: cardHeight,
                resizeMode: "contain",
              }}
            />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};
