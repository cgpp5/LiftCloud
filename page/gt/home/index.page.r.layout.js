import { px } from "@zos/utils";
import { align } from "@zos/ui";
import { getDeviceInfo } from "@zos/device";

// Obtenemos dimensiones para centrar cosas dinámicamente
export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// 1. Título del ejercicio
export const TITLE_STYLE = {
  x: 0,
  y: px(40), // Un poco más abajo en pantallas redondas
  w: DEVICE_WIDTH,
  h: px(50),
  text_size: px(36),
  color: 0xffffff,
  text: 'Press Banca',
  align_h: align.CENTER_H,
};

// 2. Estilos comunes para los Pickers (Rodillos)
const PICKER_COMMON = {
  y: px(100),
  w: px(180), 
  h: px(250),
  item_count: 3,
  item_height: px(60),
  text_size: px(40),
  support_scroll: true,
};

// Picker Peso (Izquierda) - Ajustamos X para pantalla redonda
export const WEIGHT_PICKER_STYLE = {
  ...PICKER_COMMON,
  x: px(40), // Más adentro
  select_color: 0x00AAFF,
};

// Picker Repeticiones (Derecha)
export const REPS_PICKER_STYLE = {
  ...PICKER_COMMON,
  x: DEVICE_WIDTH - px(220), // Ajustado desde la derecha
  select_color: 0x00FF88,
};

// 3. Botón Guardar
export const SAVE_BUTTON_STYLE = {
  x: (DEVICE_WIDTH - 240) / 2, // Centrado
  y: DEVICE_HEIGHT - px(120), 
  w: 240,
  h: px(70),
  text: 'LOG SET',
  text_size: px(32),
  color: 0x000000,
  normal_color: 0x00AAFF,
  press_color: 0x005599,
  radius: px(35),
};