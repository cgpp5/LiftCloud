import { px } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Títulos de columnas (KG / REPS)
export const HEADERS_STYLE = {
  x: 0,
  y: px(10),
  w: DEVICE_WIDTH,
  h: px(40),
  text_size: px(24),
  color: 0xAAAAAA,
  align_v: 2, // CENTER_V
};

// Configuración del Picker Doble
export const DETAILS_PICKER_STYLE = {
  x: 0,
  y: px(50),
  w: DEVICE_WIDTH,
  h: px(300), 
  nb_of_columns: 2, // Activamos modo 2 columnas
};

// Configuración de Columna Común (Estilo Fijo)
const COMMON_COL_CONFIG = {
  font_size: px(40),          // TAMAÑO FIJO
  select_font_size: px(40),   // TAMAÑO FIJO (Igual al normal)
  color: 0x666666,            // Color apagado
  select_color: 0x00AAFF,     // Color resaltado (Azul)
  item_height: px(60),
  support_loop: false,        // Sin loop para pesos/reps suele ser mejor (tope arriba/abajo)
};

// Columna 1: Peso
export const WEIGHT_COL_CONFIG = {
  ...COMMON_COL_CONFIG,
  col_width: DEVICE_WIDTH / 2,
};

// Columna 2: Reps
export const REPS_COL_CONFIG = {
  ...COMMON_COL_CONFIG,
  col_width: DEVICE_WIDTH / 2,
  select_color: 0x00FF88,     // Verde para diferenciar visualmente
};

// Botón Atrás (Flecha o "Back")
export const BACK_BUTTON_STYLE = {
  x: px(20),
  y: DEVICE_HEIGHT - px(90),
  w: px(90),
  h: px(70),
  text: '<', // Flecha simple
  text_size: px(40),
  color: 0xffffff,
  normal_color: 0x333333,
  press_color: 0x555555,
  radius: px(16),
};

// Botón Seleccionar (Log)
export const LOG_BUTTON_STYLE = {
  x: px(130), // Al lado del de atrás
  y: DEVICE_HEIGHT - px(90),
  w: DEVICE_WIDTH - px(150), // El resto del ancho
  h: px(70),
  text: 'LOG SET',
  text_size: px(28),
  color: 0x000000,
  normal_color: 0x00AAFF,
  press_color: 0x005599,
  radius: px(16),
};