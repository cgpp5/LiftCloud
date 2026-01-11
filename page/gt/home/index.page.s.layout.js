import { px } from "@zos/utils";
import { align, text_style } from "@zos/ui";
import { getDeviceInfo } from "@zos/device";

// Obtenemos dimensiones para centrar cosas dinámicamente
export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// 1. Título del ejercicio
export const TITLE_STYLE = {
  x: 0,
  y: px(20),
  w: DEVICE_WIDTH,
  h: px(50),
  text_size: px(36), // Texto grande
  color: 0xffffff,
  text: 'Press Banca',
  align_h: align.CENTER_H,
};

// 2. Estilos comunes para los Pickers (Rodillos)
const PICKER_COMMON = {
  y: px(80),
  w: px(180), // Ancho de cada columna
  h: px(250),
  item_count: 3,
  item_height: px(60),
  text_size: px(40),
  support_scroll: true, // Importante para Zepp OS 3/4
};

// Picker Peso (Izquierda)
export const WEIGHT_PICKER_STYLE = {
  ...PICKER_COMMON,
  x: px(20),
  select_color: 0x00AAFF, // Azul
};

// Picker Repeticiones (Derecha)
export const REPS_PICKER_STYLE = {
  ...PICKER_COMMON,
  x: px(240), // Desplazado a la derecha
  select_color: 0x00FF88, // Verde
};

// 3. Botón Guardar
export const SAVE_BUTTON_STYLE = {
  x: px(40),
  y: DEVICE_HEIGHT - px(100), // Pegado abajo
  w: DEVICE_WIDTH - px(80),
  h: px(70),
  text: 'LOG SET',
  text_size: px(32),
  color: 0x000000,
  normal_color: 0x00AAFF,
  press_color: 0x005599,
  radius: px(35),
};