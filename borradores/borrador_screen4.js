import { createWidget, widget, push, align } from "@zos/ui"; 
import * as router from "@zos/router";
import { px } from "@zos/utils";
import { log as Logger } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";

import { 
  HEADER_STYLE,
  NEW_BUTTON_STYLE,
  SCROLL_CONTAINER_STYLE, 
  MODAL_OVERLAY_STYLE,
  MODAL_TEXT_STYLE,
  DELETE_BUTTON_STYLE,
  CLOSE_BUTTON_STYLE
} from "./summary.page.s.layout.js";

const logger = Logger.getLogger("LiftCloud-Summary");

const DUMMY_SETS = [
  { id: 1, name: "Press Banca", w: "60", r: "10" },
  { id: 2, name: "Sentadilla", w: "100", r: "5" },
  { id: 3, name: "Dominadas", w: "0", r: "12" },
  { id: 4, name: "Curl Bíceps", w: "15", r: "12" }
];

BasePage({
  state: {
    sets: DUMMY_SETS,
    modalGroup: null,
    itemToDeleteIndex: -1,
    scrollContainer: null
  },

  onInit() {
    logger.log("Pantalla Resumen Iniciada");
  },

  build() {
    // 1. Cabecera (Fecha)
    const header = createWidget(widget.TEXT, HEADER_STYLE);
    header.setProperty(widget.prop.TEXT, this.getTodayDate());

    // 2. Lista Scroll
    this.createList();

    // 3. Botón Nuevo
    createWidget(widget.BUTTON, {
      ...NEW_BUTTON_STYLE,
      click_func: () => {
        router.push({ url: 'page/gt/home/index.page' });
      }
    });

    // 4. Modal
    this.createModal();
  },

  getTodayDate() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  },

  createList() {
    this.state.scrollContainer = createWidget(widget.VIEW_CONTAINER, SCROLL_CONTAINER_STYLE);

    const rowH = px(60);
    const gap = px(12);
    const startX = px(20);
    const bubbleW = px(440); // DEVICE_WIDTH - 40
    
    this.state.sets.forEach((set, index) => {
      const yPos = index * (rowH + gap);
      const rowColor = this.getColorFromName(set.name);

      // A. Burbuja de Fondo (Única)
      this.state.scrollContainer.createWidget(widget.FILL_RECT, {
        x: startX,
        y: yPos,
        w: bubbleW,
        h: rowH,
        radius: px(18),
        color: rowColor
      });

      // B. Texto Nombre (Izquierda)
      this.state.scrollContainer.createWidget(widget.TEXT, {
        x: startX + px(20),
        y: yPos,
        w: px(200),
        h: rowH,
        text: set.name,
        color: 0x000000, // Negro
        text_size: px(24),
        align_v: align.CENTER_V,
        font_weight: 1 // Bold simulado
      });

      // C. Texto Detalles (Derecha)
      this.state.scrollContainer.createWidget(widget.TEXT, {
        x: startX + px(220),
        y: yPos,
        w: px(200),
        h: rowH,
        text: `${set.w}kg x ${set.r}`,
        color: 0x000000, // Negro
        text_size: px(24),
        align_h: align.RIGHT,
        align_v: align.CENTER_V
      });

      // D. Botón Invisible (Click / Hold)
      this.state.scrollContainer.createWidget(widget.BUTTON, {
        x: startX,
        y: yPos,
        w: bubbleW,
        h: rowH,
        radius: px(18),
        normal_alpha: 0,
        press_alpha: 50,
        press_color: 0x000000,
        
        click_func: () => { this.goToEdit(index); },
        longpress_func: () => { this.showDeleteModal(index); }
      });
    });

    // Espacio final extra para asegurar que el último item se ve bien al hacer scroll
    this.state.scrollContainer.createWidget(widget.FILL_RECT, {
        x: 0, 
        y: this.state.sets.length * (rowH + gap), 
        w: 10, 
        h: px(10), 
        color: 0
    });
  },

  getColorFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const PALETTE = [0xFFB3BA, 0xFFDFBA, 0xFFFFBA, 0xBAFFC9, 0xBAE1FF, 0xE6E6FA, 0xFFC0CB, 0x98FB98];
    const index = Math.abs(hash) % PALETTE.length;
    return PALETTE[index];
  },

  goToEdit(index) {
    const item = this.state.sets[index];
    router.push({
      url: 'page/gt/home/index.page',
      params: JSON.stringify({
        mode: 'edit',
        id: item.id,
        name: item.name,
        weight: item.w,
        reps: item.r
      })
    });
  },

  // Modal (Igual que antes)
  createModal() {
     this.state.modalGroup = createWidget(widget.GROUP, { x:0, y:0, w:px(480), h:px(480) });
     this.state.modalGroup.createWidget(widget.FILL_RECT, { ...MODAL_OVERLAY_STYLE, alpha: 220 });
     this.state.modalGroup.createWidget(widget.TEXT, MODAL_TEXT_STYLE);
     this.state.modalGroup.createWidget(widget.BUTTON, { ...CLOSE_BUTTON_STYLE, click_func: () => this.hideModal() });
     this.state.modalGroup.createWidget(widget.BUTTON, { ...DELETE_BUTTON_STYLE, click_func: () => this.deleteItem() });
     this.state.modalGroup.setProperty(widget.prop.VISIBLE, false);
  },
  showDeleteModal(index) {
    this.state.itemToDeleteIndex = index;
    this.state.modalGroup.setProperty(widget.prop.VISIBLE, true);
    this.state.modalGroup.setProperty(widget.prop.Z_INDEX, 99);
  },
  hideModal() {
    this.state.modalGroup.setProperty(widget.prop.VISIBLE, false);
  },
  deleteItem() {
    if(this.state.itemToDeleteIndex > -1) {
        this.state.sets.splice(this.state.itemToDeleteIndex, 1);
        router.replace({ url: 'page/gt/home/summary.page' });
    }
    this.hideModal();
  }
});