import { createWidget, widget, align } from "@zos/ui";
import { replace } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";

const logger = Logger.getLogger("LiftCloud");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

Page({
  onInit() {
    logger.log("LiftCloud Index Iniciada");
    
    // Verificar si hay sets del día para decidir qué mostrar
    const setsJson = localStorage.getItem('today_sets') || '[]';
    let sets = [];
    try {
      sets = JSON.parse(setsJson);
    } catch(e) {
      sets = [];
    }
    
    // Si hay sets, podríamos ir directo al resumen (opcional)
    // Por ahora, siempre mostramos la pantalla de inicio
  },

  build() {
    // Logo / Título
    createWidget(widget.TEXT, {
      x: 0,
      y: px(80),
      w: DEVICE_WIDTH,
      h: px(60),
      text: "LiftCloud",
      text_size: px(42),
      color: 0x00AAFF,
      align_h: align.CENTER_H
    });
    
    // Subtítulo
    createWidget(widget.TEXT, {
      x: 0,
      y: px(140),
      w: DEVICE_WIDTH,
      h: px(40),
      text: "Fitness Tracker",
      text_size: px(22),
      color: 0x666666,
      align_h: align.CENTER_H
    });
    
    // Icono decorativo (emoji de pesa)
    createWidget(widget.TEXT, {
      x: 0,
      y: px(190),
      w: DEVICE_WIDTH,
      h: px(80),
      text: "🏋️",
      text_size: px(60),
      align_h: align.CENTER_H
    });

    // Botón NUEVO ENTRENAMIENTO
    createWidget(widget.BUTTON, {
      x: px(20),
      y: DEVICE_HEIGHT - px(170),
      w: DEVICE_WIDTH - px(40),
      h: px(65),
      text: "NUEVO EJERCICIO",
      text_size: px(22),
      color: 0x000000,
      normal_color: 0x00AAFF,
      press_color: 0x005599,
      radius: px(20),
      click_func: () => {
        replace({ url: 'page/gt/home/exercise.page' });
      }
    });
    
    // Botón VER SESIÓN
    createWidget(widget.BUTTON, {
      x: px(20),
      y: DEVICE_HEIGHT - px(90),
      w: DEVICE_WIDTH - px(40),
      h: px(65),
      text: "VER SESIÓN",
      text_size: px(22),
      color: 0xFFFFFF,
      normal_color: 0x333333,
      press_color: 0x555555,
      radius: px(20),
      click_func: () => {
        replace({ url: 'page/gt/home/summary.page' });
      }
    });
  },

  onDestroy() {
    logger.log("LiftCloud Index Destruida");
  }
});