export function storyWorldBounds(world, THREE) {
  const bounds = new THREE.Box3().setFromObject(world).expandByScalar(.16);
  bounds.max.y += .08;
  return bounds;
}

export function fitOrthographicBounds(bounds, view, { width, height, padding = 20, occupancy = 1 } = {}) {
  if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0 || view?.length !== 16 || !Array.from(view).every(Number.isFinite)) return null;
  if (!bounds?.min || !bounds?.max || !['x', 'y', 'z'].every(key => Number.isFinite(bounds.min[key]) && Number.isFinite(bounds.max[key]) && bounds.min[key] <= bounds.max[key])) return null;
  const margin = Math.max(0, Math.min(Number.isFinite(padding) ? padding : 20, Math.min(width, height) / 2 - 1));
  const fill = Number.isFinite(occupancy) ? Math.max(.1, Math.min(1, occupancy)) : 1;
  let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const px = view[0] * x + view[4] * y + view[8] * z + view[12];
    const py = view[1] * x + view[5] * y + view[9] * z + view[13];
    left = Math.min(left, px); right = Math.max(right, px);
    bottom = Math.min(bottom, py); top = Math.max(top, py);
  }
  if (right <= left || top <= bottom) return null;
  const scale = Math.min((width - margin * 2) / (right - left), (height - margin * 2) / (top - bottom)) * fill;
  const aspect = width / height, halfWidth = Math.max(5.6, 3.65 * aspect), halfHeight = halfWidth / aspect;
  const x = (left + right) / 2, y = (top + bottom) / 2;
  return { left: x - halfWidth, right: x + halfWidth, top: y + halfHeight, bottom: y - halfHeight, zoom: scale * halfHeight * 2 / height };
}


export function compositionProjection({ width, height, zoom, composition } = {}) {
  if (![width, height, zoom].every(Number.isFinite) || width <= 0 || height <= 0 || zoom <= 0) return null;
  const clamp = value => Math.max(0, Math.min(1, value));
  // Match the layout breakpoint: a blended camera can place models behind
  // the proof panel while the DOM is already using its other composition.
  const blend = width > 760 ? 1 : 0;
  const fullDesktop = composition?.desktop ?? { x: .5, y: .5 }, fullMobile = composition?.mobile ?? fullDesktop;
  const number = (value, fallback) => Number.isFinite(value) ? clamp(value) : fallback;
  const tablet=composition?.compactDesktop,desktopT=clamp((width-1100)/340),desktopBlend=desktopT*desktopT*(3-2*desktopT);
  const desktop=tablet?{x:number(tablet.x,number(fullDesktop.x,.5))+(number(fullDesktop.x,.5)-number(tablet.x,number(fullDesktop.x,.5)))*desktopBlend,y:number(tablet.y,number(fullDesktop.y,.5))+(number(fullDesktop.y,.5)-number(tablet.y,number(fullDesktop.y,.5)))*desktopBlend}:fullDesktop;
  const tabletScale=Number.isFinite(tablet?.scale)?Math.max(.5,Math.min(1,tablet.scale)):1;
  const desktopScale=tabletScale+(1-tabletScale)*desktopBlend;
  const heightT=clamp((height-660)/120),heightBlend=heightT*heightT*(3-2*heightT);
  const compact=composition?.compactMobile;
  const mobile=compact?{x:number(compact.x,.5)+(number(fullMobile.x,.5)-number(compact.x,.5))*heightBlend,y:number(compact.y,.5)+(number(fullMobile.y,.5)-number(compact.y,.5))*heightBlend}:fullMobile;
  const x = number(mobile.x, .5) + (number(desktop.x, .5) - number(mobile.x, .5)) * blend;
  const y = number(mobile.y, .5) + (number(desktop.y, .5) - number(mobile.y, .5)) * blend;
  const fullScale = Number.isFinite(composition?.mobileScale) ? Math.max(.5, Math.min(1.5, composition.mobileScale)) : 1;
  const compactScale=Number.isFinite(compact?.scale)?Math.max(.5,Math.min(1.5,compact.scale)):fullScale;
  const mobileScale=compactScale+(fullScale-compactScale)*heightBlend;
  const actualZoom = zoom * (mobileScale + (desktopScale - mobileScale) * blend);
  const aspect = width / height, halfWidth = Math.max(5.6, 3.65 * aspect), halfHeight = halfWidth / aspect;
  const centerX = (.5 - x) * 2 * halfWidth / actualZoom, centerY = (y - .5) * 2 * halfHeight / actualZoom;
  return {left:centerX-halfWidth,right:centerX+halfWidth,top:centerY+halfHeight,bottom:centerY-halfHeight,zoom:actualZoom};
}
