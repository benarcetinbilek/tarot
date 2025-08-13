import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  TouchableOpacity,
  View,
} from "react-native";
// import {tarotCards} from "../../utils/cards";
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
  console.log("nnn:", n);
  const { cols, itemW, itemH } = React.useMemo(
    () => computeGrid(n, gridW, gridH),
    [n, gridW, gridH]
  );

  const [selectedCards, setSelectedCards] = useState([]);

  // en üste:
  const gridRef = useRef<View>(null);
  const [gridOrigin, setGridOrigin] = useState({ x: 0, y: 0 });

  type SlotRect = {
    x: number;
    y: number;
    w: number;
    h: number;
    cx: number;
    cy: number;
  };
  const [slotRects, setSlotRects] = useState<SlotRect[]>([]);

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

  const pan = useRef({ x: 0 }).current;
  const currentAngle = useRef(0);

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
    console.log("yStart:", start, "yEnd:", end);
    topArcAnglesRef.current = { startA: start.y, endA: end.y };
    console.log("topArcAnglesRef:", topArcAnglesRef.current);
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

  // SLOT RECT'LERİNİ STATE'E YAZ
  useEffect(() => {
    if (n <= 0 || cols <= 0 || itemW <= 0 || gridW <= 0 || gridH <= 0) {
      setSlotRects([]);
      return;
    }

    const arr: SlotRect[] = [];
    const availW = Math.max(0, gridW - PAD * 2);
    const rows = Math.ceil(n / cols);

    for (let r = 0; r < rows; r++) {
      const start = r * cols;
      const count = Math.min(cols, n - start);
      const rowWidth = count * itemW + (count - 1) * GAP;
      const startXLocal = PAD + (availW - rowWidth) / 2;

      for (let k = 0; k < count; k++) {
        const xLocal = startXLocal + k * (itemW + GAP);
        const yLocal = PAD + r * (itemH + GAP);

        const x = gridOrigin.x + xLocal; // ekran göre top-left
        const y = gridOrigin.y + yLocal;

        arr.push({
          x,
          y,
          w: itemW,
          h: itemH,
          cx: x + itemW / 2,
          cy: y + itemH / 2,
        });
      }
    }

    setSlotRects(arr);
    setTimeout(() => {
      console.log("slotRects:", arr);
    }, 1000);
  }, [n, cols, itemW, itemH, gridW, gridH, gridOrigin.x, gridOrigin.y]);

  const pickRandomCard = (pool: TarotCard[]) =>
    pool[Math.floor(Math.random() * pool.length)];

  const cardSelected = (fromX: number, fromY: number) => {
    const slotIdx = selectedCards.length;
    const rect = slotRects[slotIdx];
    if (!rect) return;

    const available = tarotCards.filter((c) => !usedIds.has(c.id));
    if (available.length === 0) return;
    const randomCard = pickRandomCard(available);

    const animPos = new Animated.ValueXY({ x: fromX, y: fromY });
    const targetScale = rect.w / CARD_WIDTH; // oranı yine slot genişliğinden alıyoruz
    const animScale = new Animated.Value(1);
    const animFlip = new Animated.Value(0);
    const key = `sel-${Date.now()}-${slotIdx}`;

    setSelectedCards((prev) => [
      ...prev,
      { key, animPos, animScale, animFlip, slotIdx, card: randomCard },
    ]);
    setUsedIds((prev) => new Set(prev).add(randomCard.id));

    // DİKKAT: Artık merkeze gidiyoruz (yarım boy çıkarmıyoruz)
    const toX = rect.cx;
    const toY = rect.cy;

    Animated.parallel([
      Animated.spring(animPos, {
        toValue: { x: toX, y: toY },
        useNativeDriver: true,
        speed: 12,
        bounciness: 6,
      }),
      Animated.timing(animScale, {
        toValue: targetScale,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(animFlip, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#000", overflow: "hidden" }}
      {...panResponder.panHandlers}
      //possible fix add isDeckSpread check for panresponder
    >
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
                setGridOrigin({ x: pageX, y: pageY });
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
                <View style={{ padding: PAD }}>
                  {Array.from({ length: rows }).map((_, r) => {
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
                          return (
                            <View
                              key={`slot-${i}`}
                              style={{
                                width: itemW,
                                height: itemH,
                                borderWidth: 2,
                                borderStyle: "dashed",
                                borderColor: "#aaa",
                                borderRadius: 10,
                                marginRight: k !== count - 1 ? GAP : 0, // satır içi boşluk
                                backgroundColor: "rgba(255,255,255,0.06)",
                              }}
                            />
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
      {isDeckSpread &&
        selectedCards.map((c) => {
          const frontRotateY = c.animFlip.interpolate({
            inputRange: [0, 0.5],
            outputRange: ["0deg", "90deg"],
            extrapolate: "clamp",
          });
          const backRotateY = c.animFlip.interpolate({
            inputRange: [0.5, 1],
            outputRange: ["-90deg", "0deg"],
            extrapolate: "clamp",
          });
          const frontOpacity = c.animFlip.interpolate({
            inputRange: [0, 0.49, 0.5],
            outputRange: [1, 1, 0],
            extrapolate: "clamp",
          });
          const backOpacity = c.animFlip.interpolate({
            inputRange: [0.5, 0.51, 1],
            outputRange: [0, 1, 1],
            extrapolate: "clamp",
          });

          // Ölçekli yarım boy kadar geri itme
          const halfW = Animated.multiply(c.animScale, CARD_WIDTH / 2);
          const halfH = Animated.multiply(c.animScale, CARD_HEIGHT / 2);

          return (
            <Animated.View
              key={c.key}
              pointerEvents="none"
              style={{
                position: "absolute",
                transform: [
                  { translateX: c.animPos.x }, // slot merkezine gidecek
                  { translateY: c.animPos.y },
                ],
              }}
            >
              {/* İç katman: önce scale, sonra -half translate (ölçekli kompanzasyon) */}
              <Animated.View
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: [
                    { scale: c.animScale },
                    { translateX: Animated.multiply(halfW, -1) },
                    { translateY: Animated.multiply(halfH, -1) },
                  ],
                }}
              >
                {/* FRONT */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    backfaceVisibility: "hidden",
                    transform: [
                      { perspective: 800 },
                      { rotateY: frontRotateY },
                    ],
                    opacity: frontOpacity,
                  }}
                >
                  <Image
                    source={c.card.image}
                    style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                  />
                </Animated.View>

                {/* BACK */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    backfaceVisibility: "hidden",
                    transform: [{ perspective: 800 }, { rotateY: backRotateY }],
                    opacity: backOpacity,
                  }}
                >
                  <Image
                    source={CARD_BACK}
                    style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                  />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          );
        })}
    </View>
  );
};
