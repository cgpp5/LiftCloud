import { createWidget, widget, prop, align, deleteWidget, createKeyboard, inputType, deleteKeyboard, setStatusBarVisible } from "@zos/ui";
import { back, replace } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";
import { BasePage } from "@zeppos/zml/base-page";

const logger = Logger.getLogger("LiftCloud-EditExercise");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

const DEFAULT_WEIGHT = 8;
const DEFAULT_REPS = 15;

let pageContext = null;

// Estado de la página
let pageState = {
  exercises: [],
  modalGroup: null,
  itemToDeleteIndex: -1,
  widgets: [],
  keyboardOpen: false,
  scrollContainer: null,
  keyboardCloseBtn: null
};

Page(BasePage({
  onInit() {
    pageContext = this;
    logger.log("Pantalla Edit Exercise Iniciada");
    setStatusBarVisible(false);
    loadExercises();
    syncExercisesFromCloud();
  },

  build() {
    const HEADER_H = px(50);
    const LIST_TOP = px(10);
    const ITEM_HEIGHT = px(75);
    const GAP = px(8);
    const ICON_COL_W = px(40);
    const EDIT_ICON_SIZE = px(35);
    const DELETE_ICON_SIZE = px(35);
    const PRIMARY_BTN_HEIGHT = px(80);
    
    // Barra superior fija
    createWidget(widget.TEXT, {
      x: 0,
      y: LIST_TOP,
      w: DEVICE_WIDTH,
      h: px(35),
      text: "Editar Ejercicios",
      text_size: px(23),
      color: 0x00FF00,
      align_h: align.CENTER_H
    });

    // Botón cerrar teclado (oculto por defecto) en la barra fija
    pageState.keyboardCloseBtn = createWidget(widget.BUTTON, {
      x: DEVICE_WIDTH - px(60),
      y: px(5),
      w: px(50),
      h: px(50),
      text: "X",
      text_size: px(28),
      color: 0x000000,
      normal_color: 0x00FF00,
      press_color: 0x00AA00,
      normal_alpha: 255,
      press_alpha: 255,
      click_func: () => {
        if (pageState.keyboardOpen) {
          try {
            deleteKeyboard();
          } catch (e) {
            logger.log(`Error cerrando teclado: ${e}`);
          }
          pageState.keyboardOpen = false;
          if (pageState.keyboardCloseBtn) {
            pageState.keyboardCloseBtn.setProperty(prop.VISIBLE, false);
          }
        }
      }
    });
    pageState.keyboardCloseBtn.setProperty(prop.VISIBLE, false);

    pageState.scrollContainer = createWidget(widget.VIEW_CONTAINER, {
      x: 0,
      y: HEADER_H,
      w: DEVICE_WIDTH,
      h: DEVICE_HEIGHT - HEADER_H - px(100),
      scroll_enable: true,
      scroll_direction: 1
    });
    const parent = pageState.scrollContainer;

    const listStartY = px(5);
    
    // Renderizar lista de ejercicios con botones de acción
    pageState.exercises.forEach((exercise, index) => {
      const yPos = listStartY + index * (ITEM_HEIGHT + GAP);
      const displayWeight = formatWeight(exercise.defaultWeight);
      const displayReps = formatReps(exercise.defaultReps);
      
      // Nombre del ejercicio
      const nameWidget = parent.createWidget(widget.TEXT, {
        x: px(15),
        y: yPos + px(6),
        w: DEVICE_WIDTH - px(90),
        h: px(35),
        text: truncateText(exercise.name, 18),
        text_size: px(25),
        color: 0x00FF00
      });
      pageState.widgets.push(nameWidget);

      // Valores por defecto: KG / REPS
      const weightBtn = parent.createWidget(widget.BUTTON, {
        x: px(15),
        y: yPos + px(40),
        w: px(120),
        h: px(28),
        text: `KG: ${displayWeight}`,
        text_size: px(20),
        color: 0x00FF00,
        normal_alpha: 0,
        press_alpha: 60,
        click_func: () => {
          editDefaultWeight(index);
        }
      });
      pageState.widgets.push(weightBtn);

      const repsBtn = parent.createWidget(widget.BUTTON, {
        x: px(140),
        y: yPos + px(40),
        w: px(120),
        h: px(28),
        text: `REPS: ${displayReps}`,
        text_size: px(20),
        color: 0x00FF00,
        normal_alpha: 0,
        press_alpha: 60,
        click_func: () => {
          editDefaultReps(index);
        }
      });
      pageState.widgets.push(repsBtn);
      
      // Botón Editar (✏️)
      const editBtn = parent.createWidget(widget.BUTTON, {
        x: DEVICE_WIDTH - px(110) + Math.floor((ICON_COL_W - EDIT_ICON_SIZE) / 2),
        y: yPos + Math.floor((ITEM_HEIGHT - EDIT_ICON_SIZE) / 2),
        w: EDIT_ICON_SIZE,
        h: EDIT_ICON_SIZE,
        normal_src: "image/edit.png",
        press_src: "image/edit_press.png",
        radius: px(8),
        click_func: () => {
          editExercise(index);
        }
      });
      pageState.widgets.push(editBtn);
      
      // Botón Eliminar (🗑️)
      const deleteBtn = parent.createWidget(widget.BUTTON, {
        x: DEVICE_WIDTH - px(60) + Math.floor((ICON_COL_W - DELETE_ICON_SIZE) / 2),
        y: yPos + Math.floor((ITEM_HEIGHT - DELETE_ICON_SIZE) / 2),
        w: DELETE_ICON_SIZE,
        h: DELETE_ICON_SIZE,
        normal_src: "image/delete.png",
        press_src: "image/delete_press.png",
        radius: px(6),
        click_func: () => {
          showDeleteModal(index);
        }
      });
      pageState.widgets.push(deleteBtn);
    });
    
    // Botones inferiores (fijos): VOLVER izquierda, NUEVO derecha
    const footerY = DEVICE_HEIGHT - px(88);
    const footerW = (DEVICE_WIDTH - px(70)) / 2;

    createWidget(widget.BUTTON, {
      x: px(30),
      y: footerY,
      w: footerW,
      h: PRIMARY_BTN_HEIGHT,
      text: "VOLVER",
      text_size: px(26),
      color: 0x000000,
      normal_color: 0x00FF00,
      press_color: 0x00AA00,
      radius: px(30),
      click_func: () => {
        back();
      }
    });

    createWidget(widget.BUTTON, {
      x: px(30) + footerW + px(10),
      y: footerY,
      w: footerW,
      h: PRIMARY_BTN_HEIGHT,
      text: "NUEVO",
      text_size: px(26),
      color: 0x000000,
      normal_color: 0x00FF00,
      press_color: 0x00AA00,
      radius: px(30),
      click_func: () => {
        addNewExercise();
      }
    });
    
    // Crear modal de confirmación
    createDeleteModal();
  },

  onDestroy() {
    pageContext = null;
    logger.log("Pantalla Edit Exercise Destruida");
    if (pageState.keyboardOpen) {
      try {
        deleteKeyboard();
      } catch (e) {
        logger.log(`Error cerrando teclado: ${e}`);
      }
      pageState.keyboardOpen = false;
    }
    pageState.widgets = [];
  }
}));

// =====================
// Funciones de datos
// =====================

function loadExercises() {
  const saved = localStorage.getItem('exercises_list');
  if (saved) {
    try {
      const raw = JSON.parse(saved);
      pageState.exercises = normalizeExercises(raw);
    } catch(e) {
      pageState.exercises = [];
    }
  } else {
    pageState.exercises = [];
    saveExercises();
  }
  logger.log(`Cargados ${pageState.exercises.length} ejercicios`);
}

function saveExercises() {
  localStorage.setItem('exercises_list', JSON.stringify(pageState.exercises));
  // Sincronizar con Supabase automáticamente
  syncExercisesToCloud();
}

function syncExercisesToCloud() {
  if (!pageContext) {
    logger.log("pageContext no disponible para sync");
    return;
  }
  
  pageContext.request({
    method: 'SYNC_EXERCISES',
    params: { exercises: pageState.exercises }
  })
  .then((data) => {
    logger.log(`Ejercicios sincronizados: ${JSON.stringify(data)}`);
  })
  .catch((error) => {
    logger.log(`Error sincronizando ejercicios: ${error}`);
  });
}

function syncExercisesFromCloud() {
  if (!pageContext) {
    logger.log("pageContext no disponible");
    return;
  }

  pageContext.request({
    method: 'GET_EXERCISES'
  })
  .then((data) => {
    if (!data || data.status !== 'success' || !Array.isArray(data.exercises)) {
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
      localStorage.setItem('exercises_list', JSON.stringify(clean));
      replace({ url: 'page/gt/home/edit-exercise.page' });
    }
  })
  .catch((error) => {
    logger.log(`Error obteniendo ejercicios: ${error}`);
  });
}

// =====================
// Acciones
// =====================

function editExercise(index) {
  const currentName = pageState.exercises[index].name;
  logger.log(`Editando ejercicio: ${currentName}`);

  openKeyboard(currentName, (text) => {
    pageState.exercises[index].name = text;
    saveExercises();
    replace({ url: 'page/gt/home/edit-exercise.page' });
  });
}

function addNewExercise() {
  logger.log("Añadiendo nuevo ejercicio");

  openKeyboard("", (text) => {
    pageState.exercises.push({
      name: text,
      defaultWeight: DEFAULT_WEIGHT,
      defaultReps: DEFAULT_REPS
    });
    pageState.exercises.sort((a, b) => a.name.localeCompare(b.name));
    saveExercises();
    replace({ url: 'page/gt/home/edit-exercise.page' });
  });
}

function openKeyboard(initialText, onConfirm) {
  if (pageState.keyboardOpen) {
    return;
  }
  pageState.keyboardOpen = true;
  if (pageState.keyboardCloseBtn) {
    pageState.keyboardCloseBtn.setProperty(prop.VISIBLE, true);
  }

  try {
    createKeyboard({
      inputType: inputType.CHAR,
      text: initialText || "",
      onComplete: (_, result) => {
        const value = (result && result.data) ? String(result.data) : "";
        const text = value.trim();
        try {
          deleteKeyboard();
        } catch (e) {
          logger.log(`Error cerrando teclado: ${e}`);
        }
        pageState.keyboardOpen = false;
        if (pageState.keyboardCloseBtn) {
          pageState.keyboardCloseBtn.setProperty(prop.VISIBLE, false);
        }
        if (text) {
          onConfirm(text);
        }
      },
      onCancel: () => {
        try {
          deleteKeyboard();
        } catch (e) {
          logger.log(`Error cerrando teclado: ${e}`);
        }
        pageState.keyboardOpen = false;
        if (pageState.keyboardCloseBtn) {
          pageState.keyboardCloseBtn.setProperty(prop.VISIBLE, false);
        }
      }
    });
  } catch (e) {
    pageState.keyboardOpen = false;
    if (pageState.keyboardCloseBtn) {
      pageState.keyboardCloseBtn.setProperty(prop.VISIBLE, false);
    }
    logger.log(`Error mostrando teclado: ${e}`);
  }
}

function deleteExercise(index) {
  const name = pageState.exercises[index].name;
  logger.log(`Eliminando ejercicio: ${name}`);
  
  pageState.exercises.splice(index, 1);
  saveExercises();
  
  // Sincronizar eliminación
  if (pageContext) {
    pageContext.request({
      method: 'DELETE_EXERCISE',
      params: { name: name }
    }).catch(e => logger.log(`Error sync delete: ${e}`));
  }
  
  // Recargar página
  replace({ url: 'page/gt/home/edit-exercise.page' });
}

// =====================
// Modal de confirmación
// =====================

function createDeleteModal() {
  pageState.modalGroup = createWidget(widget.GROUP, {
    x: 0,
    y: 0,
    w: DEVICE_WIDTH,
    h: DEVICE_HEIGHT
  });
  
  // Fondo oscuro
  pageState.modalGroup.createWidget(widget.FILL_RECT, {
    x: 0,
    y: 0,
    w: DEVICE_WIDTH,
    h: DEVICE_HEIGHT,
    color: 0x000000,
    alpha: 200
  });
  
  // Caja del modal
  pageState.modalGroup.createWidget(widget.FILL_RECT, {
    x: px(30),
    y: px(120),
    w: DEVICE_WIDTH - px(60),
    h: px(200),
    color: 0x222222,
    radius: px(20)
  });
  
  // Texto
  pageState.modalGroup.createWidget(widget.TEXT, {
    x: px(40),
    y: px(140),
    w: DEVICE_WIDTH - px(80),
    h: px(60),
    text: "¿Eliminar este\nejercicio?",
    text_size: px(26),
    color: 0xFFFFFF,
    align_h: align.CENTER_H
  });
  
  // Botón CANCELAR
  pageState.modalGroup.createWidget(widget.BUTTON, {
    x: px(40),
    y: px(215),
    w: (DEVICE_WIDTH - px(100)) / 2,
    h: px(50),
    text: "NO",
    text_size: px(22),
    color: 0xFFFFFF,
    normal_color: 0x555555,
    press_color: 0x777777,
    radius: px(12),
    click_func: () => {
      hideModal();
    }
  });
  
  // Botón ELIMINAR
  pageState.modalGroup.createWidget(widget.BUTTON, {
    x: px(40) + (DEVICE_WIDTH - px(100)) / 2 + px(20),
    y: px(215),
    w: (DEVICE_WIDTH - px(100)) / 2,
    h: px(50),
    text: "SÍ",
    text_size: px(22),
    color: 0xFFFFFF,
    normal_color: 0xCC3333,
    press_color: 0xFF4444,
    radius: px(12),
    click_func: () => {
      if (pageState.itemToDeleteIndex >= 0) {
        deleteExercise(pageState.itemToDeleteIndex);
      }
      hideModal();
    }
  });
  
  // Ocultar modal
  pageState.modalGroup.setProperty(prop.VISIBLE, false);
}

function showDeleteModal(index) {
  pageState.itemToDeleteIndex = index;
  if (pageState.scrollContainer) {
    pageState.scrollContainer.setProperty(prop.VISIBLE, false);
  }
  pageState.modalGroup.setProperty(prop.VISIBLE, true);
}

function hideModal() {
  pageState.modalGroup.setProperty(prop.VISIBLE, false);
  pageState.itemToDeleteIndex = -1;
  if (pageState.scrollContainer) {
    pageState.scrollContainer.setProperty(prop.VISIBLE, true);
  }
}

function truncateText(text, limit) {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit - 2) + "..";
}

function normalizeExercises(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => {
      if (typeof item === "string") {
        return {
          name: item.trim(),
          defaultWeight: DEFAULT_WEIGHT,
          defaultReps: DEFAULT_REPS
        };
      }

      if (!item || typeof item !== "object") return null;
      const name = item.name ? String(item.name).trim() : "";
      if (!name) return null;

      const weight = parseFloat(item.defaultWeight);
      const reps = parseInt(item.defaultReps);

      return {
        name,
        defaultWeight: Number.isFinite(weight) ? weight : DEFAULT_WEIGHT,
        defaultReps: Number.isFinite(reps) ? reps : DEFAULT_REPS
      };
    })
    .filter(Boolean);
}

function formatWeight(value) {
  const num = Number.isFinite(value) ? value : DEFAULT_WEIGHT;
  return num % 1 === 0 ? `${num}` : num.toFixed(1);
}

function formatReps(value) {
  const num = Number.isFinite(value) ? value : DEFAULT_REPS;
  return `${num}`;
}

function editDefaultWeight(index) {
  const current = pageState.exercises[index].defaultWeight;
  openKeyboard(String(current ?? DEFAULT_WEIGHT), (text) => {
    const parsed = parseFloat(text.replace(",", "."));
    if (!Number.isFinite(parsed)) return;
    const rounded = Math.round(parsed * 2) / 2;
    pageState.exercises[index].defaultWeight = Math.max(0, Math.min(rounded, 200));
    saveExercises();
    replace({ url: 'page/gt/home/edit-exercise.page' });
  });
}

function editDefaultReps(index) {
  const current = pageState.exercises[index].defaultReps;
  openKeyboard(String(current ?? DEFAULT_REPS), (text) => {
    const parsed = parseInt(text, 10);
    if (!Number.isFinite(parsed)) return;
    pageState.exercises[index].defaultReps = Math.max(1, Math.min(parsed, 50));
    saveExercises();
    replace({ url: 'page/gt/home/edit-exercise.page' });
  });
}
