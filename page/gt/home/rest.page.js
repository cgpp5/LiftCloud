import { createWidget, widget, prop, align } from "@zos/ui";
import { push, exit } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";
import { Vibrator, VIBRATOR_SCENE_STRONG_REMINDER } from "@zos/sensor";

const logger = Logger.getLogger("LiftCloud-Rest");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Tiempo objetivo de descanso (en segundos)
const DEFAULT_TARGET_SECONDS = 90; // 1:30

// Estado de la página
let pageState = {
  timerWidget: null,
  timerInterval: null,
  startTime: 0,
  targetSeconds: DEFAULT_TARGET_SECONDS,
  hasAlerted: false,
  vibrator: null
};

Page({
  onInit() {
    logger.log("Pantalla Descanso Iniciada");
    pageState.startTime = Date.now();
    pageState.hasAlerted = false;
    
    // Inicializar vibrador
    try {
      pageState.vibrator = new Vibrator();
    } catch(e) {
      logger.error("Error iniciando vibrador:", e);
    }
    
    // Leer tiempo objetivo de settings si existe
    const savedTarget = localStorage.getItem('rest_target');
    if (savedTarget) {
      pageState.targetSeconds = parseInt(savedTarget) || DEFAULT_TARGET_SECONDS;
    }
  },

  build() {
    // Etiqueta "DESCANSO"
    createWidget(widget.TEXT, {
      x: 0,
      y: px(30),
      w: DEVICE_WIDTH,
      h: px(35),
      text: "DESCANSO",
      text_size: px(20),
      color: 0x888888,
      align_h: align.CENTER_H
    });

    // Cronómetro grande
    pageState.timerWidget = createWidget(widget.TEXT, {
      x: 0,
      y: px(100),
      w: DEVICE_WIDTH,
      h: px(100),
      text: "00:00",
      text_size: px(80),
      color: 0xFFFFFF,
      align_h: align.CENTER_H
    });

    // Botón SIGUIENTE EJERCICIO
    createWidget(widget.BUTTON, {
      x: px(20),
      y: DEVICE_HEIGHT - px(180),
      w: DEVICE_WIDTH - px(40),
      h: px(70),
      text: "SIGUIENTE EJERCICIO",
      text_size: px(22),
      color: 0x000000,
      normal_color: 0x00AAFF,
      press_color: 0x005599,
      radius: px(20),
      click_func: () => {
        goToNextExercise();
      }
    });

    // Botón TERMINAR SESIÓN
    createWidget(widget.BUTTON, {
      x: px(20),
      y: DEVICE_HEIGHT - px(95),
      w: DEVICE_WIDTH - px(40),
      h: px(70),
      text: "TERMINAR SESIÓN",
      text_size: px(22),
      color: 0xFFFFFF,
      normal_color: 0x333333,
      press_color: 0x555555,
      radius: px(20),
      click_func: () => {
        finishSession();
      }
    });

    // Iniciar cronómetro
    startTimer();
  },

  onDestroy() {
    logger.log("Pantalla Descanso Destruida");
    clearTimer();
    if (pageState.vibrator) {
      try {
        pageState.vibrator.stop();
      } catch(e) {}
    }
  }
});

function startTimer() {
  pageState.timerInterval = setInterval(() => {
    tick();
  }, 1000);
}

function tick() {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - pageState.startTime) / 1000);
  
  // Actualizar texto
  if (pageState.timerWidget) {
    pageState.timerWidget.setProperty(prop.TEXT, formatTime(elapsedSeconds));
    
    // Verificar si pasamos el límite
    if (elapsedSeconds > pageState.targetSeconds) {
      // Cambiar a rojo
      pageState.timerWidget.setProperty(prop.COLOR, 0xFF4444);
      
      // Vibrar solo la primera vez
      if (!pageState.hasAlerted) {
        triggerAlert();
        pageState.hasAlerted = true;
      }
    }
  }
}

function triggerAlert() {
  logger.log("Límite de descanso excedido - Vibrando");
  
  if (pageState.vibrator) {
    try {
      pageState.vibrator.setMode(VIBRATOR_SCENE_STRONG_REMINDER);
      pageState.vibrator.start();
      
      // Parar después de 1 segundo
      setTimeout(() => {
        if (pageState.vibrator) {
          pageState.vibrator.stop();
        }
      }, 1000);
    } catch(e) {
      logger.error("Error vibrando:", e);
    }
  }
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function clearTimer() {
  if (pageState.timerInterval) {
    clearInterval(pageState.timerInterval);
    pageState.timerInterval = null;
  }
}

function goToNextExercise() {
  // Guardar tiempo de descanso en el último set
  saveRestTime();
  
  clearTimer();
  
  // Ir a selección de ejercicio
  push({ url: 'page/gt/home/exercise.page' });
}

function finishSession() {
  // Guardar tiempo de descanso
  saveRestTime();
  
  clearTimer();
  
  // Ir al resumen
  push({ url: 'page/gt/home/summary.page' });
}

function saveRestTime() {
  const elapsedSeconds = Math.floor((Date.now() - pageState.startTime) / 1000);
  
  // Actualizar el último set con el tiempo de descanso
  const setsJson = localStorage.getItem('today_sets') || '[]';
  try {
    const sets = JSON.parse(setsJson);
    if (sets.length > 0) {
      sets[sets.length - 1].rest = elapsedSeconds;
      localStorage.setItem('today_sets', JSON.stringify(sets));
    }
  } catch(e) {
    logger.error("Error guardando tiempo de descanso:", e);
  }
}
