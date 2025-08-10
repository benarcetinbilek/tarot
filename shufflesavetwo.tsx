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
const TOTAL_CARDS = 78;
const CIRCLE_RADIUS = 180;
const MAX_SELECTIONS = 4;

const margin = 10;

// Selection positions on screen (dummy positions)
const SELECTION_POSITIONS = [
  { x: width * 0.2, y: height * 0.25 },
  { x: width * 0.8, y: height * 0.25 },
  { x: width * 0.2, y: height * 0.55 },
  { x: width * 0.8, y: height * 0.55 },
];

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
  const [phase, setPhase] = useState("shuffling"); // shuffling, selecting, done
  const [selectedCards, setSelectedCards] = useState([]);
  const [availableCards, setAvailableCards] = useState(
    Array.from({ length: TOTAL_CARDS }, (_, i) => i)
  );

  // Circle selection refs
  const circleRotation = useRef(new Animated.Value(0)).current;
  const selectedPositions = useRef(
    Array(MAX_SELECTIONS)
      .fill(0)
      .map(() => new Animated.ValueXY({ x: -1000, y: -1000 }))
  ).current;

  // Refs for tracking states
  const isShuffling = useRef(false);
  const isFirstShuffle = useRef(true);
  const isDragging = useRef(false);
  const canShuffleOnMove = useRef(false);
  const shuffleTimeoutRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const lastPanX = useRef(0);

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
    const animations = positions.map((pos) => {
      const maxX = width / 2 - CARD_WIDTH / 2 - margin;
      const maxY = height - CARD_HEIGHT - margin - 100;
      const randX = Math.random() * maxX * 2 - maxX;
      const randY = -Math.random() * maxY;
      return Animated.timing(pos, {
        toValue: { x: randX, y: randY },
        duration,
        useNativeDriver: true,
      });
    });
    Animated.parallel(animations).start((finished) => {
      if (finished) {
        animationTimeoutRef.current = setTimeout(() => {
          isShuffling.current = false;
          if (callback) {
            callback();
          }
        }, 100);
      }
    });
  };

  // Calculate card position in circle
  const getCardPositionInCircle = (index, rotation = 0) => {
    const angle = (index / availableCards.length) * 2 * Math.PI + rotation;
    const x = CIRCLE_RADIUS * Math.cos(angle);
    const y = CIRCLE_RADIUS * Math.sin(angle);
    return { x, y };
  };

  // Handle circle pan gesture
  const handleCirclePan = (event) => {
    if (phase !== "selecting") return;

    const deltaX = event.nativeEvent.locationX - lastPanX.current;
    const rotationValue = deltaX * 0.005; // Adjust sensitivity

    circleRotation.setValue(circleRotation._value + rotationValue);
    lastPanX.current = event.nativeEvent.locationX;
  };

  const handleCirclePanStart = (event) => {
    lastPanX.current = event.nativeEvent.locationX;
  };

  const handleCirclePanEnd = () => {
    lastPanX.current = 0;
  };

  // Handle card selection
  const handleCardSelect = (cardIndex) => {
    if (selectedCards.length >= MAX_SELECTIONS) return;

    const actualCardIndex = availableCards[cardIndex];
    const selectionIndex = selectedCards.length;
    const targetPosition = SELECTION_POSITIONS[selectionIndex];

    // Animate selected card to position
    Animated.timing(selectedPositions[selectionIndex], {
      toValue: {
        x: targetPosition.x - width / 2,
        y: targetPosition.y - height / 2,
      },
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Update state
    setSelectedCards([...selectedCards, actualCardIndex]);
    setAvailableCards(availableCards.filter((_, i) => i !== cardIndex));

    // Check if selection is complete
    if (selectedCards.length + 1 >= MAX_SELECTIONS) {
      setTimeout(() => {
        setPhase("done");
      }, 700);
    }
  };

  // Render visible cards in circle (only cards that are on screen)
  const renderCircleCards = () => {
    if (phase !== "selecting") return null;

    return availableCards.map((cardId, index) => {
      const position = getCardPositionInCircle(index, circleRotation._value);
      const screenX = position.x;
      const screenY = position.y;

      // Only render cards that are somewhat visible on screen
      const isVisible =
        screenX > -CIRCLE_RADIUS - CARD_WIDTH &&
        screenX < CIRCLE_RADIUS + CARD_WIDTH &&
        screenY > -CIRCLE_RADIUS - CARD_HEIGHT &&
        screenY < CIRCLE_RADIUS + CARD_HEIGHT;

      if (!isVisible) return null;

      return (
        <TouchableOpacity
          key={`circle-card-${cardId}`}
          style={[
            styles.circleCard,
            {
              transform: [{ translateX: screenX }, { translateY: screenY }],
            },
          ]}
          onPress={() => handleCardSelect(index)}
        >
          <Image
            source={require("../../assets/images/cards/1-resized.png")}
            style={styles.cardImage}
            resizeMode="contain"
          />
          <Text style={styles.cardNumber}>{cardId + 1}</Text>
        </TouchableOpacity>
      );
    });
  };

  // İlk açılışta kartlar alt ortada üst üste
  useEffect(() => {
    gatherToBottom(0);
    setShowDoneButton(false);
    setPhase("shuffling");
    setSelectedCards([]);
    setAvailableCards(Array.from({ length: TOTAL_CARDS }, (_, i) => i));
    return () => {
      if (shuffleTimeoutRef.current) {
        clearTimeout(shuffleTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
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
    if (phase !== "shuffling") return;
    console.log("Touch start");
    isDragging.current = true;

    // İlk dokunuşsa shuffle'ı başlat
    if (isFirstShuffle.current) {
      handleDeckPress();
    }
  };

  // Touch move - parmak hareket ettiğinde
  const handleTouchMove = () => {
    if (phase !== "shuffling") return;
    if (
      !canShuffleOnMove.current ||
      isShuffling.current ||
      !isDragging.current
    ) {
      return;
    }

    // Clear any existing timeouts
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Temporarily disable shuffle on move until this animation completes
    canShuffleOnMove.current = false;

    // Shuffle işlemini başlat
    shuffleOnce(800, () => {
      // Animasyon bittikten sonra, eğer parmak hala hareket ediyorsa
      // kısa bir gecikme ile tekrar shuffle'a izin ver
      if (isDragging.current) {
        shuffleTimeoutRef.current = setTimeout(() => {
          canShuffleOnMove.current = true;
        }, 200);
      } else {
        canShuffleOnMove.current = true;
      }
    });
  };

  // Touch end - parmak ekrandan kalkınca
  const handleTouchEnd = () => {
    if (phase !== "shuffling") return;
    console.log("Touch end");
    isDragging.current = false;
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  };

  // Done butonuna tıklanınca
  const handleDone = () => {
    setShowDoneButton(false);
    canShuffleOnMove.current = false;

    // Önce kartları topla, sonra selection phase'e geç
    gatherToBottom(600);
    setTimeout(() => {
      setPhase("selecting");
    }, 650);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Shuffle" />
      <Text style={styles.title}>{spread?.title}</Text>

      {/* Phase indicator */}
      {phase === "shuffling" && isFirstShuffle.current && (
        <Text style={styles.infoText}>
          Touch the deck and shuffle for merging your energy
        </Text>
      )}
      {phase === "shuffling" && !isFirstShuffle.current && !showDoneButton && (
        <Text style={styles.infoText}>
          Touch and move your finger to shuffle the cards
        </Text>
      )}
      {phase === "selecting" && (
        <Text style={styles.infoText}>
          Pan with finger to rotate circle and select{" "}
          {MAX_SELECTIONS - selectedCards.length} more cards
        </Text>
      )}
      {phase === "done" && (
        <Text style={styles.infoText}>Selection complete!</Text>
      )}

      {/* Shuffling Phase */}
      {phase === "shuffling" && (
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
                    zIndex: CARD_COUNT - i,
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
      )}

      {/* Circle Selection Phase */}
      {phase === "selecting" && (
        <View
          style={styles.circleContainer}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleCirclePanStart}
          onResponderMove={handleCirclePan}
          onResponderRelease={handleCirclePanEnd}
        >
          {renderCircleCards()}
        </View>
      )}

      {/* Selected Cards Display */}
      {selectedCards.map((cardId, index) => (
        <Animated.View
          key={`selected-${cardId}`}
          style={[
            styles.selectedCard,
            {
              transform: selectedPositions[index].getTranslateTransform(),
            },
          ]}
        >
          <Image
            source={require("../../assets/images/cards/1-resized.png")}
            style={styles.selectedCardImage}
            resizeMode="contain"
          />
          <Text style={styles.selectedCardNumber}>{cardId + 1}</Text>
        </Animated.View>
      ))}

      {/* Done Button */}
      {showDoneButton && (
        <View style={styles.doneButtonContainer}>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selection Counter */}
      {phase === "selecting" && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {selectedCards.length} / {MAX_SELECTIONS} selected
          </Text>
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
  circleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleCard: {
    position: "absolute",
    width: CARD_WIDTH * 0.7,
    height: CARD_HEIGHT * 0.7,
  },
  selectedCard: {
    position: "absolute",
    width: CARD_WIDTH * 0.8,
    height: CARD_HEIGHT * 0.8,
    top: height / 2,
    left: width / 2,
  },
  selectedCardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  selectedCardNumber: {
    position: "absolute",
    bottom: 2,
    right: 2,
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  cardNumber: {
    position: "absolute",
    bottom: 2,
    right: 2,
    color: "#fff",
    fontSize: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
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
  counterContainer: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  counterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default ShuffleCard;
