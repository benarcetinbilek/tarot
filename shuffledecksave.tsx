import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header/Header";
import { spreads } from "../spreads/spreadList";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = 90;
const CARD_HEIGHT = 120;
const RADIUS = 100;
const CARD_COUNT = 50;

const margin = 10;

const ShuffleCard = () => {
  const { id } = useLocalSearchParams();
  const spread = spreads?.find((s) => s.id.toString() === id) || {
    id: 99,
    title: "Not Found",
    cards: "99",
    description: "Not Found",
  };

  const positions = useRef(
    Array(CARD_COUNT)
      .fill(0)
      .map(() => new Animated.ValueXY({ x: 0, y: 0 }))
  ).current;

  // STATE: animasyon akışı ve buton için
  const [showDoneButton, setShowDoneButton] = useState(false);

  // Refs for tracking states
  const isShuffling = useRef(false);
  const isFirstShuffle = useRef(true);
  const isDragging = useRef(false);
  const canShuffleOnMove = useRef(false);
  const shuffleTimeoutRef = useRef(null);

  // Kartları alt ortada toplama fonksiyonu
  const gatherToBottom = (duration = 700) => {
    positions.forEach((pos) => {
      Animated.timing(pos, {
        toValue: { x: 0, y: 0 },
        duration,
        useNativeDriver: true,
      }).start();
    });
  };

  // Daire şeklinde yayılma fonksiyonu
  const spreadInCircle = (duration = 800) => {
    const circleRadius = RADIUS * 1.8;
    positions.forEach((pos, index) => {
      const angle = (index / positions.length) * 2 * Math.PI;
      const x = circleRadius * Math.cos(angle);
      const y = circleRadius * Math.sin(angle) * -1;
      Animated.timing(pos, {
        toValue: { x, y },
        duration,
        useNativeDriver: true,
      }).start();
    });
  };

  // Shuffle fonksiyonu (yukarıya ve yana dağılma)
  const shuffleOnce = (duration = 800, callback?) => {
    if (isShuffling.current) return;

    isShuffling.current = true;
    let finishedCount = 0;

    positions.forEach((pos, idx) => {
      const maxX = width / 2 - CARD_WIDTH / 2 - margin;
      const maxY = height - CARD_HEIGHT - margin - 100;
      const randX = Math.random() * maxX * 2 - maxX;
      const randY = -Math.random() * maxY;

      Animated.timing(pos, {
        toValue: { x: randX, y: randY },
        duration,
        useNativeDriver: true,
      }).start(() => {
        finishedCount++;
        if (finishedCount === positions.length) {
          isShuffling.current = false;
          if (callback) {
            callback();
          }
        }
      });
    });
  };

  // İlk açılışta kartlar alt ortada üst üste
  useEffect(() => {
    gatherToBottom(0);
    setShowDoneButton(false);
    return () => {
      if (shuffleTimeoutRef.current) {
        clearTimeout(shuffleTimeoutRef.current);
      }
    };
  }, [id]);

  // Kullanıcı desteye ilk tıklayınca
  const handleDeckPress = () => {
    if (!isFirstShuffle.current || isShuffling.current) return;

    isFirstShuffle.current = false;
    shuffleOnce(800, () => {
      canShuffleOnMove.current = true;
      setShowDoneButton(true);
    });
  };

  // Touch start - parmak ekrana değdiğinde
  const handleTouchStart = () => {
    console.log("Touch start");
    isDragging.current = true;

    // İlk dokunuşsa shuffle'ı başlat
    if (isFirstShuffle.current) {
      handleDeckPress();
    }
  };

  // Touch move - parmak hareket ettiğinde
  const handleTouchMove = () => {
    console.log("Touch move", {
      canShuffleOnMove: canShuffleOnMove.current,
      isShuffling: isShuffling.current,
      isDragging: isDragging.current,
    });

    if (
      !canShuffleOnMove.current ||
      isShuffling.current ||
      !isDragging.current
    ) {
      return;
    }

    // Shuffle işlemini başlat
    shuffleOnce(800, () => {
      // Animasyon bittikten sonra, eğer parmak hala hareket ediyorsa
      // kısa bir gecikme ile tekrar shuffle'a izin ver
      if (isDragging.current) {
        shuffleTimeoutRef.current = setTimeout(() => {
          // Bu sayede sürekli hareket sırasında shuffle tetiklenebilir
        }, 100);
      }
    });
  };

  // Touch end - parmak ekrandan kalkınca
  const handleTouchEnd = () => {
    console.log("Touch end");
    isDragging.current = false;
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }
  };

  // Done butonuna tıklanınca
  const handleDone = () => {
    setShowDoneButton(false);
    canShuffleOnMove.current = false;

    // Önce kartları topla, sonra daireye yay
    gatherToBottom(600);
    setTimeout(() => {
      spreadInCircle(800);
    }, 650);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Shuffle" />
      <Text style={styles.title}>{spread?.title}</Text>
      {isFirstShuffle.current && (
        <Text style={styles.infoText}>
          Touch the deck and shuffle for merging your energy
        </Text>
      )}
      {!isFirstShuffle.current && !showDoneButton && (
        <Text style={styles.infoText}>
          Touch and move your finger to shuffle the cards
        </Text>
      )}

      <View
        style={styles.deckContainer}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
        onResponderTerminate={handleTouchEnd}
      >
        <View style={styles.touchableDeck}>
          {positions.map((pos, i) => (
            <Animated.View
              key={i}
              style={[
                styles.card,
                {
                  transform: pos.getTranslateTransform(),
                  zIndex: CARD_COUNT - i, // Üstteki kartlar daha yüksek z-index
                },
              ]}
            >
              <Image
                source={require("../../assets/images/cards/1-resized.png")}
                style={styles.cardImage}
                resizeMode="contain"
              />
            </Animated.View>
          ))}
        </View>
      </View>

      {showDoneButton && (
        <View style={styles.doneButtonContainer}>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101010",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    color: "#fff",
    marginVertical: 10,
  },
  deckContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 60,
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  infoText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  touchableDeck: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  doneButtonContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  doneButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  doneButtonText: {
    color: "#101010",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default ShuffleCard;
