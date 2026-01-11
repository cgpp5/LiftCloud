import { createWidget, widget, prop, align } from "@zos/ui";
import { push, back } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";

const logger = Logger.getLogger("LiftCloud-Details");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Generación de datos de peso (0 a 200kg en pasos de 2.5 para menos items)
const WEIGHT_VALUES = [];
const WEIGHT_DATA = [];
for (let i = 0; i <= 80; i++) {
  const val = i * 2.5;
  WEIGHT_VALUES.push(val);
  WEIGHT_DATA.push({ value: val, label: val % 1 === 0 ? `${val}` : val.toFixed(1) });
}

// Generación de datos de repeticiones (1 a 50)
const REPS_VALUES = [];
const REPS_DATA = [];
for (let i = 1; i <= 50; i++) {
  REPS_VALUES.push(i);
  REPS_DATA.push({ value: i, label: `${i}` });
}

// Estado de la página
let pageState = {
  weightIndex: 24,  // 60kg por defecto (24 * 2.5 = 60)
  repsIndex: 9,     // 10 reps por defecto
  exerciseName: "Ejercicio",
  editMode: false,
  editId: null
};

const COL_WIDTH = DEVICE_WIDTH / 2;
const LIST_HEIGHT = DEVICE_HEIGHT - px(130);

Page({
  onInit() {
    logger.log("Pantalla Detalles Iniciada");
    
    // Recuperar datos de localStorage
    const exercise = localStorage.getItem('current_exercise');
    if (exercise) {
      pageState.exerciseName = exercise;
    }
    
    const editMode = localStorage.getItem('edit_mode');
    pageState.editMode = editMode === 'true';
    
    const editId = localStorage.getItem('edit_id');
    if (editId) {
      pageState.editId = parseInt(editId);
      
      // Recuperar valores guardados si estamos editando
      const savedWeight = localStorage.getItem('edit_weight');
      const savedReps = localStorage.getItem('edit_reps');
      if (savedWeight) {
        const wVal = parseFloat(savedWeight);
        // Buscar el índice más cercano
        for (let i = 0; i < WEIGHT_VALUES.length; i++) {
          if (WEIGHT_VALUES[i] >= wVal) {
            pageState.weightIndex = i;
            break;
          }
        }
      }
      if (savedReps) {
        const rVal = parseInt(savedReps);
        if (rVal >= 1 && rVal <= 50) {
          pageState.repsIndex = rVal - 1;
        }
      }
    }
  },

  build() {
    logger.log(`Building details page, exercise: ${pageState.exerciseName}`);
    
    // Encabezados KG / REPS
    createWidget(widget.TEXT, {
      x: 0,
      y: px(5),
      w: COL_WIDTH,
      h: px(30),
      text: "KG",
      text_size: px(22),
      color: 0x00AAFF,
      align_h: align.CENTER_H
    });
    
    createWidget(widget.TEXT, {
      x: COL_WIDTH,
      y: px(5),
      w: COL_WIDTH,
      h: px(30),
      text: "REPS",
      text_size: px(22),
      color: 0x00FF88,
      align_h: align.CENTER_H
    });
    
    // Separador vertical
    createWidget(widget.FILL_RECT, {
      x: COL_WIDTH - px(1),
      y: px(35),
      w: px(2),
      h: LIST_HEIGHT,
      color: 0x333333
    });

    // Lista de PESO (izquierda)
    createWidget(widget.SCROLL_LIST, {
      x: 0,
      y: px(35),
      w: COL_WIDTH - px(5),
      h: LIST_HEIGHT,
      item_space: px(4),
      item_config: [
        {
          type_id: 1,
          item_height: px(50),
          item_bg_color: 0x222222,
          item_bg_radius: px(8),
          text_view: [
            {
              x: 0,
              y: 0,
              w: COL_WIDTH - px(10),
              h: px(50),
              key: "label",
              color: 0xFFFFFF,
              text_size: px(26),
              align_h: align.CENTER_H,
              align_v: align.CENTER_V
            }
          ]
        }
      ],
      item_config_count: 1,
      data_array: WEIGHT_DATA,
      data_count: WEIGHT_DATA.length,
      item_click_func: (list, index) => {
        pageState.weightIndex = index;
        logger.log(`Peso seleccionado: ${WEIGHT_VALUES[index]}kg`);
      },
      data_type_config: [
        {
          start: 0,
          end: WEIGHT_DATA.length - 1,
          type_id: 1
        }
      ],
      data_type_config_count: 1
    });

    // Lista de REPS (derecha)
    createWidget(widget.SCROLL_LIST, {
      x: COL_WIDTH + px(3),
      y: px(35),
      w: COL_WIDTH - px(5),
      h: LIST_HEIGHT,
      item_space: px(4),
      item_config: [
        {
          type_id: 1,
          item_height: px(50),
          item_bg_color: 0x222222,
          item_bg_radius: px(8),
          text_view: [
            {
              x: 0,
              y: 0,
              w: COL_WIDTH - px(10),
              h: px(50),
              key: "label",
              color: 0xFFFFFF,
              text_size: px(26),
              align_h: align.CENTER_H,
              align_v: align.CENTER_V
            }
          ]
        }
      ],
      item_config_count: 1,
      data_array: REPS_DATA,
      data_count: REPS_DATA.length,
      item_click_func: (list, index) => {
        pageState.repsIndex = index;
        logger.log(`Reps seleccionado: ${REPS_VALUES[index]}`);
      },
      data_type_config: [
        {
          start: 0,
          end: REPS_DATA.length - 1,
          type_id: 1
        }
      ],
      data_type_config_count: 1
    });

    // Botón VOLVER (izquierda abajo)
    createWidget(widget.BUTTON, {
      x: px(15),
      y: DEVICE_HEIGHT - px(80),
      w: px(75),
      h: px(60),
      text: "←",
      text_size: px(30),
      color: 0xFFFFFF,
      normal_color: 0x333333,
      press_color: 0x555555,
      radius: px(14),
      click_func: () => {
        back();
      }
    });

    // Botón GUARDAR (derecha abajo)
    createWidget(widget.BUTTON, {
      x: px(105),
      y: DEVICE_HEIGHT - px(80),
      w: DEVICE_WIDTH - px(120),
      h: px(60),
      text: "GUARDAR",
      text_size: px(20),
      color: 0x000000,
      normal_color: 0x00AAFF,
      press_color: 0x005599,
      radius: px(14),
      click_func: () => {
        saveSet();
      }
    });
  },

  onDestroy() {
    logger.log("Pantalla Detalles Destruida");
  }
});

function saveSet() {
  const weight = WEIGHT_VALUES[pageState.weightIndex];
  const reps = REPS_VALUES[pageState.repsIndex];
  
  logger.log(`Guardando: ${pageState.exerciseName} - ${weight}kg x ${reps}`);
  
  // Guardar el set en localStorage (lista temporal)
  const setsJson = localStorage.getItem('today_sets') || '[]';
  let sets = [];
  try {
    sets = JSON.parse(setsJson);
  } catch(e) {
    sets = [];
  }
  
  const newSet = {
    id: Date.now(),
    name: pageState.exerciseName,
    weight: weight,
    reps: reps,
    timestamp: Date.now()
  };
  
  if (pageState.editMode && pageState.editId) {
    // Actualizar set existente
    const idx = sets.findIndex(s => s.id === pageState.editId);
    if (idx >= 0) {
      sets[idx] = { ...sets[idx], ...newSet, id: pageState.editId };
    }
    localStorage.setItem('today_sets', JSON.stringify(sets));
    
    // Limpiar estado de edición
    localStorage.removeItem('edit_mode');
    localStorage.removeItem('edit_id');
    localStorage.removeItem('edit_weight');
    localStorage.removeItem('edit_reps');
    
    // Ir directo al resumen
    push({ url: 'page/gt/home/summary.page' });
  } else {
    // Agregar nuevo set
    sets.push(newSet);
    localStorage.setItem('today_sets', JSON.stringify(sets));
    
    // Ir a pantalla de descanso
    push({ url: 'page/gt/home/rest.page' });
  }
}
