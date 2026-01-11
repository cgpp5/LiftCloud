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
    if (params) {
      try {
        const data = JSON.parse(params);
        if (data.mode === 'edit') {
          pageState.editMode = true;
          pageState.editId = data.id;
          const idx = EXERCISES.indexOf(data.name);
          if (idx >= 0) pageState.selectedIndex = idx;
        }
      } catch(e) {
        logger.error("Error parsing params:", e);
      }
    }
  },

  build() {
    logger.log(`Screen: ${DEVICE_WIDTH}x${DEVICE_HEIGHT}`);
    
    // Usar SCROLL_LIST para la lista de ejercicios
    createWidget(widget.SCROLL_LIST, {
      x: px(10),
      y: px(10),
      w: DEVICE_WIDTH - px(20),
      h: DEVICE_HEIGHT - px(100),
      item_space: px(8),
      item_config: [
        {
          type_id: 1,
          item_height: px(60),
          item_bg_color: 0x333333,
          item_bg_radius: px(12),
          text_view: [
            {
              x: px(15),
              y: px(0),
              w: DEVICE_WIDTH - px(60),
              h: px(60),
              key: "name",
              color: 0xFFFFFF,
              text_size: px(24),
              align_v: align.CENTER_V
            }
          ]
        }
      ],
      item_config_count: 1,
      data_array: pageState.dataArray,
      data_count: pageState.dataArray.length,
      item_click_func: (list, index) => {
        logger.log(`Ejercicio clickeado: ${EXERCISES[index]}`);
        pageState.selectedIndex = index;
        selectExercise(EXERCISES[index]);
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
