import { px } from "@zos/utils";
import { align } from "@zos/ui";
import { getDeviceInfo } from "@zos/device";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Etiqueta "DESCANSO"
export const LABEL_STYLE = {
  x: 0,
  y: px(30),
  w: DEVICE_WIDTH,
  h: px(40),
  text_size: px(28),
  color: 0x888888,
  text: 'DESCANSO',
  align_h: align.CENTER_H,
};

// Cronómetro (00:00)
export const TIMER_STYLE = {
  x: 0,
  y: px(80), 
  w: DEVICE_WIDTH,
  h: px(120),
  text_size: px(90), 
  color: 0xffffff,
  text: '00:00',
  align_h: align.CENTER_H,
};

// CONFIGURACIÓN DE BOTONES
// Altura común para botones
const BTN_HEIGHT = px(70);
const BTN_WIDTH = DEVICE_WIDTH - px(40);
const GAP = px(20);
// Posición Y base (desde abajo)
const BOTTOM_MARGIN = px(30);

// Botón: Terminar Sesión (El de más abajo)
export const FINISH_BUTTON_STYLE = {
  x: px(20),
  y: DEVICE_HEIGHT - BOTTOM_MARGIN - BTN_HEIGHT, 
  w: BTN_WIDTH,
  h: BTN_HEIGHT,
  text: 'TERMINAR SESIÓN',
  text_size: px(24),
  color: 0xffffff,
  normal_color: 0x333333, // Gris oscuro
  press_color: 0x555555,
  radius: px(20),
};

// Botón: Siguiente Ejercicio (Arriba del terminar)
export const NEXT_BUTTON_STYLE = {
  x: px(20),
  y: DEVICE_HEIGHT - BOTTOM_MARGIN - BTN_HEIGHT - GAP - BTN_HEIGHT,
  w: BTN_WIDTH,
  h: BTN_HEIGHT,
  text: 'SIGUIENTE EJERCICIO',
  text_size: px(24),
  color: 0x000000,
  normal_color: 0x00AAFF, // Azul principal
  press_color: 0x005599,
  radius: px(20),
};