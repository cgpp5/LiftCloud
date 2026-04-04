import { createWidget, widget, prop, align, deleteWidget, setStatusBarVisible } from "@zos/ui";
import { push, replace } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";
import { BasePage } from "@zeppos/zml/base-page";

const logger = Logger.getLogger("LiftCloud-Summary");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

let pageContext = null;

// Estado de la página
let pageState = {
  sets: [],
  modalGroup: null,
  itemToDeleteIndex: -1,
  scrollContainer: null
};

Page(BasePage({
  onInit() {
    pageContext = this;
    logger.log("Pantalla Resumen Iniciada");
    setStatusBarVisible(false);
    
    // Cargar sets del día
    const setsJson = localStorage.getItem('today_sets') || '[]';
    try {
      pageState.sets = JSON.parse(setsJson);
    } catch(e) {
      pageState.sets = [];
    }
    
    logger.log(`Cargados ${pageState.sets.length} sets`);

    // Sincronización automática al entrar
    autoSyncPendingSets();
  },

  build() {
    pageState.scrollContainer = createWidget(widget.VIEW_CONTAINER, {
      x: 0,
      y: 0,
      w: DEVICE_WIDTH,
      h: DEVICE_HEIGHT - px(90),
      scroll_enable: true,
      scroll_direction: 1
    });
    const parent = pageState.scrollContainer;

    const ROW_HEIGHT = px(60);
    const GAP = px(10);
    const BUBBLE_WIDTH = DEVICE_WIDTH - px(40);
    const HEADER_HEIGHT = px(50);
    
    // 1. Cabecera con fecha
    const today = getTodayDate();
    parent.createWidget(widget.TEXT, {
      x: 0,
      y: px(10),
      w: DEVICE_WIDTH,
      h: px(30),
      text: today,
      text_size: px(23),
      color: 0x00FF00,
      align_h: align.CENTER_H
    });

    // 2. Lista de sets directamente en la página
    if (pageState.sets.length === 0) {
      parent.createWidget(widget.TEXT, {
        x: 0,
        y: px(150),
        w: DEVICE_WIDTH,
        h: px(40),
        text: "No hay sets hoy",
        text_size: px(25),
        color: 0x00FF00,
        align_h: align.CENTER_H
      });
    } else {
      logger.log(`Renderizando ${pageState.sets.length} sets`);
      
      pageState.sets.forEach((set, index) => {
        const yPos = HEADER_HEIGHT + index * (ROW_HEIGHT + GAP);
        logger.log(`Set ${index}: ${set.name} - ${set.weight}kg x ${set.reps} at y=${yPos}`);
        
        // IMPLEMENTACIÓN SIMPLIFICADA
        // Usamos un único botón que contiene el texto y el color de fondo para asegurar funcionalidad
        const nameText = set.name ? truncateText(set.name, 16) : "Ej";
        const weightStr = set.weight % 1 === 0 ? `${set.weight}` : set.weight.toFixed(1);
        const displayText = `${nameText} ${weightStr}kg x ${set.reps}`;

        parent.createWidget(widget.BUTTON, {
          x: px(20),
          y: yPos,
          w: BUBBLE_WIDTH,
          h: ROW_HEIGHT,
          text: displayText,
          text_size: px(25),
          color: 0x00FF00,
          normal_alpha: 0,
          press_alpha: 0,
          click_func: () => {
            logger.log(`Click en set ${index}`);
            goToEdit(index);
          },
          longpress_func: () => {
            logger.log(`Longpress en set ${index}`);
            showDeleteModal(index);
          }
        });
      });
    }

    // 3. Botón NUEVO EJERCICIO (fijo)
    createWidget(widget.BUTTON, {
      x: px(30),
      y: DEVICE_HEIGHT - px(88),
      w: DEVICE_WIDTH - px(60),
      h: px(80),
      text: "NUEVO EJERCICIO",
      text_size: px(26),
      color: 0x000000,
      normal_color: 0x00FF00,
      press_color: 0x00AA00,
      radius: px(30),
      click_func: () => {
        push({ url: 'page/gt/home/exercise.page' });
      }
    });

    // 5. Crear modal (oculto inicialmente)
    createDeleteModal();
  },

  onDestroy() {
    pageContext = null;
    logger.log("Pantalla Resumen Destruida");
  }
}));

// =====================
// Funciones auxiliares
// =====================

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
    text_size: px(26),
    color: 0xFFFFFF,
    align_h: align.CENTER_H
  });
  
  // Botón X para cerrar
  pageState.modalGroup.createWidget(widget.BUTTON, {
    x: DEVICE_WIDTH - px(60),
    y: px(60),
    w: px(50),
    h: px(50),
    text: "X",
    text_size: px(32),
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
    text_size: px(24),
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

function autoSyncPendingSets() {
  const pendingJson = localStorage.getItem('pending_sync') || '[]';
  try {
    const pending = JSON.parse(pendingJson);
    if (Array.isArray(pending) && pending.length > 0) {
      syncPendingSets();
    }
  } catch (e) {
    logger.log("Error parseando pending_sync");
  }
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

/**
 * Muestra un mensaje temporal tipo toast
 */
function showToast(message) {
  logger.log(`Toast: ${message}`);
  // En ZeppOS no hay toast nativo, usamos un text temporal
  const toast = createWidget(widget.TEXT, {
    x: px(20),
    y: DEVICE_HEIGHT - px(120),
    w: DEVICE_WIDTH - px(40),
    h: px(40),
    text: message,
    text_size: px(16),
    color: 0x00FF00,
    align_h: align.CENTER_H
  });
  
  // Auto-ocultar después de 2 segundos
  setTimeout(() => {
    deleteWidget(toast);
  }, 2000);
}

/**
 * Sincroniza los sets pendientes con Supabase via BasePage
 */
function syncPendingSets() {
  logger.log("=== INICIANDO SINCRONIZACIÓN ===");
  
  if (!pageContext) {
    logger.log("pageContext no disponible");
    showToast("Error: Sin conexión");
    return;
  }
  
  // Leer cola de pendientes
  const pendingJson = localStorage.getItem('pending_sync') || '[]';
  let pending = [];
  try {
    pending = JSON.parse(pendingJson);
  } catch(e) {
    logger.log("Error parseando pending_sync");
    return;
  }
  
  if (pending.length === 0) {
    logger.log("No hay sets pendientes de sincronizar");
    showToast("No hay pendientes");
    return;
  }
  
  logger.log(`${pending.length} sets en cola de sincronización`);
  
  pageContext.request({
    method: 'SYNC_PENDING',
    params: { sets: pending }
  })
  .then((data) => {
    logger.log(`Respuesta sync: ${JSON.stringify(data)}`);
    
    if (data && data.status === "success") {
      logger.log(`✓ Sincronizados ${data.synced || 0} sets`);
      
      // Limpiar cola de pendientes exitosos
      if (data.failed && data.failed.length > 0) {
        // Mantener solo los que fallaron
        const remaining = pending.filter(s => data.failed.includes(s.localId));
        localStorage.setItem('pending_sync', JSON.stringify(remaining));
        showToast(`${data.synced} OK, ${data.failed.length} fallidos`);
      } else {
        // Todos sincronizados
        localStorage.setItem('pending_sync', '[]');
        showToast(`✓ ${data.synced} sincronizados`);
      }
      
      // Marcar como sincronizados en today_sets
      markSetsAsSynced(pending.map(s => s.localId));
      
      // Recargar página después de 1.5s para actualizar contador
      setTimeout(() => {
        replace({ url: 'page/gt/home/summary.page' });
      }, 1500);
      
    } else {
      logger.log(`Error: ${(data && data.msg) || 'desconocido'}`);
      showToast("Error en sincronización");
    }
  })
  .catch((error) => {
    logger.log(`✗ Error de comunicación: ${error}`);
    showToast("Error de conexión");
  });
}

/**
 * Marca múltiples sets como sincronizados
 */
function markSetsAsSynced(ids) {
  const setsJson = localStorage.getItem('today_sets') || '[]';
  try {
    const sets = JSON.parse(setsJson);
    ids.forEach(id => {
      const idx = sets.findIndex(s => s.id === id);
      if (idx >= 0) {
        sets[idx].synced = true;
      }
    });
    localStorage.setItem('today_sets', JSON.stringify(sets));
  } catch(e) {
    logger.log('Error marcando como sincronizados');
  }
}
