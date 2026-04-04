import { createWidget, widget, prop, align, setStatusBarVisible } from "@zos/ui";
import { push, replace } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";
import { BasePage } from "@zeppos/zml/base-page";

const logger = Logger.getLogger("LiftCloud-Exercise");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

let pageContext = null;

// Estado de la página
let pageState = {
  selectedIndex: 0,
  editMode: false,
  editId: null,
  dataArray: [],
  exercises: [],
  exerciseNames: [],
  lastParams: null,
  isLoading: false,
  selectedTextWidget: null
};

Page(BasePage({
  onInit(params) {
    pageContext = this;
    logger.log("Pantalla Ejercicio Iniciada");
    setStatusBarVisible(false);

    pageState.lastParams = params || null;
    
    // Cargar ejercicios de localStorage
    loadExercises();
    syncExercisesFromCloud();
    
    // Preparar array de datos para SCROLL_LIST
    pageState.exerciseNames = pageState.exercises.map((exercise) => exercise.name);
    
    // Verificar si venimos en modo edición
    if (params && typeof params === 'string' && params.length > 2) {
      try {
        const data = JSON.parse(params);
        if (data && data.mode === 'edit') {
          pageState.editMode = true;
          pageState.editId = data.id;
          const idx = pageState.exerciseNames.indexOf(data.name);
          if (idx >= 0) pageState.selectedIndex = idx;
        }
      } catch(e) {
        logger.log("Navegación sin params de edición");
      }
    }
  },

  build() {
    logger.log(`Screen: ${DEVICE_WIDTH}x${DEVICE_HEIGHT}`);
    
    const LIST_X = 0;
    const LIST_TOP = px(60);
    const LIST_WIDTH = DEVICE_WIDTH - px(26);
    const LIST_HEIGHT = DEVICE_HEIGHT - px(160);
    const SELECT_TEXT_Y = Math.round(DEVICE_HEIGHT / 2 - px(18));

    
    if (pageState.exercises.length === 0) {
      createWidget(widget.TEXT, {
        x: 0,
        y: px(200),
        w: DEVICE_WIDTH,
        h: px(40),
        text: pageState.isLoading ? "Actualizando ejercicios..." : "Sin ejercicios",
        text_size: px(24),
        color: 0x00FF00,
        align_h: align.CENTER_H
      });
    } else {
      // Usar SCROLL_LIST para la lista de ejercicios
      createWidget(widget.WIDGET_PICKER, {
        x: LIST_X,
        y: LIST_TOP,
        w: LIST_WIDTH,
        h: LIST_HEIGHT,
        title: "",
        nb_of_columns: 1,
        init_col_index: 0,
        normal_color: 0x00FF00,
        select_color: 0x00FF00,
        data_config: [
          {
            data_array: pageState.exerciseNames,
            support_loop: true,
            font_size: px(25),
            select_font_size: px(33),
            init_val_index: pageState.selectedIndex,
            col_width: LIST_WIDTH
          }
        ],
        picker_cb: (picker, eventType, columnIndex, selectIndex) => {
          // eventType 1 = get focus, 2 = selected item has a value (scroll settled)
          // Use both to track the current selection index
          if (columnIndex === 0 && (eventType === 1 || eventType === 2)) {
            pageState.selectedIndex = selectIndex;
            logger.log(`Ejercicio seleccionado: ${pageState.exerciseNames[selectIndex]}`);
            if (pageState.selectedTextWidget) {
              pageState.selectedTextWidget.setProperty(
                prop.TEXT,
                pageState.exerciseNames[selectIndex] || ""
              );
            }
          }
          // Do NOT call selectExercise() here — event_type 2 fires on every scroll settle.
          // The EJERCICIO button is the sole trigger for navigation.
        }
      });

      // Botón overlay sobre el botón Done del picker
      createWidget(widget.BUTTON, {
        x: px(30),
        y: DEVICE_HEIGHT - px(88),
        w: DEVICE_WIDTH - px(60),
        h: px(80),
        text: "EJERCICIO",
        text_size: px(26),
        color: 0x000000,
        normal_color: 0x00FF00,
        press_color: 0x00AA00,
        radius: px(30),
        click_func: () => {
          const selectedName = pageState.exerciseNames[pageState.selectedIndex];
          if (selectedName) {
            selectExercise(selectedName);
          }
        }
      });
    }

    // Botón AJUSTES (arriba izquierda)
    createWidget(widget.BUTTON, {
      x: px(28),
      y: px(25),
      w: px(55),
      h: px(55),
      normal_src: "image/settings.png",
      press_src: "image/settings_press.png",
      click_func: () => {
        push({ url: 'page/gt/home/edit-exercise.page' });
      }
    });
  },

  onDestroy() {
    pageContext = null;
    logger.log("Pantalla Ejercicio Destruida");
  }
}));

function loadExercises() {
  const saved = localStorage.getItem('exercises_list');
  if (saved) {
    try {
      pageState.exercises = normalizeExercises(JSON.parse(saved));
    } catch(e) {
      pageState.exercises = [];
    }
  } else {
    pageState.exercises = [];
  }
  pageState.isLoading = false;
  pageState.exerciseNames = pageState.exercises.map((exercise) => exercise.name);
  logger.log(`Cargados ${pageState.exercises.length} ejercicios (isLoading=false)`);
}

function syncExercisesFromCloud() {
  if (!pageContext) {
    logger.log("pageContext no disponible - no se puede sincronizar");
    return;
  }

  pageContext.request({
    method: 'GET_EXERCISES'
  })
  .then((data) => {
    logger.log(`GET_EXERCISES respuesta recibida`);
    if (!data || data.status !== 'success' || !Array.isArray(data.exercises)) {
      logger.log(`GET_EXERCISES: respuesta inválida: ${JSON.stringify(data).substring(0, 150)}`);
      return;
    }

    const clean = normalizeExercises(data.exercises);

    if (clean.length === 0) {
      return;
    }

    const current = JSON.stringify(pageState.exercises);
    const incoming = JSON.stringify(clean);
    if (current !== incoming) {
      pageState.exercises = clean;
      pageState.exerciseNames = pageState.exercises.map((exercise) => exercise.name);
      localStorage.setItem('exercises_list', JSON.stringify(clean));
      replace({
        url: 'page/gt/home/exercise.page',
        params: pageState.lastParams || undefined
      });
    }
  })
  .catch((error) => {
    logger.log(`Error obteniendo ejercicios: ${error}`);
  });
}

function selectExercise(exerciseName) {
  logger.log(`Ejercicio seleccionado: ${exerciseName}`);

  const selected = pageState.exercises.find((exercise) => exercise.name === exerciseName);
  if (selected) {
    localStorage.setItem('current_exercise_default_weight', String(selected.defaultWeight ?? ""));
    localStorage.setItem('current_exercise_default_reps', String(selected.defaultReps ?? ""));
  } else {
    localStorage.removeItem('current_exercise_default_weight');
    localStorage.removeItem('current_exercise_default_reps');
  }
  
  // Guardar en localStorage para la siguiente pantalla
  localStorage.setItem('current_exercise', exerciseName);
  localStorage.setItem('edit_mode', pageState.editMode ? 'true' : 'false');
  if (pageState.editId) {
    localStorage.setItem('edit_id', String(pageState.editId));
  }
  
  // Navegar a la pantalla de detalles (peso/reps)
  push({
    url: 'page/gt/home/details.page'
  });
}

function normalizeExercises(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim();
        if (!name) return null;
        return { name, defaultWeight: 8, defaultReps: 15 };
      }

      if (!item || typeof item !== "object") return null;
      const name = item.name ? String(item.name).trim() : "";
      if (!name) return null;

      const weight = Number(item.defaultWeight);
      const reps = Number(item.defaultReps);

      return {
        name,
        defaultWeight: Number.isFinite(weight) ? weight : 8,
        defaultReps: Number.isFinite(reps) ? reps : 15
      };
    })
    .filter(Boolean);
}
