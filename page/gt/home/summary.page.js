import { createWidget, widget, prop, align } from "@zos/ui";
import { push, replace } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";

const logger = Logger.getLogger("LiftCloud-Summary");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Paleta de colores pastel para las burbujas
const COLOR_PALETTE = [
  0xFFB3BA, // Rosa
  0xFFDFBA, // Melocotón
  0xFFFFBA, // Amarillo
  0xBAFFC9, // Verde claro
  0xBAE1FF, // Azul claro
  0xE6E6FA, // Lavanda
  0xFFC0CB, // Pink
  0x98FB98  // Verde menta
];

// Estado de la página
let pageState = {
  sets: [],
  scrollContainer: null,
  modalGroup: null,
  itemToDeleteIndex: -1
};

Page({
  onInit() {
    logger.log("Pantalla Resumen Iniciada");
    
    // Cargar sets del día
    const setsJson = localStorage.getItem('today_sets') || '[]';
    try {
      pageState.sets = JSON.parse(setsJson);
    } catch(e) {
      pageState.sets = [];
    }
    
    logger.log(`Cargados ${pageState.sets.length} sets`);
  },

  build() {
    // 1. Cabecera con fecha
    const today = getTodayDate();
    createWidget(widget.TEXT, {
      x: 0,
      y: px(10),
      w: DEVICE_WIDTH,
      h: px(30),
      text: today,
      text_size: px(22),
      color: 0xAAAAAA,
      align_h: align.CENTER_H
    });

    // 2. Lista scrolleable de sets
    const LIST_HEIGHT = DEVICE_HEIGHT - px(130);
    pageState.scrollContainer = createWidget(widget.VIEW_CONTAINER, {
      x: 0,
      y: px(45),
      w: DEVICE_WIDTH,
      h: LIST_HEIGHT,
      scroll_enable: true
    });

    createSetsList();

    // 3. Botón NUEVO EJERCICIO
    createWidget(widget.BUTTON, {
      x: px(20),
      y: DEVICE_HEIGHT - px(80),
      w: DEVICE_WIDTH - px(40),
      h: px(60),
      text: "NUEVO EJERCICIO",
      text_size: px(22),
      color: 0x000000,
      normal_color: 0x00AAFF,
      press_color: 0x005599,
      radius: px(30),
      click_func: () => {
        push({ url: 'page/gt/home/exercise.page' });
      }
    });

    // 4. Crear modal (oculto inicialmente)
    createDeleteModal();
  },

  onDestroy() {
    logger.log("Pantalla Resumen Destruida");
  }
});

function createSetsList() {
  const ROW_HEIGHT = px(60);
  const GAP = px(10);
  const BUBBLE_WIDTH = DEVICE_WIDTH - px(40);
  
  if (pageState.sets.length === 0) {
    // Mostrar mensaje si no hay sets
    pageState.scrollContainer.createWidget(widget.TEXT, {
      x: 0,
      y: px(100),
      w: DEVICE_WIDTH,
      h: px(40),
      text: "No hay sets hoy",
      text_size: px(24),
      color: 0x666666,
      align_h: align.CENTER_H
    });
    return;
  }
  
  pageState.sets.forEach((set, index) => {
    const yPos = index * (ROW_HEIGHT + GAP);
    const bubbleColor = getColorFromName(set.name);
    
    // A. Burbuja de fondo
    pageState.scrollContainer.createWidget(widget.FILL_RECT, {
      x: px(20),
      y: yPos,
      w: BUBBLE_WIDTH,
      h: ROW_HEIGHT,
      radius: px(16),
      color: bubbleColor
    });
    
    // B. Nombre del ejercicio (izquierda)
    pageState.scrollContainer.createWidget(widget.TEXT, {
      x: px(30),
      y: yPos,
      w: px(160),
      h: ROW_HEIGHT,
      text: truncateText(set.name, 12),
      text_size: px(20),
      color: 0x000000,
      align_v: align.CENTER_V
    });
    
    // C. Peso x Reps (derecha)
    const weightStr = set.weight % 1 === 0 ? `${set.weight}` : set.weight.toFixed(1);
    pageState.scrollContainer.createWidget(widget.TEXT, {
      x: px(190),
      y: yPos,
      w: px(140),
      h: ROW_HEIGHT,
      text: `${weightStr}kg x ${set.reps}`,
      text_size: px(20),
      color: 0x000000,
      align_h: align.RIGHT,
      align_v: align.CENTER_V
    });
    
    // D. Botón invisible para interacción
    pageState.scrollContainer.createWidget(widget.BUTTON, {
      x: px(20),
      y: yPos,
      w: BUBBLE_WIDTH,
      h: ROW_HEIGHT,
      radius: px(16),
      normal_alpha: 0,
      press_alpha: 50,
      press_color: 0x000000,
      click_func: () => {
        goToEdit(index);
      },
      longpress_func: () => {
        showDeleteModal(index);
      }
    });
  });
  
  // Espacio extra al final para scroll
  pageState.scrollContainer.createWidget(widget.FILL_RECT, {
    x: 0,
    y: pageState.sets.length * (ROW_HEIGHT + GAP),
    w: 10,
    h: px(50),
    color: 0x000000
  });
}

function getColorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

function truncateText(text, limit) {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit - 2) + "..";
}

function getTodayDate() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

function goToEdit(index) {
  const set = pageState.sets[index];
  
  // Guardar datos para edición
  localStorage.setItem('current_exercise', set.name);
  localStorage.setItem('edit_mode', 'true');
  localStorage.setItem('edit_id', String(set.id));
  localStorage.setItem('edit_weight', String(set.weight));
  localStorage.setItem('edit_reps', String(set.reps));
  
  // Ir a selección de ejercicio
  push({ 
    url: 'page/gt/home/exercise.page',
    params: JSON.stringify({
      mode: 'edit',
      id: set.id,
      name: set.name
    })
  });
}

function createDeleteModal() {
  // Grupo del modal
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
    alpha: 220
  });
  
  // Texto de confirmación
  pageState.modalGroup.createWidget(widget.TEXT, {
    x: 0,
    y: px(140),
    w: DEVICE_WIDTH,
    h: px(50),
    text: "¿Eliminar entrada?",
    text_size: px(24),
    color: 0xFFFFFF,
    align_h: align.CENTER_H
  });
  
  // Botón X para cerrar
  pageState.modalGroup.createWidget(widget.BUTTON, {
    x: DEVICE_WIDTH - px(60),
    y: px(40),
    w: px(50),
    h: px(50),
    text: "X",
    text_size: px(28),
    color: 0x888888,
    normal_alpha: 0,
    press_alpha: 50,
    click_func: () => {
      hideModal();
    }
  });
  
  // Botón ELIMINAR
  pageState.modalGroup.createWidget(widget.BUTTON, {
    x: px(40),
    y: px(220),
    w: DEVICE_WIDTH - px(80),
    h: px(60),
    text: "ELIMINAR",
    text_size: px(22),
    color: 0xFFFFFF,
    normal_color: 0xFF4444,
    press_color: 0xCC0000,
    radius: px(16),
    click_func: () => {
      deleteItem();
    }
  });
  
  // Ocultar modal inicialmente
  pageState.modalGroup.setProperty(prop.VISIBLE, false);
}

function showDeleteModal(index) {
  pageState.itemToDeleteIndex = index;
  pageState.modalGroup.setProperty(prop.VISIBLE, true);
}

function hideModal() {
  pageState.modalGroup.setProperty(prop.VISIBLE, false);
  pageState.itemToDeleteIndex = -1;
}

function deleteItem() {
  if (pageState.itemToDeleteIndex >= 0 && pageState.itemToDeleteIndex < pageState.sets.length) {
    // Eliminar del array
    pageState.sets.splice(pageState.itemToDeleteIndex, 1);
    
    // Guardar en localStorage
    localStorage.setItem('today_sets', JSON.stringify(pageState.sets));
    
    logger.log(`Set eliminado. Quedan ${pageState.sets.length} sets.`);
    
    // Recargar la página para refrescar la lista
    replace({ url: 'page/gt/home/summary.page' });
  }
  
  hideModal();
}
