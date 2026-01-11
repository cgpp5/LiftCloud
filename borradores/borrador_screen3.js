import { createWidget, widget, push, destroy } from "@zos/router"; 
import { Vibrator } from "@zos/sensor";
import * as hmUI from "@zos/ui"; 
import { log as Logger } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";

import { 
  LABEL_STYLE,
  TIMER_STYLE,
  NEXT_BUTTON_STYLE,
  FINISH_BUTTON_STYLE 
} from "./rest.page.s.layout.js";

const logger = Logger.getLogger("LiftCloud-Rest");
const vibro = new Vibrator();

// Configuración de tiempo objetivo (90 segundos = 1m 30s)
// TODO: En el futuro leer esto de settings/localStorage
const DEFAULT_TARGET_SECONDS = 90; 

BasePage({
  state: {
    timerWidget: null,
    timerInterval: null,
    startTime: 0,
    targetSeconds: DEFAULT_TARGET_SECONDS,
    hasAlerted: false // Para que vibre solo una vez al cruzar el límite
  },

  onInit(params) {
    logger.log("Cronómetro Iniciado");
    this.state.startTime = Date.now();
    
    // Si pasamos un tiempo específico por parámetro, lo usamos
    if (params) {
        try {
            const data = JSON.parse(params);
            if(data.restTime) this.state.targetSeconds = data.restTime;
        } catch(e) {}
    }
  },

  build() {
    // 1. Etiqueta
    hmUI.createWidget(hmUI.widget.TEXT, LABEL_STYLE);

    // 2. Cronómetro
    this.state.timerWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      ...TIMER_STYLE,
      text: "00:00"
    });

    // 3. Botones
    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...NEXT_BUTTON_STYLE,
      click_func: () => { this.goToNextExercise(); }
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...FINISH_BUTTON_STYLE,
      click_func: () => { this.finishSession(); }
    });

    // Iniciar bucle
    this.startTimer();
  },

  startTimer() {
    this.state.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  },

  tick() {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.state.startTime) / 1000);

    // Actualizar Texto
    if (this.state.timerWidget) {
      this.state.timerWidget.setProperty(hmUI.prop.TEXT, this.formatTime(elapsedSeconds));
      
      // LÓGICA DE ALERTA Y COLOR
      if (elapsedSeconds > this.state.targetSeconds) {
        // 1. Cambiar color a ROJO
        this.state.timerWidget.setProperty(hmUI.prop.COLOR, 0xFF4444);
        
        // 2. Vibrar (Solo la primera vez que cruzamos el límite)
        if (!this.state.hasAlerted) {
            this.triggerAlert();
            this.state.hasAlerted = true;
        }
      } else {
        // Mantener color BLANCO mientras estemos en tiempo
        // (Esto es por si acaso se reiniciara el estado visual)
        this.state.timerWidget.setProperty(hmUI.prop.COLOR, 0xFFFFFF);
      }
    }
  },
  
  triggerAlert() {
    logger.log("Límite de descanso excedido - Vibrando");
    vibro.stop();
    // Vibración doble fuerte para que se note en el gimnasio
    vibro.start();
    setTimeout(() => {
        vibro.stop();
        setTimeout(() => vibro.start(), 300);
    }, 500);
  },

  formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  goToNextExercise() {
    this.clearTimer();
    push({ url: 'page/gt/home/index.page', params: {} });
  },

  finishSession() {
    this.clearTimer();
    vibro.stop();
    vibro.start();
    destroy(); 
  },

  clearTimer() {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
  },

  onDestroy() {
    this.clearTimer();
  }
});