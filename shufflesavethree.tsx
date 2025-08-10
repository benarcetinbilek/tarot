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
const RADIUS = 200;
const CARD_COUNT = 78; // Full tarot deck

const margin = 10;

const ShuffleCard = () => {
  const { id } = useLocalSearchParams();
  const spread = spreads?.find((s) => s.id.toString() === id) || {
    id: 99,
    title: "Not Found",
    cards: "78",
    description: "Not Found",
  };

  const positions = useRef(
    Array(CARD_COUNT)
      .fill(0)
      .map(() => new Animated.ValueXY({ x: 0, y: 0 }))
  ).current;

  // Circle rotation for the wheel
  const circleRotation = useRef(new Animated.Value(0)).current;

  // STATE: animasyon akışı ve buton için
  const [showDoneButton, setShowDoneButton] = useState(false);
  const [isCircleMode, setIsCircleMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState(new Set());

  // Refs for tracking states
  const isShuffling = useRef(false);
  const isFirstShuffle = useRef(true);
  const isDragging = useRef(false);
  const canShuffleOnMove = useRef(false);
  const shuffleTimeoutRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const panStartX = useRef(0);
  const lastRotation = useRef(0);

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
    const circleRadius = 400;
    const centerX = 0;
    const centerY = 300;

    positions.forEach((pos, index) => {
      const angle = (index / positions.length) * 2 * Math.PI;
      const x = centerX + circleRadius * Math.cos(angle);
      const y = centerY + circleRadius * Math.sin(angle) * -1;
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

  // Handle card selection
  const handleCardPress = (cardIndex) => {
    if (!isCircleMode) return;

    const newSelectedCards = new Set(selectedCards);
    if (selectedCards.has(cardIndex)) {
      newSelectedCards.delete(cardIndex);
    } else {
      const maxCards = parseInt(spread.cards);
      if (selectedCards.size < maxCards) {
        newSelectedCards.add(cardIndex);
      }
    }
    setSelectedCards(newSelectedCards);
  };

  // İlk açılışta kartlar alt ortada üst üste
  useEffect(() => {
    gatherToBottom(0);
    setShowDoneButton(false);
    setIsCircleMode(false);
    setSelectedCards(new Set());
    circleRotation.setValue(0);
    lastRotation.current = 0;

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
  const handleTouchStart = (event) => {
    if (isCircleMode) {
      panStartX.current = event.nativeEvent.pageX;
      return;
    }

    console.log("Touch start");
    isDragging.current = true;

    // İlk dokunuşsa shuffle'ı başlat
    if (isFirstShuffle.current) {
      handleDeckPress();
    }
  };

  // Touch move - parmak hareket ettiğinde
  const handleTouchMove = (event) => {
    if (isCircleMode) {
      // Handle circle rotation
      const currentX = event.nativeEvent.pageX;
      const deltaX = currentX - panStartX.current;
      const rotationValue = lastRotation.current + deltaX * 0.01;
      circleRotation.setValue(rotationValue);
      return;
    }

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
  const handleTouchEnd = (event) => {
    if (isCircleMode) {
      // Save the final rotation value
      const currentX = event.nativeEvent.pageX;
      const deltaX = currentX - panStartX.current;
      lastRotation.current = lastRotation.current + deltaX * 0.01;
      return;
    }

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

    // Önce kartları topla, sonra daireye yay
    gatherToBottom(600);
    setTimeout(() => {
      spreadInCircle(800);
      setTimeout(() => {
        setIsCircleMode(true);
      }, 800);
    }, 650);
  };

  // Get info text
  const getInfoText = () => {
    if (isFirstShuffle.current) {
      return "Touch the deck and shuffle for merging your energy";
    }
    if (!isFirstShuffle.current && !showDoneButton && !isCircleMode) {
      return "Touch and move your finger to shuffle the cards";
    }
    if (isCircleMode) {
      const maxCards = parseInt(spread.cards);
      const selectedCount = selectedCards.size;
      return `Drag to rotate the wheel and tap cards to select (${selectedCount}/${maxCards} selected)`;
    }
    return "";
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Shuffle" />
      <Text style={styles.title}>{spread?.title}</Text>

      {getInfoText() && <Text style={styles.infoText}>{getInfoText()}</Text>}

      <View
        style={styles.deckContainer}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
        onResponderTerminate={handleTouchEnd}
      >
        <Animated.View
          style={[
            styles.circleContainer,
            isCircleMode && {
              transform: [
                {
                  rotateZ: circleRotation.interpolate({
                    inputRange: [-100, 100],
                    outputRange: ["-100rad", "100rad"],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.touchableDeck}>
            {positions.map((pos, i) => {
              const isSelected = selectedCards.has(i);

              return (
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
                  {isCircleMode ? (
                    <TouchableOpacity
                      style={[
                        styles.cardTouchable,
                        isSelected && styles.selectedCard,
                      ]}
                      onPress={() => handleCardPress(i)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={require("../../assets/images/cards/1-resized.png")}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                      {isSelected && (
                        <View style={styles.selectionIndicator}>
                          <Text style={styles.selectionText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Image
                      source={require("../../assets/images/cards/1-resized.png")}
                      style={styles.cardImage}
                      resizeMode="contain"
                    />
                  )}
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </View>

      {showDoneButton && (
        <View style={styles.doneButtonContainer}>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCircleMode && selectedCards.size === parseInt(spread.cards) && (
        <View style={styles.doneButtonContainer}>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => {
              console.log("Selected cards:", Array.from(selectedCards));
              // Navigate to next screen or handle selection
            }}
          >
            <Text style={styles.doneButtonText}>Proceed with Selection</Text>
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
  circleContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 300,
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: "#FFD700",
    borderRadius: 8,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  selectionIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FFD700",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
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
  proceedButton: {
    backgroundColor: "#FFD700",
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
