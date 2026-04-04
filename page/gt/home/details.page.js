import { createWidget, widget, prop, align, setStatusBarVisible } from "@zos/ui";
import { push } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";
import { BasePage } from "@zeppos/zml/base-page";

const logger = Logger.getLogger("LiftCloud-Details");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Generación de datos de peso (0 a 200kg en pasos de 0.5)
const WEIGHT_VALUES = [];
const WEIGHT_LABELS = [];
const WEIGHT_STEP = 0.5;
const WEIGHT_MAX = 200;
for (let i = 0; i <= WEIGHT_MAX / WEIGHT_STEP; i++) {
  const val = i * WEIGHT_STEP;
  WEIGHT_VALUES.push(val);
  WEIGHT_LABELS.push(val % 1 === 0 ? `${val}` : val.toFixed(1));
}

// Generación de datos de repeticiones (1 a 50)
const REPS_VALUES = [];
const REPS_LABELS = [];
for (let i = 1; i <= 50; i++) {
  REPS_VALUES.push(i);
  REPS_LABELS.push(`${i}`);
}

// Estado de la página
let pageState = {
  weightIndex: 16,   // 8kg por defecto (8 / 0.5 = 16)
  repsIndex: 14,     // 15 reps por defecto
  exerciseName: "Ejercicio",
  editMode: false,
  editId: null
};

const PICKER_PADDING_X = px(30);
const PICKER_WIDTH = DEVICE_WIDTH - PICKER_PADDING_X * 2;
const COL_WIDTH = PICKER_WIDTH / 2;
const LIST_TOP = px(60);
const LIST_HEIGHT = DEVICE_HEIGHT - px(160);

Page(BasePage({
  onInit() {
    logger.log("Pantalla Detalles Iniciada");
    setStatusBarVisible(false);
    
    // Recuperar datos de localStorage
    const exercise = localStorage.getItem('current_exercise');
    if (exercise) {
      pageState.exerciseName = exercise;
    }
    
    const editMode = localStorage.getItem('edit_mode');
    pageState.editMode = editMode === 'true';

    // Valores por defecto desde el ejercicio seleccionado
    const defaultWeight = parseFloat(localStorage.getItem('current_exercise_default_weight'));
    const defaultReps = parseInt(localStorage.getItem('current_exercise_default_reps'));
    if (Number.isFinite(defaultWeight)) {
      const idx = Math.round(defaultWeight / WEIGHT_STEP);
      pageState.weightIndex = Math.max(0, Math.min(idx, WEIGHT_VALUES.length - 1));
    }
    if (Number.isFinite(defaultReps)) {
      pageState.repsIndex = Math.max(0, Math.min(defaultReps - 1, REPS_VALUES.length - 1));
    }
    
    const editId = localStorage.getItem('edit_id');
    if (editId) {
      pageState.editId = parseInt(editId);
      
      // Recuperar valores guardados si estamos editando
      const savedWeight = localStorage.getItem('edit_weight');
      const savedReps = localStorage.getItem('edit_reps');
      if (savedWeight) {
        const wVal = parseFloat(savedWeight);
        const idx = Math.round(wVal / WEIGHT_STEP);
        pageState.weightIndex = Math.max(0, Math.min(idx, WEIGHT_VALUES.length - 1));
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
    
    const ITEM_HEIGHT = px(45);
    
    // Picker doble (Peso / Reps) con loop
    createWidget(widget.WIDGET_PICKER, {
      x: PICKER_PADDING_X,
      y: LIST_TOP,
      w: PICKER_WIDTH,
      h: LIST_HEIGHT,
      title: "",
      nb_of_columns: 2,
      init_col_index: 0,
      normal_color: 0x00FF00,
      select_color: 0x00FF00,
      data_config: [
        {
          data_array: WEIGHT_LABELS,
          support_loop: false,
          font_size: px(36),
          select_font_size: px(60),
          init_val_index: pageState.weightIndex,
          col_width: COL_WIDTH
        },
        {
          data_array: REPS_LABELS,
          support_loop: false,
          font_size: px(33),
          select_font_size: px(70),
          init_val_index: pageState.repsIndex,
          col_width: COL_WIDTH
        }
      ],
      picker_cb: (picker, eventType, columnIndex, selectIndex) => {
        // eventType 1 = get focus, 2 = selected item has a value (scroll settled)
        // Use both to track the current selection index
        if (eventType !== 1 && eventType !== 2) return;
        if (columnIndex === 0) {
          pageState.weightIndex = selectIndex;
          logger.log(`Peso seleccionado: ${WEIGHT_VALUES[selectIndex]}kg`);
        } else if (columnIndex === 1) {
          pageState.repsIndex = selectIndex;
          logger.log(`Reps seleccionado: ${REPS_VALUES[selectIndex]}`);
        }
        // Do NOT call saveSet() here — event_type 2 fires on every scroll settle.
        // The GUARDAR button is the sole trigger for saving.
      }
    });

    // Encabezados KG / REPS
    createWidget(widget.TEXT, {
      x: px(22),
      y: px(10),
      w: COL_WIDTH,
      h: px(30),
      text: "KG",
      text_size: px(26),
      color: 0x00FF00,
      align_h: align.CENTER_H
    });
    
    createWidget(widget.TEXT, {
      x: COL_WIDTH + px(48),
      y: px(10),
      w: COL_WIDTH,
      h: px(30),
      text: "REPS",
      text_size: px(26),
      color: 0x00FF00,
      align_h: align.CENTER_H
    });

    // Botón GUARDAR (abajo, fuera del picker)
    createWidget(widget.BUTTON, {
      x: px(30),
      y: DEVICE_HEIGHT - px(88),
      w: DEVICE_WIDTH - px(60),
      h: px(80),
      text: "GUARDAR",
      text_size: px(26),
      color: 0x000000,
      normal_color: 0x00FF00,
      press_color: 0x00AA00,
      radius: px(30),
      click_func: () => {
        saveSet();
      }
    });
  },

  onDestroy() {
    logger.log("Pantalla Detalles Destruida");
  }
}));

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
    timestamp: Date.now(),
    synced: false  // Marca para saber si está sincronizado con la nube
  };
  
  if (pageState.editMode && pageState.editId) {
    // Actualizar set existente
    const idx = sets.findIndex(s => s.id === pageState.editId);
    if (idx >= 0) {
      sets[idx] = { ...sets[idx], ...newSet, id: pageState.editId };
    }
    localStorage.setItem('today_sets', JSON.stringify(sets));

    // Encolar sincronización con descanso = 0
    queueSetForSync({ ...sets[idx], rest: 0 });
    
    // Limpiar estado de edición
    localStorage.removeItem('edit_mode');
    localStorage.removeItem('edit_id');
    localStorage.removeItem('edit_weight');
    localStorage.removeItem('edit_reps');
    
    // Ir directo al resumen (sin descanso)
    push({ url: 'page/gt/home/summary.page' });
  } else {
    // Agregar nuevo set (incompleto, falta rest time)
    const newSetWithRest = { ...newSet, rest: 0 };
    sets.push(newSetWithRest);
    localStorage.setItem('today_sets', JSON.stringify(sets));

    // Encolar sincronización con descanso = 0
    queueSetForSync(newSetWithRest);

    // Ir directo al resumen
    push({ url: 'page/gt/home/summary.page' });
  }
}

function queueSetForSync(set) {
  if (!set) return;
  try {
    const messagePayload = {
      exercise: set.name,
      weight: set.weight,
      reps: set.reps,
      rest: set.rest || 0,
      localId: set.id,
      timestamp: set.timestamp
    };

    const pendingJson = localStorage.getItem('pending_sync') || '[]';
    let pending = [];
    try {
      pending = JSON.parse(pendingJson);
    } catch (e) {
      pending = [];
    }

    pending.push(messagePayload);
    localStorage.setItem('pending_sync', JSON.stringify(pending));
  } catch (e) {
    logger.log(`Error en cola de sync: ${e}`);
  }
}
