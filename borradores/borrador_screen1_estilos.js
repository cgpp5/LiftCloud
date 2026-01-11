import { px } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Configuración del Widget Picker
export const EXERCISE_PICKER_STYLE = {
  title: 'Ejercicios', // Requerido por la API aunque a veces no se muestra
  x: 0,
  y: px(20),
  w: DEVICE_WIDTH,
  h: px(340), // Altura generosa para mostrar 5 filas
};

// Configuración de la Columna de Datos (Fuentes y Tamaños)
// Esto se pasará a la propiedad 'data_config' del Picker
export const PICKER_COL_CONFIG = {
  font_size: px(22),          // Letra mínima (no seleccionados)
  select_font_size: px(30),   // Letra máxima (seleccionado)
  col_width: DEVICE_WIDTH,    // Ancho total
  item_height: px(65),        // Altura para que quepan ~5 (340/65 ≈ 5.2)
  support_loop: true,         // Scroll infinito
  color: 0x888888,            // Color texto normal
  select_color: 0x00AAFF      // Color texto seleccionado
};

// Botón Inferior
export const SELECT_BUTTON_STYLE = {
  x: px(20),
  y: DEVICE_HEIGHT - px(90),
  w: DEVICE_WIDTH - px(40),
  h: px(70),
  text: 'ELIGE EJERCICIO',
  text_size: px(28),
  color: 0x000000,
  normal_color: 0x00AAFF,
  press_color: 0x005599,
  radius: px(16),
};