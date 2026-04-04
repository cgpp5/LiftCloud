import { createWidget, widget, prop, align, setStatusBarVisible } from "@zos/ui";
import { push, exit } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";
import { Vibrator, VIBRATOR_SCENE_STRONG_REMINDER } from "@zos/sensor";
import { setKeepScreenOn } from "@zos/display";
import { BasePage } from "@zeppos/zml/base-page";

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

Page(BasePage({
  onInit() {
    logger.log("Pantalla Descanso Iniciada");
    setStatusBarVisible(false);
    setKeepScreenOn(true);
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
      text_size: px(26),
      color: 0x00FF00,
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
      color: 0x00FF00,
      align_h: align.CENTER_H
    });

    // Botón SIGUIENTE EJERCICIO
    createWidget(widget.BUTTON, {
      x: px(30),
      y: DEVICE_HEIGHT - px(195),
      w: DEVICE_WIDTH - px(60),
      h: px(80),
      text: "SIGUIENTE EJERCICIO",
      text_size: px(26),
      color: 0x00FF00,
      normal_color: 0x1A1A1A,
      press_color: 0x151515,
      radius: px(30),
      click_func: () => {
        goToNextExercise();
      }
    });

    // Botón TERMINAR SESIÓN
    createWidget(widget.BUTTON, {
      x: px(30),
      y: DEVICE_HEIGHT - px(95),
      w: DEVICE_WIDTH - px(60),
      h: px(80),
      text: "TERMINAR SESIÓN",
      text_size: px(26),
      color: 0x00FF00,
      normal_color: 0x1A1A1A,
      press_color: 0x151515,
      radius: px(30),
      click_func: () => {
        finishSession();
      }
    });

    // Iniciar cronómetro
    startTimer();
  },

  onDestroy() {
    logger.log("Pantalla Descanso Destruida");
    setKeepScreenOn(false);
    clearTimer();
    if (pageState.vibrator) {
      try {
        pageState.vibrator.stop();
      } catch(e) {}
    }
  }
}));

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
      pageState.timerWidget.setProperty(prop.COLOR, 0xFF0000);
      
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
  logger.log(`saveRestTime llamado - descanso: ${elapsedSeconds}s`);
  
  // Actualizar el último set con el tiempo de descanso
  const setsJson = localStorage.getItem('today_sets') || '[]';
  logger.log(`today_sets raw: ${setsJson.substring(0, 100)}...`);
  
  try {
    const sets = JSON.parse(setsJson);
    logger.log(`Sets parseados: ${sets.length}`);
    
    if (sets.length > 0) {
      const lastSet = sets[sets.length - 1];
      lastSet.rest = elapsedSeconds;
      localStorage.setItem('today_sets', JSON.stringify(sets));
      logger.log(`Último set actualizado: ${lastSet.name}`);
      
      // Sincronizar el set completo con Supabase
      syncSetToCloud(lastSet);
    } else {
      logger.log("No hay sets para actualizar");
    }
  } catch(e) {
    logger.error("Error guardando tiempo de descanso:", e);
  }
}

/**
 * Sincroniza un set completo con Supabase a través del app-side
 * Usa el sistema de mensajería de ZeppOS
 */
function syncSetToCloud(set) {
  logger.log(`>>> syncSetToCloud llamado para: ${set.name}`);
  logger.log(`    Datos: ${set.weight}kg x ${set.reps} (rest: ${set.rest}s)`);
  
  try {
    // Preparar payload para sincronización
    const messagePayload = {
      exercise: set.name,
      weight: set.weight,
      reps: set.reps,
      rest: set.rest || 0,
      localId: set.id,
      timestamp: set.timestamp
    };
    
    logger.log(`    Payload: ${JSON.stringify(messagePayload)}`);
    
    // Leer cola actual
    const pendingJson = localStorage.getItem('pending_sync') || '[]';
    logger.log(`    pending_sync actual: ${pendingJson}`);
    
    let pending = [];
    try {
      pending = JSON.parse(pendingJson);
    } catch(e) {
      logger.log(`    Error parseando pending_sync, reiniciando`);
      pending = [];
    }
    
    // Añadir a la cola
    pending.push(messagePayload);
    localStorage.setItem('pending_sync', JSON.stringify(pending));
    
    logger.log(`    ✓ Set añadido. Cola tiene ${pending.length} pendientes`);
    
    // Verificar que se guardó
    const verify = localStorage.getItem('pending_sync');
    logger.log(`    Verificación: ${verify.substring(0, 50)}...`);
    
  } catch(e) {
    logger.log(`    ✗ Error: ${e}`);
  }
}
