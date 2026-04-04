export const ICONS = {
  gear: {
    text: "⚙︎",
    image: "image/icons/gear.png"
  },
  edit: {
    text: "✏️",
    image: "image/icons/edit.png"
  },
  delete: {
    text: "🗑️",
    image: "image/icons/delete.png"
  },
  workout: {
    text: "🏋️",
    image: "image/icons/workout.png"
  }
};

export const ICON_IMAGE_FORMAT = "png";

export function getIconText(name) {
  return ICONS[name] ? ICONS[name].text : "";
}