import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  setIsShuffling: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCircleDeck: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTitleShow: React.Dispatch<React.SetStateAction<boolean>>;
};

const CARD_COUNT = 20;
const CARD_WIDTH = 120;
const CARD_HEIGHT = 150;
const MARGIN = 10;

export const ShuffleCards: React.FC<Props> = ({
  setIsShuffling,
  setIsCircleDeck,
  setIsTitleShow,
}) => {
  const [isDoneButton, setIsDoneButton] = useState(false);
  // const [isDeckShuffling, setIsDeckShuffling] = useState(false);
  let isFirstHalfShuffling = false;
  let isSecondHalfShuffling = false;

  let isDeckShuffling = false;

  const { width, height } = Dimensions.get("window");
  const centerX = width / 2 - CARD_WIDTH / 2;
  const bottomY = height - CARD_HEIGHT - 20;

  const shuffleArea = useRef({ width: 0, height: 0 });

  const positions = useRef(
    Array(CARD_COUNT)
      .fill(0)
      .map(() => new Animated.ValueXY({ x: centerX, y: bottomY }))
  ).current;

  // const shuffleCards = () => {
  //   isDeckShuffling = true;
  //   !isDoneButton && setIsDoneButton(true);
  //   const shuffleAnimations = positions.map((pos) => {
  //     const areaWidth = shuffleArea.current.width;
  //     const areaHeight = shuffleArea.current.height;

  //     const maxX = areaWidth - CARD_WIDTH;
  //     const maxY = areaHeight - CARD_HEIGHT - 30;

  //     const x = Math.random() * maxX;
  //     const y = Math.random() * maxY;

  //     return Animated.spring(pos, {
  //       toValue: { x, y },
  //       useNativeDriver: true,
  //       speed: 10,
  //       bounciness: 0,
  //     });
  //   });
  //   Animated.stagger(50, shuffleAnimations).start(() => {
  //     isDeckShuffling = false;
  //   });
  // };

  const shuffleFirstHalfDeck = () => {
    isDeckShuffling = true;

    // İlk yarıyı al
    const halfLength = Math.floor(positions.length / 2);
    const firstHalf = positions.slice(0, halfLength);
    const secondHalf = positions.slice(halfLength); // İkinci yarıyı burada da alıyoruz

    // İlk yarı animasyonları
    const shuffleFirstHalfAnimations = firstHalf.map((pos) => {
      const areaWidth = shuffleArea.current.width;
      const areaHeight = shuffleArea.current.height;
      const maxX = areaWidth - CARD_WIDTH;
      const maxY = areaHeight - CARD_HEIGHT - 30;

      const x = Math.random() * maxX;
      const y = Math.random() * maxY;

      return Animated.spring(pos, {
        toValue: { x, y },
        useNativeDriver: true,
        speed: 10,
        bounciness: 0,
      });
    });

    // İkinci yarı animasyonları
    const shuffleSecondHalfAnimations = secondHalf.map((pos) => {
      const areaWidth = shuffleArea.current.width;
      const areaHeight = shuffleArea.current.height;
      const maxX = areaWidth - CARD_WIDTH;
      const maxY = areaHeight - CARD_HEIGHT - 30;

      const x = Math.random() * maxX;
      const y = Math.random() * maxY;

      return Animated.spring(pos, {
        toValue: { x, y },
        useNativeDriver: true,
        speed: 10,
        bounciness: 0,
      });
    });

    // Hem ilk yarıyı hem de ikinci yarıyı paralel olarak başlat
    Animated.stagger(50, shuffleFirstHalfAnimations).start();
    Animated.stagger(50, shuffleSecondHalfAnimations).start(() => {
      isDeckShuffling = false;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: () => {
        if (!isDeckShuffling) {
          shuffleFirstHalfDeck();
          setIsDoneButton(true);
        }
      },
    })
  ).current;

  const shufflingDoneHandler = () => {
    setTimeout(() => {
      setIsShuffling(false);
    }, 500);
    setTimeout(() => {
      setIsCircleDeck(true);
    }, 400);

    positions.forEach((pos) => {
      Animated.timing(pos, {
        toValue: { x: centerX, y: bottomY },
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setIsTitleShow(false);
      });
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View
        {...panResponder.panHandlers}
        style={{ flex: 1 }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          shuffleArea.current = { width, height };
        }}
      >
        {positions.map((pos, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              transform: pos.getTranslateTransform(),
            }}
          >
            <Image
              source={require("../../assets/images/cards/1-resized.png")}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                resizeMode: "contain",
              }}
            />
          </Animated.View>
        ))}
      </View>

      {isDoneButton && (
        <TouchableOpacity
          onPress={() => shufflingDoneHandler()}
          style={{
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 8,
            alignSelf: "center",
            marginBottom: 40,
          }}
        >
          <Text style={{ color: "#000" }}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
