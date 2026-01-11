import { createWidget, widget, prop, align } from "@zos/ui";
import { push } from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";

const logger = Logger.getLogger("LiftCloud-Exercise");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Lista de ejercicios disponibles
const EXERCISES = [
  "Press Banca",
  "Sentadilla",
  "Peso Muerto",
  "Dominadas",
  "Press Militar",
  "Curl Bíceps",
  "Extensiones Tríceps",
  "Remo con Barra",
  "Zancadas",
  "Elevaciones Laterales"
];

// Estado de la página
let pageState = {
  selectedIndex: 0,
  editMode: false,
  editId: null,
  dataArray: []
};

Page({
  onInit(params) {
    logger.log("Pantalla Ejercicio Iniciada");
    
    // Crear datos de ejemplo si no existen
    const existingSets = localStorage.getItem('today_sets');
    if (!existingSets || existingSets === '[]') {
      const demoSets = [
        { id: 1, name: "Press Banca", weight: 60, reps: 10, rest: 95, timestamp: Date.now() - 3600000 },
        { id: 2, name: "Press Banca", weight: 62.5, reps: 8, rest: 90, timestamp: Date.now() - 3500000 },
        { id: 3, name: "Sentadilla", weight: 100, reps: 5, rest: 120, timestamp: Date.now() - 3000000 },
        { id: 4, name: "Dominadas", weight: 0, reps: 12, rest: 60, timestamp: Date.now() - 2500000 },
        { id: 5, name: "Curl Bíceps", weight: 15, reps: 12, rest: 45, timestamp: Date.now() - 2000000 }
      ];
      localStorage.setItem('today_sets', JSON.stringify(demoSets));
      logger.log("Datos de ejemplo creados");
    }
    
    // Preparar array de datos para SCROLL_LIST
    pageState.dataArray = EXERCISES.map((name, i) => ({
      name: name,
      index: i
    }));
    
    // Verificar si venimos en modo edición
    if (params && typeof params === 'string' && params.length > 2) {
      try {
        const data = JSON.parse(params);
        if (data && data.mode === 'edit') {
          pageState.editMode = true;
          pageState.editId = data.id;
          const idx = EXERCISES.indexOf(data.name);
          if (idx >= 0) pageState.selectedIndex = idx;
        }
      } catch(e) {
        // Ignorar errores de parsing - navegación normal sin params
        logger.log("Navegación sin params de edición");
      }
    }
  },

  build() {
    logger.log(`Screen: ${DEVICE_WIDTH}x${DEVICE_HEIGHT}`);
    
    const LIST_HEIGHT = DEVICE_HEIGHT - px(100);
    const ITEM_HEIGHT = px(50);
    const CENTER_Y = LIST_HEIGHT / 2;
    
    // Usar SCROLL_LIST para la lista de ejercicios
    createWidget(widget.SCROLL_LIST, {
      x: px(10),
      y: px(10),
      w: DEVICE_WIDTH - px(20),
      h: LIST_HEIGHT,
      item_space: px(8),
      snap_to_center: true,
      item_config: [
        {
          type_id: 1,
          item_height: ITEM_HEIGHT,
          item_bg_color: 0x000000,
          item_bg_radius: 0,
          text_view: [
            {
              x: px(10),
              y: px(10),
              w: DEVICE_WIDTH - px(50),
              h: px(30),
              key: "name",
              color: 0xFFFFFF,
              text_size: px(24)
            }
          ],
          text_view_count: 1
        }
      ],
      item_config_count: 1,
      data_array: pageState.dataArray,
      data_count: pageState.dataArray.length,
      item_focus_change_func: (list, index, isFocus) => {
        if (isFocus) {
          pageState.selectedIndex = index;
          logger.log(`Ejercicio en foco: ${EXERCISES[index]}`);
        }
      },
      data_type_config: [
        {
          start: 0,
          end: pageState.dataArray.length - 1,
          type_id: 1
        }
      ],
      data_type_config_count: 1
    });
    
    // Indicador de selección: líneas horizontales en el centro
    const indicatorY = px(10) + CENTER_Y - ITEM_HEIGHT/2;
    
    // Línea superior
    createWidget(widget.FILL_RECT, {
      x: px(10),
      y: indicatorY - px(2),
      w: DEVICE_WIDTH - px(20),
      h: px(2),
      color: 0x00AAFF
    });
    
    // Línea inferior
    createWidget(widget.FILL_RECT, {
      x: px(10),
      y: indicatorY + ITEM_HEIGHT,
      w: DEVICE_WIDTH - px(20),
      h: px(2),
      color: 0x00AAFF
    });

    // Botón SELECCIONAR abajo
    createWidget(widget.BUTTON, {
      x: px(20),
      y: DEVICE_HEIGHT - px(80),
      w: DEVICE_WIDTH - px(40),
      h: px(65),
      text: pageState.editMode ? 'CAMBIAR' : 'SELECCIONAR',
      text_size: px(22),
      color: 0x000000,
      normal_color: 0x00AAFF,
      press_color: 0x005599,
      radius: px(16),
      click_func: () => {
        selectExercise(EXERCISES[pageState.selectedIndex]);
      }
    });
  },

  onDestroy() {
    logger.log("Pantalla Ejercicio Destruida");
  }
});

function selectExercise(exerciseName) {
  logger.log(`Ejercicio seleccionado: ${exerciseName}`);
  
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
