import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  TouchableOpacity,
  View,
} from "react-native";
import { tarotCards } from "../../utils/cards";
import { getTopArcEndpoints } from "../../utils/getTopArcYBounds";

const ANGLE_DELTA = Math.PI / 10;
const RADIUS = 200;
const CARD_WIDTH = 85;
const CARD_HEIGHT = 150;
const START_ANGLE = -Math.PI / 2; // sol orta

const SLOT_MIN_W = 85; // min placeholder genişliği
const SLOT_AR = CARD_HEIGHT / CARD_WIDTH; // en-boy oranı (CARD_HEIGHT / CARD_WIDTH)
const PAD = 16; // container yatay padding
const GAP = 8;

type Props = {
  howManyCountSelected: number;
  setIsTitleShow: (show: boolean) => void;
};

type TarotCard = { id: number; name: string; image: any };
type SelectedCard = {
  key: string;
  slotIdx: number;
  animPos: Animated.ValueXY;
  animScale: Animated.Value;
  animFlip: Animated.Value; // 👈 eklendi
  card: { id: number; name: string; image: any };
};

const CARD_BACK = require("../../assets/images/cards/1-resized.png"); // kart arkası

export const CircleDeck: React.FC<Props> = ({
  howManyCountSelected,
  setIsTitleShow,
}) => {
  // console.log("howManyCountSelected:", howManyCountSelected);
  const { width, height } = Dimensions.get("window");
  const centerX = width / 2 - CARD_WIDTH / 2;
  const bottomY = height - 100;

  const [deckSize, setDeckSize] = useState(9);

  const [isDeckSpread, setIsDeckSpread] = useState(false);
  const [spreadDone, setSpreadDone] = useState(false);

  const topArcAnglesRef = useRef<{ startA: number; endA: number } | null>(null);

  const angleOffset = useRef(new Animated.Value(0)).current;

  const [gridW, setGridW] = useState(0);
  const [gridH, setGridH] = useState(0);

  const n = Number(howManyCountSelected) || 0; // ikisinden hangisi varsa
  // console.log("nnn:", n);
  const { cols, itemW, itemH } = React.useMemo(
    () => computeGrid(n, gridW, gridH),
    [n, gridW, gridH]
  );

  const [selectedCards, setSelectedCards] = useState([]);

  // en üste:
  const gridRef = useRef<View>(null);

  // type SlotRect = {
  //   i: number; // 0..n-1
  //   row: number; // satır index
  //   col: number; // satır içi index
  //   x: number; // absolute X (ekran)
  //   y: number; // absolute Y (ekran)
  //   w: number;
  //   h: number;
  // };

  const angleBase = useRef(
    Array(deckSize)
      .fill(0)
      .map((_, i) => START_ANGLE + (i - Math.floor(deckSize / 2)) * ANGLE_DELTA)
  ).current;

  const scaleValues = useRef(
    Array(deckSize)
      .fill(0)
      .map(() => new Animated.Value(1))
  ).current;

  const positionValues = useRef(
    Array(deckSize)
      .fill(0)
      .map(() => new Animated.ValueXY({ x: centerX, y: bottomY }))
  ).current;

  const [slotRects, setSlotRects] = useState<
    { x: number; y: number; w: number; h: number }[]
  >([]);
  const slotRefs = useRef<(View | null)[]>([]);
  // useEffect(() => {
  //   if (!isDeckSpread) return;

  //   requestAnimationFrame(() => {
  //     const rects: { x: number; y: number; w: number; h: number }[] = [];
  //     let measured = 0;

  //     slotRefs.current.forEach((slot, idx) => {
  //       if (!slot) return;

  //       // 🔴 EKRANA GÖRE + MERKEZ
  //       slot.measureInWindow((winX, winY, w, h) => {
  //         rects[idx] = {
  //           x: winX, // merkez X (window)
  //           y: winY, // merkez Y (window)
  //           w,
  //           h,
  //         };
  //         measured++;
  //         if (measured === slotRefs.current.length) {
  //           setSlotRects(rects);
  //         }
  //       });
  //     });
  //   });
  // }, [isDeckSpread, n, itemW, itemH]);

  const pan = useRef({ x: 0 }).current;
  const currentAngle = useRef(0);
  // useEffect(() => {
  //   console.log("slotRects updated:", slotRects);
  // }, [slotRects]);

  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());

  const rotateDeckByDelta = (dx: number) => {
    const angleChange = (dx / width) * Math.PI * 0.9;

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

  useEffect(() => {
    //first animation
    growCards();
    const { start, end } = getTopArcEndpoints(centerX, bottomY, RADIUS, 180);
    topArcAnglesRef.current = { startA: start.y, endA: end.y };
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
    // Kartları eşit aralıklarla üst 80° yayına yerleştir
    const spreadAnimations = positionValues.map((position, i) => {
      const targetAngle =
        START_ANGLE + (i - Math.floor(deckSize / 2)) * ANGLE_DELTA + angleVal;
      const x = centerX + RADIUS * Math.cos(targetAngle);
      const y = bottomY + RADIUS * Math.sin(targetAngle);

      return Animated.spring(position, {
        toValue: { x, y },
        useNativeDriver: true,
        speed: 10,
        bounciness: 5,
      });
    });

    Animated.stagger(50, spreadAnimations).start(() => {
      setIsDeckSpread(true);
      setIsTitleShow(false);
    });
  };

  function computeGrid(n: number, W: number, H: number) {
    if (!n || W <= 0 || H <= 0) return { cols: 0, itemW: 0, itemH: 0 };
    const availW = Math.max(0, W - PAD * 2);
    const availH = Math.max(0, H - PAD * 2);

    let best = { cols: 1, itemW: 0, itemH: 0 };

    // 1..n tüm kolon olasılıklarını dene, yükseklik sığan en büyük kutuyu seç
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      // önce genişlikten türetilen boyut
      let itemW = (availW - GAP * (cols - 1)) / cols;
      let itemH = itemW * SLOT_AR;
      let totalH = rows * itemH + GAP * (rows - 1);

      if (totalH > availH) {
        // yükseklik sığmıyorsa, yüksekliğe göre küçült
        itemH = (availH - GAP * (rows - 1)) / rows;
        itemW = itemH / SLOT_AR;
        // bu durumda genişliğe sığıyor mu kontrol et
        const totalW = cols * itemW + GAP * (cols - 1);
        if (totalW > availW) continue; // bu kolon sayısı da olmuyor
      }

      if (itemW > best.itemW) best = { cols, itemW, itemH };
    }

    return best;
  }

  const pickRandomCard = (pool: TarotCard[]) =>
    pool[Math.floor(Math.random() * pool.length)];

  const SLOT_PAD = 6; // ufak padding

  const [slots, setSlots] = useState<
    Array<{ key: string; card: TarotCard; flip: Animated.Value } | null>
  >(() => Array(n).fill(null));

  const cardSelected = (_fromX: number, _fromY: number) => {
    const slotIdx = slots.findIndex((s) => s === null);
    if (slotIdx === -1) return;

    const available = tarotCards.filter((c) => !usedIds.has(c.id));
    if (available.length === 0) return;
    const randomCard = pickRandomCard(available);
    console.log("randomcard", randomCard);

    setSelectedCards([...selectedCards, randomCard]);
    const flip = new Animated.Value(0); // 0 = arka, 1 = ön
    const key = `slot-${slotIdx}-${Date.now()}`;

    const next = [...slots];
    next[slotIdx] = { key, card: randomCard, flip };
    setSlots(next);
    setUsedIds((prev) => new Set(prev).add(randomCard.id));

    // arka -> ön çevir
    Animated.timing(flip, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    console.log("selectedcardstate", selectedCards);
  }, [selectedCards]);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#000", overflow: "hidden" }}
      {...panResponder.panHandlers}
      //possible fix add isDeckSpread check for panresponder
    >
      {/*cards animation */}
      {!isDeckSpread
        ? angleBase.map((baseAngle, i) => {
            const angle = baseAngle + angleVal;

            // Yayılma bitene kadar kartlar altta kalacak
            const x = spreadDone ? centerX + RADIUS * Math.cos(angle) : centerX;
            const y = spreadDone ? bottomY + RADIUS * Math.sin(angle) : bottomY;

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
          })
        : angleBase.map((baseAngle, i) => {
            const angle = baseAngle + angleVal;
            const x = centerX + RADIUS * Math.cos(angle);
            const y = bottomY + RADIUS * Math.sin(angle);

            if (i === 0) {
              // console.log("y:", y);
              if (y > topArcAnglesRef.current?.startA) {
                angleBase.push(angleBase[angleBase.length - 1] + ANGLE_DELTA);
                // baştaki kartı çıkar
                angleBase.shift();
              }
              // console.log("angleBase:", angleBase);
            } else if (i === angleBase.length - 1) {
              // console.log("last y:", y);
              if (y > topArcAnglesRef.current?.startA) {
                angleBase.unshift(angleBase[0] - ANGLE_DELTA);
                // sondaki kartı çıkar
                angleBase.pop();
              }
            }

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
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => cardSelected(x, y)}
                >
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
      {/*placeholders */}
      {isDeckSpread && (
        <View
          ref={gridRef}
          style={{ width: "100%", height: "60%" }}
          onLayout={() => {
            if (!gridRef.current) return;
            requestAnimationFrame(() => {
              gridRef.current?.measure((x, y, w, h, pageX, pageY) => {
                setGridW(w);
                setGridH(h);
                // setGridOrigin({ x: pageX, y: pageY });
              });
            });
          }}
        >
          {n > 0 &&
            cols > 0 &&
            itemW > 0 &&
            (() => {
              const rows = Math.ceil(n / cols);

              return (
                <View>
                  {Array.from({ length: rows }).map((_, r, idx) => {
                    const start = r * cols;
                    const count = Math.min(cols, n - start);
                    return (
                      <View
                        key={`row-${r}`}
                        style={{
                          flexDirection: "row",
                          justifyContent: "center", // <-- satırı ortala
                          marginBottom: r !== rows - 1 ? GAP : 0,
                        }}
                      >
                        {Array.from({ length: count }).map((__, k) => {
                          const i = start + k;
                          const placed = slots[i]; // bu slot’a kart kondu mu?

                          // flip interpolations
                          const frontRotateY = placed
                            ? placed.flip.interpolate({
                                inputRange: [0.5, 1],
                                outputRange: ["90deg", "0deg"],
                                extrapolate: "clamp",
                              })
                            : null;

                          const backRotateY = placed
                            ? placed.flip.interpolate({
                                inputRange: [0, 0.5],
                                outputRange: ["0deg", "-90deg"],
                                extrapolate: "clamp",
                              })
                            : null;

                          const frontOpacity = placed
                            ? placed.flip.interpolate({
                                inputRange: [0.49, 0.5],
                                outputRange: [0, 1],
                                extrapolate: "clamp",
                              })
                            : 0;

                          const backOpacity = placed
                            ? placed.flip.interpolate({
                                inputRange: [0, 0.5, 0.51],
                                outputRange: [1, 1, 0],
                                extrapolate: "clamp",
                              })
                            : 0;

                          return (
                            <View
                              ref={(el: View | null) => {
                                slotRefs.current[i] = el;
                              }}
                              collapsable={false}
                              key={`slot-${i}`}
                              style={{
                                width: itemW,
                                height: itemH,
                                borderWidth: 2,
                                borderStyle: "dashed",
                                borderColor: "#aaa",
                                borderRadius: 10,
                                marginRight: k !== count - 1 ? GAP : 0,
                                backgroundColor: "rgba(255,255,255,0.06)",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              {/* Kart konduysa slot içinde flip ile göster */}
                              {placed && (
                                <View
                                  style={{
                                    position: "absolute",
                                    left: SLOT_PAD,
                                    right: SLOT_PAD,
                                    top: SLOT_PAD,
                                    bottom: SLOT_PAD,
                                    borderRadius: 8,
                                  }}
                                >
                                  {/* BACK */}
                                  <Animated.View
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      right: 0,
                                      bottom: 0,
                                      left: 0,
                                      backfaceVisibility: "hidden",
                                      opacity: backOpacity,
                                      transform: [
                                        { perspective: 800 },
                                        { rotateY: backRotateY! },
                                      ],
                                      borderRadius: 8,
                                    }}
                                  >
                                    <Image
                                      source={CARD_BACK}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        resizeMode: "contain",
                                        borderRadius: 8,
                                      }}
                                    />
                                  </Animated.View>

                                  {/* FRONT */}
                                  <Animated.View
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      right: 0,
                                      bottom: 0,
                                      left: 0,
                                      backfaceVisibility: "hidden",
                                      opacity: frontOpacity,
                                      transform: [
                                        { perspective: 800 },
                                        { rotateY: frontRotateY! },
                                      ],
                                      borderRadius: 8,
                                    }}
                                  >
                                    <Image
                                      source={placed.card.image} // ön yüz
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        resizeMode: "contain",
                                        borderRadius: 8,
                                      }}
                                    />
                                  </Animated.View>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              );
            })()}
        </View>
      )}
    </View>
  );
};
