import { px } from "@zos/utils";
import { align } from "@zos/ui";
import { getDeviceInfo } from "@zos/device";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// 1. Título Fecha
export const HEADER_STYLE = {
  x: 0,
  y: px(10),
  w: DEVICE_WIDTH,
  h: px(30),
  text_size: px(24), 
  color: 0xAAAAAA,
  text: 'DD/MM/YYYY', 
  align_h: align.CENTER_H,
};

// 2. Botón Nuevo Ejercicio
// Y = Alto - 80 (aprox) -> Botón ocupa 60px altura, queda margen abajo de 20px
export const NEW_BUTTON_STYLE = {
  x: px(20),
  y: DEVICE_HEIGHT - px(80), 
  w: DEVICE_WIDTH - px(40),
  h: px(60),
  text: 'NUEVO EJERCICIO',
  text_size: px(24),
  color: 0x000000,
  normal_color: 0x00AAFF,
  press_color: 0x005599,
  radius: px(30),
};

// 3. Contenedor de Scroll (AJUSTADO)
// Empieza en Y=50
// Botón empieza en Y=(DEVICE_HEIGHT - 80)
// Queremos dejar un hueco de px(20) antes del botón.
// Final del scroll = (DEVICE_HEIGHT - 80) - 20 = DEVICE_HEIGHT - 100
// Altura = (Final) - (Inicio 50) = DEVICE_HEIGHT - 150
export const SCROLL_CONTAINER_STYLE = {
  x: 0,
  y: px(50),
  w: DEVICE_WIDTH,
  h: DEVICE_HEIGHT - px(150), // Deja espacio de seguridad
  scroll_enable: true,
  scroll_direction: 1 
};

// Estilos Modal (Standard)
export const MODAL_OVERLAY_STYLE = {
  x: 0, y: 0, w: DEVICE_WIDTH, h: DEVICE_HEIGHT, color: 0x000000
};
export const MODAL_TEXT_STYLE = {
  x: 0, y: px(120), w: DEVICE_WIDTH, h: px(60), text_size: px(26), color: 0xffffff, text: '¿Eliminar entrada?', align_h: align.CENTER_H
};
export const DELETE_BUTTON_STYLE = {
  x: px(40), y: px(220), w: DEVICE_WIDTH - px(80), h: px(60), text: 'ELIMINAR', color: 0xffffff, normal_color: 0xFF4444, press_color: 0xCC0000, radius: px(20)
};
export const CLOSE_BUTTON_STYLE = {
  x: DEVICE_WIDTH - px(60), y: px(40), w: px(50), h: px(50), text: 'X', text_size: px(30), color: 0x888888, align_h: align.CENTER_H, align_v: align.CENTER_V
};