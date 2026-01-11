import { createWidget, widget, showToast } from "@zos/ui";
import { BasePage } from "@zeppos/zml/base-page";
import { Vibrator } from "@zos/sensor";
import { log as Logger } from "@zos/utils";

import { 
  EXERCISE_PICKER_STYLE, 
  PICKER_COL_CONFIG,
  SELECT_BUTTON_STYLE 
} from "./index.page.s.layout.js";

const logger = Logger.getLogger("LiftCloud");
const vibro = new Vibrator();

// 1. Datos Crudos (Nombres largos para probar)
const RAW_EXERCISES = [
  "Press Banca",
  "Sentadilla",
  "Peso Muerto",
  "Antebrazos General",
  "Antebrazos Elevación Posterior", // Caso extremo (>25 chars)
  "Extensiones Tríceps Polea Alta", // Caso extremo
  "Curl de Bíceps con Barra",
  "Press Militar Sentado",
  "Dominadas Lastradas"
];

// 2. Función de Graceful Overflow
// Corta el texto si pasa de 25 caracteres y añade "..."
function truncateText(text, limit = 25) {
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + "...";
}

// Pre-procesamos los datos para el Picker
const PROCESSED_DATA = RAW_EXERCISES.map(ex => truncateText(ex));

BasePage({
  state: {
    selectedIndex: 0,
    // Mapeamos el índice del Picker al nombre real completo (sin cortar)
    fullExerciseNames: RAW_EXERCISES 
  },

  onInit() {
    logger.log("Pantalla Picker Iniciada");
  },

  build() {
    // 1. Crear el PICKER
    // Nota: El Picker usa 'data_config' para definir sus columnas
    createWidget(widget.PICKER, {
      ...EXERCISE_PICKER_STYLE,
      
      // Definición de columnas (Solo 1 columna para ejercicios)
      nb_of_columns: 1,
      init_col_index: 0, // Empezar en la columna 0
      
      data_config: [
        {
          ...PICKER_COL_CONFIG,
          data_array: PROCESSED_DATA, // Usamos los textos truncados
          init_val_index: 0 // Empezar en el primer elemento
        }
      ],
      
      // Callback cada vez que el rodillo se detiene en un item
      picker_cb: (picker, eventType, columnIndex, itemIndex) => {
        // eventType 1 suele ser cambio de selección final
        this.state.selectedIndex = itemIndex;
        
        // Feedback háptico ligero al cambiar
        vibro.stop();
        vibro.start();
      }
    });

    // 2. Botón Seleccionar
    createWidget(widget.BUTTON, {
      ...SELECT_BUTTON_STYLE,
      click_func: () => {
        this.confirmSelection();
      }
    });
  },

  confirmSelection() {
    // Recuperamos el nombre COMPLETO original, no el truncado
    const selectedFullUniqueName = this.state.fullExerciseNames[this.state.selectedIndex];
    
    logger.log(`Seleccionado: ${selectedFullUniqueName}`);
    
    // Feedback visual
    showToast({ text: truncateText(selectedFullUniqueName, 15) }); // Toast corto
    
    // TODO: Navegar a pantalla de detalles
  }
});