// topArc.ts

const DEG2RAD = Math.PI / 180;

export type ArcEndpoint = {
  x: number;
  y: number;
  angle: number; // radyan
};

/**
 * Üst yay (top arc) için başlangıç ve bitiş noktalarını döndürür.
 * centerX, centerY: dairenin merkezi (senin düzende centerY = bottomY)
 * radius: yarıçap
 * sweepDeg: yayın toplam derece genişliği (varsayılan 90°)
 */
export function getTopArcEndpoints(
  centerX: number,
  centerY: number,
  radius: number,
  sweepDeg: number = 90
): { start: ArcEndpoint; end: ArcEndpoint } {
  const half = (sweepDeg * DEG2RAD) / 2;
  const mid = -Math.PI / 2; // -90°
  const startAngle = mid - half;
  const endAngle = mid + half;

  const start: ArcEndpoint = {
    x: centerX + radius * Math.cos(startAngle),
    y: centerY + radius * Math.sin(startAngle),
    angle: startAngle,
  };

  const end: ArcEndpoint = {
    x: centerX + radius * Math.cos(endAngle),
    y: centerY + radius * Math.sin(endAngle),
    angle: endAngle,
  };

  return { start, end };
}

/** Sık kullanım için sabit 90° kısayolu */
export function getTop90Endpoints(
  centerX: number,
  centerY: number,
  radius: number
) {
  return getTopArcEndpoints(centerX, centerY, radius, 120);
}
