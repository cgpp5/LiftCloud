import { createWidget, widget, showToast } from "@zos/ui";
import { BasePage } from "@zeppos/zml/base-page";
import { Vibrator } from "@zos/sensor";
import { log as Logger } from "@zos/utils";

import { 
  HEADERS_STYLE,
  DETAILS_PICKER_STYLE,
  WEIGHT_COL_CONFIG,
  REPS_COL_CONFIG,
  BACK_BUTTON_STYLE,
  LOG_BUTTON_STYLE
} from "./details.page.s.layout.js";

const logger = Logger.getLogger("LiftCloud-Details");
const vibro = new Vibrator();

// Generación de Datos
// 1. Array de Pesos (0kg a 300kg en pasos de 0.25)
const WEIGHT_DATA = [];
const WEIGHT_VALUES = []; // Para guardar el valor numérico real
let defaultWeightIndex = 0;

for (let i = 0; i <= 1200; i++) { // 1200 * 0.25 = 300kg
  const val = i * 0.25;
  WEIGHT_VALUES.push(val);
  
  // Formato visual: "10" o "10.25"
  // Si es entero, no mostramos decimales, o siempre mostramos .00?
  // Para alineación fija, mejor siempre 2 decimales si hay decimales, o usar lógica mixta.
  // El usuario pidió "0.25kg", así que "10.25".
  WEIGHT_DATA.push(val % 1 === 0 ? `${val}` : `${val.toFixed(2)}`);

  if (val === 10) defaultWeightIndex = i; // Guardamos el índice de 10kg
}

// 2. Array de Reps (1 a 100)
const REPS_DATA = [];
let defaultRepsIndex = 9; // 10 reps (index 9)
for (let i = 1; i <= 100; i++) {
  REPS_DATA.push(`${i}`);
}

BasePage({
  state: {
    selectedWeight: 10,
    selectedReps: 10,
    exerciseName: "Unknown" // Debería venir de la pantalla anterior
  },

  onInit(params) {
    logger.log("Pantalla Detalles Iniciada");
    
    // Si pasamos parámetros desde la pantalla 1
    if(params){
        try {
            const data = JSON.parse(params);
            if(data.exercise) this.state.exerciseName = data.exercise;
        } catch(e) {}
    }
  },

  build() {
    // 1. Títulos (Texto estático manual para cada columna)
    // Columna KG
    createWidget(widget.TEXT, {
      ...HEADERS_STYLE,
      w: HEADERS_STYLE.w / 2,
      text: 'KG'
    });
    // Columna REPS
    createWidget(widget.TEXT, {
      ...HEADERS_STYLE,
      x: HEADERS_STYLE.w / 2,
      w: HEADERS_STYLE.w / 2,
      text: 'REPS'
    });

    // 2. Picker Doble
    createWidget(widget.PICKER, {
      ...DETAILS_PICKER_STYLE,
      
      init_col_index: 0, 
      
      data_config: [
        // Columna 1: Peso
        {
          ...WEIGHT_COL_CONFIG,
          data_array: WEIGHT_DATA,
          init_val_index: defaultWeightIndex, // 10kg por defecto
        },
        // Columna 2: Reps
        {
          ...REPS_COL_CONFIG,
          data_array: REPS_DATA,
          init_val_index: defaultRepsIndex, // 10 reps por defecto
        }
      ],
      
      picker_cb: (picker, eventType, columnIndex, itemIndex) => {
        // eventType 1 = Selección finalizada (scroll detenido)
        // eventType 0 = Cambio durante scroll (opcional para vibrar)
        
        if (columnIndex === 0) {
           this.state.selectedWeight = WEIGHT_VALUES[itemIndex];
        } else if (columnIndex === 1) {
           this.state.selectedReps = parseInt(REPS_DATA[itemIndex]);
        }
        
        // Vibración ligera al detenerse
        if(eventType === 1) {
            vibro.stop();
            vibro.start();
        }
      }
    });

    // 3. Botón Atrás
    createWidget(widget.BUTTON, {
      ...BACK_BUTTON_STYLE,
      click_func: () => {
        // Volver a la lista de ejercicios
        this.back(); 
      }
    });

    // 4. Botón Log (Guardar)
    createWidget(widget.BUTTON, {
      ...LOG_BUTTON_STYLE,
      click_func: () => {
        this.confirmLog();
      }
    });
  },

  confirmLog() {
    logger.log(`Guardando: ${this.state.exerciseName} - ${this.state.selectedWeight}kg x ${this.state.selectedReps}`);
    
    vibro.stop();
    vibro.start();
    
    // Aquí iría la lógica de envío al Side Service (copiada de la versión anterior)
    // ... request('LOG_EXERCISE', ...)
    
    showToast({ text: 'Guardado' });
  }
});