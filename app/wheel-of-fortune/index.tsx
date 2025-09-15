// app/.../WheelOfFortuneScreen.tsx
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import Header from "../../components/header/Header";

type Sector = { color: string; label: string };

const SECTORS: Sector[] = [
  { color: "#E5243B", label: "Carlos" },
  { color: "#DDA63A", label: "Boru" },
  { color: "#07ffeaff", label: "Rosicler" },
  { color: "#FF3A21", label: "Moraima" },
  { color: "#FCC30B", label: "Yamel" },
  { color: "#6a00ffff", label: "Javier" },
  { color: "#DD1367", label: "Alejandro" },
  { color: "#000000ff", label: "Lissette" },
];

const WHEEL_SIZE = 300;
const R = WHEEL_SIZE / 2;
const TAU = Math.PI * 2;

// Yazı yerleşimi parametreleri
const rStart = 0.32 * R; // metnin merkezden başlama yarıçapı
const outerPad = 12; // dış kenar payı
const MAX_FS = 16; // max font
const MIN_FS = 10; // min font

const OUTER_MARGIN = 5;
const COLOR_OFFSET = -2;

export default function WheelOfFortuneScreen() {
  const angleRef = useRef(0); // radians
  const velRef = useRef(0); // angular velocity
  const rotationDeg = useRef(new Animated.Value(0)).current;
  const rafRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const arcRad = TAU / SECTORS.length; // dilim açısı (radyan)

  const rotateDeg = rotationDeg.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });

  const segments = useMemo(() => {
    const polar = (cx: number, cy: number, r: number, aRad: number) => ({
      x: cx + r * Math.cos(aRad - Math.PI / 2),
      y: cy + r * Math.sin(aRad - Math.PI / 2),
    });

    return SECTORS.map((s, i) => {
      const start = arcRad * i;
      const end = start + arcRad;

      const p1 = polar(R, R, R, start);
      const p2 = polar(R, R, R, end);
      const largeArc = end - start <= Math.PI ? 0 : 1;

      const d = [
        `M ${R} ${R}`,
        `L ${p1.x} ${p1.y}`,
        `A ${R} ${R} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
        "Z",
      ].join(" ");

      const mid = start + arcRad / 2; // orta açı (radyan)
      const midDeg = (mid * 180) / Math.PI; // SVG rotate için derece

      // Yazı yüksekliği, dilim genişliğini (r * arcRad) aşmasın:
      // En dar yer rStart olduğu için onu baz alıyoruz.
      const band = rStart * arcRad; // dik doğrultudaki kullanılabilir kalınlık
      const fsByBand = band * 0.9; // biraz boşluk
      // Ayrıca dışa doğru uzunluk kısıtı:
      const usableLen = R - outerPad - rStart; // merkezden dışa
      const fsByLen = usableLen / Math.max(1, s.label.length * 0.6);
      const fontSize = Math.max(
        MIN_FS,
        Math.min(MAX_FS, Math.min(fsByBand, fsByLen))
      );

      return { ...s, d, midDeg, fontSize };
    });
  }, [arcRad]);

  console.log("segments", segments);

  const computeIndex = (ang: number) =>
    Math.floor(SECTORS.length - (ang / TAU) * SECTORS.length) % SECTORS.length;

  useEffect(() => {
    const friction = 0.991;

    const frame = () => {
      let v = velRef.current;
      if (v) {
        v *= friction;
        if (v < 0.002) v = 0;
        velRef.current = v;

        angleRef.current = (angleRef.current + v) % TAU;

        // tepe oka göre -90°
        const deg = ((angleRef.current - Math.PI / 2) * 180) / Math.PI;
        rotationDeg.setValue(deg);

        const idx = computeIndex(angleRef.current);
        setCurrentIndex((prev) => (prev === idx ? prev : idx));
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rotationDeg]);

  const spin = () => {
    if (!velRef.current) velRef.current = Math.random() * (0.45 - 0.25) + 0.25;
  };

  const active = SECTORS[currentIndex];

  return (
    <>
      <Stack.Screen options={{ headerShown: false, headerTitle: "" }} />
      <Header
        showBackButton
        showLogo={false}
        showDeckAssetDrawer={false}
        showSettings={false}
        title="Wheel of Fortune"
      />

      <View style={styles.screen}>
        <View style={{ width: WHEEL_SIZE, alignItems: "center" }}>
          {/* sabit ok */}
          <View
            style={[
              styles.pointer,
              { borderBottomColor: active?.color ?? "#ffb300" },
            ]}
          />
          {/* tekerlek */}
          <Animated.View style={{ transform: [{ rotate: rotateDeg }] }}>
            <Svg
              width={WHEEL_SIZE}
              height={WHEEL_SIZE}
              viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            >
              {/* dış halka */}
              <G>
                <Path
                  d={circlePath(R, R, R)}
                  fill="#ffcc33"
                  stroke="#b8860b"
                  strokeWidth={6}
                />
                <Path
                  d={circlePath(R, R, R - 8)}
                  fill="#fff5d6"
                  stroke="#e0a106"
                  strokeWidth={2}
                />
              </G>

              {/* dilimler */}
              {segments.map((seg, i) => {
                const N = segments.length;
                const j = (i + COLOR_OFFSET + N) % N; // wrap-around, negatif güvenli
                return (
                  <Path key={`seg-${i}`} d={seg.d} fill={segments[j].color} />
                );
              })}

              {/* METİNLER: merkezden dışa doğru, orta açıya hizalı */}
              {/* METİNLER: son harf dış kenarda */}
              {segments.map((seg, i) => (
                // merkeze taşı → dilimin orta açısına döndür
                <G
                  key={`txtg-${i}`}
                  transform={`translate(${R},${R}) rotate(${seg.midDeg})`}
                >
                  <SvgText
                    // x: dış yarıçap eksi küçük pay -> son harf burada
                    x={R - OUTER_MARGIN}
                    y={0}
                    textAnchor="end" // metnin bitiş noktası x'te olsun
                    alignmentBaseline="middle"
                    fontSize={seg.fontSize}
                    fontWeight="700"
                    fill="#fff"
                  >
                    {seg.label}
                  </SvgText>
                </G>
              ))}

              {/* merkez düğme görünümü */}
              <G>
                <Path
                  d={circlePath(R, R, 24)}
                  fill="#ffbf00"
                  stroke="#ff9f00"
                  strokeWidth={3}
                />
                <Path d={circlePath(R, R, 10)} fill="#fff2c2" />
              </G>
            </Svg>
          </Animated.View>

          {/* merkez SPIN butonu */}
          <Pressable onPress={spin} style={styles.spinWrap}>
            <View
              style={[
                styles.spinOuter,
                { borderColor: active?.color ?? "#7c4dff" },
              ]}
            >
              <View
                style={[
                  styles.spinInner,
                  { backgroundColor: active?.color ?? "#7c4dff" },
                ]}
              >
                <Text style={styles.spinText}>
                  {velRef.current ? active?.label : "SPIN"}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </>
  );
}

/* helpers */
function circlePath(cx: number, cy: number, r: number) {
  return `M ${cx - r}, ${cy}
          a ${r},${r} 0 1,0 ${r * 2},0
          a ${r},${r} 0 1,0 -${r * 2},0`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f0ff",
    alignItems: "center",
    paddingTop: 24,
  },
  pointer: {
    position: "absolute",
    top: -6,
    zIndex: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  spinWrap: {
    position: "absolute",
    top: R - (WHEEL_SIZE * 0.3) / 2,
    left: R - (WHEEL_SIZE * 0.3) / 2,
    width: WHEEL_SIZE * 0.3,
    height: WHEEL_SIZE * 0.3,
  },
  spinOuter: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    backgroundColor: "transparent",
  },
  spinInner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  spinText: { color: "#fff", fontWeight: "800", letterSpacing: 0.5 },
});
