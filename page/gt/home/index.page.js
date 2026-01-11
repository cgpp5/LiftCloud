import { createWidget, widget, prop, showToast } from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";

const logger = Logger.getLogger("LiftCloud");

// Datos de peso y repeticiones
const WEIGHTS = [];
for (let i = 0; i <= 200; i += 2.5) {
  WEIGHTS.push(i);
}

const REPS = [];
for (let i = 1; i <= 50; i++) {
  REPS.push(i);
}

// Estado global de la página
let pageState = {
  weightIndex: 24,  // 60kg por defecto
  repsIndex: 9,     // 10 reps por defecto
  isSaving: false,
  weightText: null,
  repsText: null
};

// Funciones de ajuste
function adjustWeight(delta) {
  const newIndex = pageState.weightIndex + delta;
  if (newIndex >= 0 && newIndex < WEIGHTS.length) {
    pageState.weightIndex = newIndex;
    pageState.weightText.setProperty(prop.TEXT, `${WEIGHTS[newIndex]} kg`);
  }
}

function adjustReps(delta) {
  const newIndex = pageState.repsIndex + delta;
  if (newIndex >= 0 && newIndex < REPS.length) {
    pageState.repsIndex = newIndex;
    pageState.repsText.setProperty(prop.TEXT, `${REPS[newIndex]}`);
  }
}

function saveLog() {
  if (pageState.isSaving) return;

  const weight = WEIGHTS[pageState.weightIndex];
  const reps = REPS[pageState.repsIndex];
  
  logger.log(`Guardando: ${weight}kg x ${reps}`);
  pageState.isSaving = true;
  showToast({ content: `Guardado: ${weight}kg x ${reps}` });
  
  // Por ahora solo mostramos el toast, la conexión con app-side se agregará después
  setTimeout(() => {
    pageState.isSaving = false;
  }, 1000);
}

Page({
  onInit() {
    logger.log("LiftCloud Page Iniciada");
  },

  build() {
    const { width, height } = getDeviceInfo();
    logger.log(`Screen: ${width}x${height}`);

    // 1. Título
    createWidget(widget.TEXT, {
      x: 0,
      y: 20,
      w: width,
      h: 40,
      text: "Press Banca",
      text_size: 28,
      color: 0xFFFFFF,
      align_h: 1 // CENTER
    });

    // 2. Etiqueta PESO
    createWidget(widget.TEXT, {
      x: 20,
      y: 75,
      w: 80,
      h: 30,
      text: "PESO",
      text_size: 18,
      color: 0x888888
    });

    // 3. Valor del peso (editable con botones)
    pageState.weightText = createWidget(widget.TEXT, {
      x: 20,
      y: 105,
      w: 140,
      h: 50,
      text: `${WEIGHTS[pageState.weightIndex]} kg`,
      text_size: 32,
      color: 0x00AAFF
    });

    // Botones - / + para peso
    createWidget(widget.BUTTON, {
      x: 20,
      y: 160,
      w: 60,
      h: 45,
      text: "-",
      text_size: 28,
      normal_color: 0x333333,
      press_color: 0x555555,
      radius: 8,
      click_func: () => adjustWeight(-1)
    });

    createWidget(widget.BUTTON, {
      x: 95,
      y: 160,
      w: 60,
      h: 45,
      text: "+",
      text_size: 28,
      normal_color: 0x333333,
      press_color: 0x555555,
      radius: 8,
      click_func: () => adjustWeight(1)
    });

    // 4. Etiqueta REPS
    createWidget(widget.TEXT, {
      x: width - 100,
      y: 75,
      w: 80,
      h: 30,
      text: "REPS",
      text_size: 18,
      color: 0x888888
    });

    // 5. Valor de reps
    pageState.repsText = createWidget(widget.TEXT, {
      x: width - 160,
      y: 105,
      w: 140,
      h: 50,
      text: `${REPS[pageState.repsIndex]}`,
      text_size: 32,
      color: 0x00FF88,
      align_h: 2 // RIGHT
    });

    // Botones - / + para reps
    createWidget(widget.BUTTON, {
      x: width - 155,
      y: 160,
      w: 60,
      h: 45,
      text: "-",
      text_size: 28,
      normal_color: 0x333333,
      press_color: 0x555555,
      radius: 8,
      click_func: () => adjustReps(-1)
    });

    createWidget(widget.BUTTON, {
      x: width - 80,
      y: 160,
      w: 60,
      h: 45,
      text: "+",
      text_size: 28,
      normal_color: 0x333333,
      press_color: 0x555555,
      radius: 8,
      click_func: () => adjustReps(1)
    });

    // 6. Botón LOG SET (grande, abajo)
    createWidget(widget.BUTTON, {
      x: 30,
      y: height - 90,
      w: width - 60,
      h: 60,
      text: "LOG SET",
      text_size: 26,
      color: 0x000000,
      normal_color: 0x00AAFF,
      press_color: 0x0077CC,
      radius: 30,
      click_func: () => saveLog()
    });
  },

  onDestroy() {
    logger.log("LiftCloud Page Destruida");
  }
});