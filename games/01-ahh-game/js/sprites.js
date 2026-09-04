const IMG = {
  background:       "assets/images/Background.png",
  startBoxFrame:     "assets/images/Start_Box_Frame.png",
  logo:               "assets/images/Logo.png",
  startButton:       "assets/images/Start_Button.png",
  playAgainButton:   "assets/images/Play_Again_Button.png",

  femaleSelected:    "assets/images/Female_Selected.png",
  femaleUnselected:  "assets/images/Female_Unselected.png",
  maleSelected:      "assets/images/Male_Selected.png",
  maleUnselected:    "assets/images/Male_Unselected.png",

  redSelected:       "assets/images/Red_Selected.png",
  redUnselected:     "assets/images/Red_Unselected.png",
  greenSelected:     "assets/images/Green_Selected.png",
  greenUnselected:   "assets/images/Green_Unselected.png",
  blueSelected:      "assets/images/Blue_Selected.png",
  blueUnselected:    "assets/images/Blue_Unselected.png",
  blackSelected:     "assets/images/Black_Selected.png",
  blackUnselected:   "assets/images/Black_Unselected.png",
  yellowSelected:    "assets/images/Yellow_Selected.png",
  yellowUnselected:  "assets/images/Yellow_Unselected.png",
  purpleSelected:    "assets/images/Purple_Selected.png",
  purpleUnselected:  "assets/images/Purple_Unselected.png",

  femaleGreen:  "assets/images/female-selected-green.png",
  femaleBlue:   "assets/images/female-selected-blue.png",
  femaleBlack:  "assets/images/female-selected-black.png",
  femaleYellow: "assets/images/female-selected-yellow.png",
  femalePurple: "assets/images/female-selected-purple.png",
  maleGreen:    "assets/images/male-selected-green.png",
  maleBlue:     "assets/images/male-selected-blue.png",
  maleBlack:    "assets/images/male-selected-black.png",
  maleYellow:   "assets/images/male-selected-yellow.png",
  malePurple:   "assets/images/male-selected-purple.png",
};

function buildSpriteSets() {
  const poses = ["idle", "jump", "fall", "dizzy"];
  const colors = ["red", "green", "blue", "yellow", "purple", "black"];
  const chars = { female: "Female", male: "Male" };
  const sets = { female: {}, male: {} };

  for (const charKey in chars) {
    const prefix = chars[charKey];
    for (const color of colors) {
      const set = {};
      for (const pose of poses) {
        set[pose] = `assets/sprites/${prefix}_${pose}_${color}.svg`;
      }
      sets[charKey][color] = set;
    }
  }
  return sets;
}

const SPRITE_SETS = buildSpriteSets();

const FEMALE_BY_COLOR = {
  red:    IMG.femaleSelected,
  green:  IMG.femaleGreen,
  blue:   IMG.femaleBlue,
  black:  IMG.femaleBlack,
  yellow: IMG.femaleYellow,
  purple: IMG.femalePurple,
};
const MALE_BY_COLOR = {
  red:    IMG.maleSelected,
  green:  IMG.maleGreen,
  blue:   IMG.maleBlue,
  black:  IMG.maleBlack,
  yellow: IMG.maleYellow,
  purple: IMG.malePurple,
};

const COLOR_OPTIONS = [
  { id: "red",    label: "Red",    selectedImg: IMG.redSelected,    unselectedImg: IMG.redUnselected },
  { id: "green",  label: "Green",  selectedImg: IMG.greenSelected,  unselectedImg: IMG.greenUnselected },
  { id: "blue",   label: "Blue",   selectedImg: IMG.blueSelected,   unselectedImg: IMG.blueUnselected },
  { id: "black",  label: "Black",  selectedImg: IMG.blackSelected,  unselectedImg: IMG.blackUnselected },
  { id: "yellow", label: "Yellow", selectedImg: IMG.yellowSelected, unselectedImg: IMG.yellowUnselected },
  { id: "purple", label: "Purple", selectedImg: IMG.purpleSelected, unselectedImg: IMG.purpleUnselected },
];
