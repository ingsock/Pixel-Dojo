"use strict";

function makeColorChapter() {
  const lessons = [
    {
      title: "The Red Gate",
      source: "openverse_026",
      equations: ["r", "0", "0"],
      goal: "Let only the red part of the image pass through.",
      explore: "The three output fields become the new red, green, and blue channels. Each field can use r, g, and b from the input pixel.",
    },
    {
      title: "The Green Lantern With No Lantern",
      source: "openverse_001",
      equations: ["0", "g", "0"],
      goal: "Reveal only the green channel.",
      explore: "Red, green, and blue are separate measurements before they become one visible color. Today the middle cup is the interesting one.",
    },
    {
      title: "Blue Soup, Cold Spoon",
      source: "openverse_022",
      equations: ["0", "0", "b"],
      goal: "Reveal only the blue channel.",
      explore: "The blue channel hides in bright skies, shadows, and other suspiciously calm places. The spoon refuses to elaborate.",
    },
    {
      title: "The Mirror Trades Hats",
      source: "openverse_023",
      equations: ["b", "g", "r"],
      goal: "Swap red and blue while leaving green alone.",
      explore: "An output channel does not have to copy the matching input channel. The cups can trade hats if the equation says so.",
    },
    {
      title: "The Three Bowls Agree",
      source: "openverse_028",
      equations: ["(r + g + b) / 3", "(r + g + b) / 3", "(r + g + b) / 3"],
      goal: "Build a simple grayscale by averaging RGB.",
      explore: "When all three output channels are equal, hue disappears. A committee of three colors is still a committee.",
    },
    {
      title: "The Eye's Uneven Scales",
      source: "openverse_031",
      equations: ["r * 0.299 + g * 0.587 + b * 0.114", "r * 0.299 + g * 0.587 + b * 0.114", "r * 0.299 + g * 0.587 + b * 0.114"],
      goal: "Build perceptual grayscale using brightness, not a plain average.",
      explore: "The eye does not weigh red, green, and blue equally. Green usually carries the largest share of perceived brightness.",
    },
    {
      title: "The Negative Teacup",
      source: "openverse_019",
      equations: ["255 - r", "255 - g", "255 - b"],
      goal: "Invert every color channel.",
      explore: "Channel values live from 0 to 255. To find a color's opposite, measure from the far wall back toward the value.",
    },
    {
      title: "Morning Adds Forty",
      source: "openverse_005",
      equations: ["r + 40", "g + 40", "b + 40"],
      goal: "Brighten the image by adding to every channel.",
      explore: "Adding the same number to all channels lifts the whole image. Values above 255 are clipped by the block.",
    },
    {
      title: "The Dim Attic of Pixels",
      source: "openverse_030",
      equations: ["r * 0.55", "g * 0.55", "b * 0.55"],
      goal: "Darken the image by scaling every channel down.",
      explore: "Multiplication changes distance from black. Half a candle is still a candle, unless it is accounting.",
    },
    {
      title: "Red Drum, Quiet Room",
      source: "openverse_035",
      equations: ["r * 1.35", "g * 0.8", "b * 0.8"],
      goal: "Make red stronger while the other channels step back.",
      explore: "Color bias can be built by scaling channels differently. The red drum is not subtle, but it is punctual.",
    },
    {
      title: "The Cyan Window",
      source: "openverse_040",
      equations: ["0", "g", "b"],
      goal: "Build cyan by removing red.",
      explore: "Cyan is what remains when green and blue stay together and red is asked to wait outside with the umbrella.",
    },
    {
      title: "Magenta Without Ceremony",
      source: "openverse_036",
      equations: ["r", "0", "b"],
      goal: "Build magenta by removing green.",
      explore: "Some colors are absences wearing a bright jacket. Magenta is red and blue agreeing not to invite green.",
    },
    {
      title: "Yellow Makes a Small Speech",
      source: "openverse_041",
      equations: ["r", "g", "0"],
      goal: "Build yellow by removing blue.",
      explore: "Red plus green makes yellow in light. Paint disagrees, but paint has its own paperwork.",
    },
    {
      title: "The Contrast Bellows",
      source: "openverse_044",
      equations: ["(r - 128) * 1.45 + 128", "(g - 128) * 1.45 + 128", "(b - 128) * 1.45 + 128"],
      goal: "Increase contrast around the midpoint.",
      explore: "To stretch contrast, move each value away from 128, then put the midpoint back. The bellows are dramatic but useful.",
    },
    {
      title: "The Fog Remembers 128",
      source: "openverse_046",
      equations: ["(r - 128) * 0.55 + 128", "(g - 128) * 0.55 + 128", "(b - 128) * 0.55 + 128"],
      goal: "Lower contrast by pulling values toward the midpoint.",
      explore: "Less contrast means shadows and highlights move toward the same quiet center. The fog has excellent filing habits.",
    },
    {
      title: "The Hard-Light Almond",
      source: "openverse_057",
      equations: ["abs(r - 128) * 2", "abs(g - 128) * 2", "abs(b - 128) * 2"],
      goal: "Fold each channel around the midpoint using absolute value.",
      explore: "abs(value) removes the sign. Fold the channel around 128 and stretch it; the almond is not involved but insists on credit.",
    },
    {
      title: "The Maximum Gong",
      source: "openverse_058",
      equations: ["max(r, g, b)", "max(r, g, b)", "max(r, g, b)"],
      goal: "Turn each pixel into its strongest channel value.",
      explore: "max chooses the largest value. If all outputs receive that winner, the loudest channel rings the whole gong.",
    },
    {
      title: "The Minimum Whisper",
      source: "openverse_063",
      equations: ["min(r, g, b)", "min(r, g, b)", "min(r, g, b)"],
      goal: "Turn each pixel into its weakest channel value.",
      explore: "min chooses the smallest value. Sometimes the quietest channel is carrying the map in its sock.",
    },
    {
      title: "Sepia Borrows a Coat",
      source: "openverse_068",
      equations: ["r * 0.393 + g * 0.769 + b * 0.189", "r * 0.349 + g * 0.686 + b * 0.168", "r * 0.272 + g * 0.534 + b * 0.131"],
      goal: "Build a sepia-style color mix from RGB weights.",
      explore: "Each output can combine all three inputs. Old photographs are not old because of math, but math helps them act the part.",
    },
    {
      title: "The Color Difference Scroll",
      source: "openverse_069",
      equations: ["abs(r - g)", "abs(g - b)", "abs(b - r)"],
      goal: "Show differences between neighboring color channels.",
      explore: "Instead of copying channels, compare them. Difference reveals where colors disagree, like a tiny parliament in a teacup.",
    },
    {
      title: "The Half-Lit Value Shrine",
      source: "openverse_002",
      steps: [
        { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H", "S", "V / 2"], ["H", "S", "V / 2"]) },
      ],
      goal: "Use HSV to dim brightness without moving hue or saturation.",
      explore: "The color keeps its address and costume, but the lamp in its hand becomes smaller.",
    },
    {
      title: "The Hue Wheel Sneezes",
      source: "openverse_003",
      steps: [
        { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H + 45", "S", "V"], ["H + 45", "S", "V"]) },
      ],
      goal: "Rotate hue in HSV while preserving saturation and value.",
      explore: "Nothing gets brighter. Nothing gets grayer. The colors simply move to neighboring doors.",
    },
    {
      title: "The Saturation Monastery",
      source: "openverse_006",
      steps: [
        { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H", "S * 0.35", "V"], ["H", "S * 0.35", "V"]) },
      ],
      goal: "Lower saturation in HSV without changing brightness.",
      explore: "The lantern keeps its flame, but the dye in the glass grows shy.",
    },
    {
      title: "The Intensity Stair",
      source: "openverse_007",
      steps: [
        { params: formatColorParams("HSI", "hsi", ["H", "S", "I"], ["H", "S", "I + 35"], ["H", "S", "I + 35"]) },
      ],
      goal: "Lift intensity in HSI while hue and saturation stand still.",
      explore: "The same color climbs a step. Its shadow complains, but follows.",
    },
    {
      title: "Cyan Ink in the Rain Barrel",
      source: "openverse_009",
      steps: [
        { params: formatColorParams("CMY", "cmy", ["C", "M", "Y"], ["C + 60", "M", "Y"], ["C + 60", "M", "Y"]) },
      ],
      goal: "Push cyan ink in CMY space.",
      explore: "One ink grows heavier, and the red light behind it has less room to breathe.",
    },
    {
      title: "The Key Plate Descends",
      source: "openverse_010",
      steps: [
        { params: formatColorParams("CMYK", "cmyk", ["C", "M", "Y", "K"], ["C", "M", "Y", "K + 45"], ["C", "M", "Y", "K + 45"]) },
      ],
      goal: "Darken with CMYK key while leaving chromatic inks alone.",
      explore: "The colored inks do not move. The black plate lowers like a careful ceiling.",
    },
    {
      title: "Overripe Lantern, Sharpened by Math",
      source: "openverse_011",
      steps: [
        { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H", "S * 1.45", "V"], ["H", "S * 1.45", "V"]) },
        { params: equationColorParams("(r - 128) * 1.18 + 128", "(g - 128) * 1.18 + 128", "(b - 128) * 1.18 + 128") },
      ],
      goal: "Chain saturation growth with RGB contrast.",
      explore: "First the dyes shout. Then the midpoint stretches the room until the shout has corners.",
    },
    {
      title: "The Warm Stone After Rain",
      source: "openverse_012",
      steps: [
        { params: formatColorParams("Grayscale", "gray", ["Gray"], ["Gray"], ["Gray"]) },
        { params: equationColorParams("r * 1.12 + 22", "g * 0.98 + 8", "b * 0.82") },
      ],
      goal: "Chain grayscale into a warm RGB tint.",
      explore: "First all colors become one stone. Then the stone remembers a sunset it never attended.",
    },
    {
      title: "The Ink Then Moon Trick",
      source: "openverse_014",
      steps: [
        { params: formatColorParams("CMY", "cmy", ["C", "M", "Y"], ["C + 35", "M", "Y"], ["C + 35", "M", "Y"]) },
        { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H", "S", "V * 0.82"], ["H", "S", "V * 0.82"]) },
      ],
      goal: "Chain CMY ink bias with HSV value dimming.",
      explore: "The first mask drinks red from the paper. The second mask turns down the moon.",
    },
    {
      title: "Three Masks Before Breakfast",
      source: "openverse_017",
      steps: [
        { params: equationColorParams("b", "g", "r") },
        { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H + 90", "S", "V"], ["H + 90", "S", "V"]) },
        { params: equationColorParams("r * 1.08", "g", "b * 0.86") },
      ],
      goal: "Solve a three-step color chain across RGB and HSV.",
      explore: "First two masks trade faces. Then the wheel turns. Last, the breakfast fire chooses a favorite side.",
    },
  ];
  const masterLines = [
    [
      "At the red gate, Master Bitshan places one finger over each eye and declares the third eye is mostly paperwork.",
      "Three little rivers enter the block. Only the warm river is allowed to remember its name.",
      "The mountain hums: absence is also an equation, provided it is written politely.",
    ],
    [
      "The master hangs a green bell in the fog and asks why the other bells keep pretending to ring.",
      "Do not chase the whole image. Listen for the middle thread and let the side threads fall asleep.",
      "A cucumber once tried to explain this lesson. It was technically correct and emotionally unavailable.",
    ],
    [
      "Master Bitshan pours the sky into a cup and says the cup is not blue; it is borrowing a number.",
      "The target is cold because two fires have been removed, not because winter learned arithmetic.",
      "Some pixels hide their ocean in the last room of the house.",
    ],
    [
      "The master swaps two teacups without moving the table. The table files no complaint.",
      "One voice stays where it is. Two voices trade masks and pretend this was always the ceremony.",
      "If the butterfly looks surprised, remember that butterflies have terrible version control.",
    ],
    [
      "Three bowls sit before you. Master Bitshan says they will become one bowl when they stop arguing.",
      "The target has no favorite hue, only a single compromise repeated three times.",
      "A council of colors is fair only when every chair is the same height.",
    ],
    [
      "The master weighs light on a crooked scale and smiles when green makes the table creak.",
      "The eye is not a judge; it is a biased clerk with excellent handwriting.",
      "Do not average the crowd. Ask which color the eye secretly overpays.",
    ],
    [
      "Master Bitshan turns the teacup inside out. Somehow the tea remains outside the cup, which is rude.",
      "Every channel walks away from the far wall carrying its own shadow.",
      "The opposite of a number is not anger. It is distance counted backward.",
    ],
    [
      "The morning lesson begins with a window opening in all three rooms at once.",
      "Nothing changes its shape. Everything simply stands a little closer to white.",
      "The sun is just addition with theatrical timing.",
    ],
    [
      "Master Bitshan lowers the attic lamp until the dust begins speaking in fractions.",
      "All colors keep their ratios, but each one takes smaller steps toward the viewer.",
      "A candle cut in half is still a candle; it merely negotiates with darkness.",
    ],
    [
      "A red drum sounds in a quiet room. The other instruments bow and pretend it was their idea.",
      "One channel grows taller while its companions remove their shoes.",
      "The master warns that confidence and clipping are cousins who should not share soup.",
    ],
    [
      "Master Bitshan opens a cyan window and the red wind refuses to enter.",
      "Two channels make a pact in the doorway. The missing one is the shape of the lesson.",
      "Sometimes a color is not built; it is what remains after a guest leaves early.",
    ],
    [
      "The master writes magenta on paper with invisible green ink, then denies owning a pen.",
      "Two lanterns remain. The middle lantern becomes a hole in the sentence.",
      "Absence wears bright clothes when red and blue split the rent.",
    ],
    [
      "A yellow speech rises from the floorboards after blue is asked to wait outside.",
      "The target glows like two witnesses agreeing too quickly.",
      "Paint may disagree with light, but today light has the chalk.",
    ],
    [
      "Master Bitshan places a tiny hinge at the center of brightness and stretches the room from there.",
      "Near the middle, little happens. Far from the middle, the pixels become dramatic.",
      "The bellows do not invent air; they exaggerate the air already trapped inside.",
    ],
    [
      "The fog remembers the center and invites every loud pixel to sit closer to it.",
      "Shadows and highlights walk toward the same address, muttering about rent.",
      "The mountain becomes quiet when distances shrink.",
    ],
    [
      "Master Bitshan folds a ribbon through the middle of the world and doubles the crease.",
      "Both sides of the center become the same kind of distance after the sign is swallowed.",
      "An almond is mentioned for legal reasons. It contributes nothing.",
    ],
    [
      "The maximum gong rings only for the loudest channel, then makes everyone repeat the note.",
      "One value wins the pixel. The other two stand nearby wearing ceremonial hats.",
      "The master says strength is simple when you ignore nuance. This is not life advice.",
    ],
    [
      "The minimum whisper chooses the quietest channel and gives it the whole stage.",
      "The dimmest voice becomes the shared voice; the bright voices must practice humility.",
      "A floorboard can teach more about a room than the chandelier, if you listen downward.",
    ],
    [
      "Master Bitshan lends the photograph an old coat stitched from three borrowed weights.",
      "No channel travels alone here. Each output is a committee with sepia-colored minutes.",
      "The past is not brown; it is a rumor produced by uneven multiplication.",
    ],
    [
      "The final scroll listens only to disagreements between neighboring colors.",
      "Where channels resemble each other, the room grows quiet. Where they quarrel, lanterns appear.",
      "Master Bitshan closes the lesson with a spoon, a compass, and no useful explanation.",
    ],
    [
      "Master Bitshan dims a shrine by lowering no candle you can see.",
      "The hue keeps its sandals. The saturation keeps its hat. Only the small sun in the pocket shrinks.",
      "Brightness is sometimes a room, sometimes a variable, and sometimes a monk refusing breakfast.",
    ],
    [
      "The master spins a color wheel and blames the sneeze on geometry.",
      "The target changes clothes without gaining weight or losing sleep.",
      "A hue can walk in circles for years and still call it progress.",
    ],
    [
      "Master Bitshan sends the dye to a monastery where loud colors must whisper.",
      "The lamps are not dimmer. The glass has simply stopped bragging.",
      "Saturation is peacock arithmetic, minus most of the peacock.",
    ],
    [
      "The master points to a staircase that only brightness can climb.",
      "Hue stays seated. Saturation folds its hands. Intensity steals the shoes.",
      "A color may rise without changing its name, which is why bureaucracy fears dawn.",
    ],
    [
      "A rain barrel fills with cyan ink, and the red light starts looking for a lawyer.",
      "This is not addition to red. It is ink standing in red's doorway.",
      "Subtractive color is a polite theft wearing waterproof boots.",
    ],
    [
      "The key plate descends with the solemnity of a very square eclipse.",
      "Colored inks keep their gossip. The black ink handles the weather.",
      "When K grows, the room does not change opinions; it changes curtains.",
    ],
    [
      "Master Bitshan asks the dye to shout, then asks the walls to stand farther apart.",
      "One block fattens color. The next block stretches distance from the middle.",
      "Two small spells in a row can look like one large spell with better manners.",
    ],
    [
      "The photograph becomes stone, then remembers it once dreamed in amber.",
      "First the chorus becomes one note. Then the note is warmed over a strange spoon.",
      "A sunset applied after silence is still a sunset, but now it has excellent posture.",
    ],
    [
      "The first mask drinks red through cyan ink; the second lowers the moon behind it.",
      "One space steals a color. Another space dims the whole stage.",
      "The master calls this a duet. The pixels call it paperwork with lanterns.",
    ],
    [
      "Three masks arrive before breakfast, each pretending to be the first mask.",
      "A swap, a wheel, and a small favoritism walk into the same pixel.",
      "Master Bitshan serves tea to the pipeline and refuses to explain the spoon.",
    ],
  ];

  const colorChapters = lessons.map((lesson, index) => ({
    title: lesson.title,
    belt: `Colors ${index + 1}/30`,
    source: lesson.source,
    tools: ["color"],
    solution: colorLessonSolution(lesson),
    unlockAfter: [],
    lines: index === 0
      ? [
        "You climb to the mountain dojo. Master Bitshan looks at the image, then at you: To understand what you are, you must understand what you see.",
        "Rules of the color block: write one equation for Out R, one for Out G, and one for Out B. Begin with r, g, b, arithmetic, and small helpers like min, max, abs, and clamp.",
        masterLines[index][2],
      ]
      : masterLines[index],
    hints: makeCrypticHints(lesson, index),
  }));

  const affineLessons = [
    {
      title: "Right Step on Stone",
      source: "openverse_013",
      steps: [{ params: { a: 1, b: 0, c: 0, d: 1, e: 18, f: 0 } }],
      goal: "Translate the image to the right using the affine matrix.",
      explore: "In this matrix, e and f are translation offsets in x and y.",
    },
    {
      title: "Left Step Through Mist",
      source: "openverse_018",
      steps: [{ params: { a: 1, b: 0, c: 0, d: 1, e: -18, f: 0 } }],
      goal: "Translate the image to the left.",
      explore: "Negative e moves the sampling center left.",
    },
    {
      title: "Climb the Bamboo Stair",
      source: "openverse_020",
      steps: [{ params: { a: 1, b: 0, c: 0, d: 1, e: 0, f: -16 } }],
      goal: "Shift the image upward using f.",
      explore: "Translation can move x and y independently.",
    },
    {
      title: "Descend to Lantern Alley",
      source: "openverse_021",
      steps: [{ params: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 16 } }],
      goal: "Shift the image downward.",
      explore: "Positive f moves the frame down.",
    },
    {
      title: "Twelve Degrees Left",
      source: "openverse_024",
      steps: [{ params: rotateAffine(-12) }],
      goal: "Rotate the image slightly counterclockwise.",
      explore: "Rotation fills a, b, c, and d with sine and cosine.",
    },
    {
      title: "Rotate Then Step",
      source: "openverse_033",
      steps: [
        { params: rotateAffine(12) },
        { params: { a: 1, b: 0, c: 0, d: 1, e: 18, f: 0 } },
      ],
      goal: "Chain two affine nodes: rotate first, then translate.",
      explore: "Order matters; matrix-like transforms are not commutative in pipelines.",
    },
    {
      title: "Step Then Rotate",
      source: "openverse_034",
      steps: [
        { params: { a: 1, b: 0, c: 0, d: 1, e: 18, f: 0 } },
        { params: rotateAffine(12) },
      ],
      goal: "Chain affine nodes in the opposite order.",
      explore: "Applying the same transforms in a different order gives a different target.",
    },
    {
      title: "Shear Then Climb",
      source: "openverse_038",
      steps: [
        { params: { a: 1, b: 0, c: 0.22, d: 1, e: 0, f: 0 } },
        { params: { a: 1, b: 0, c: 0, d: 1, e: 0, f: -16 } },
      ],
      goal: "Apply shear before vertical translation.",
      explore: "Changing skew first produces a different alignment than moving first.",
    },
    {
      title: "Climb Then Shear",
      source: "openverse_030",
      steps: [
        { params: { a: 1, b: 0, c: 0, d: 1, e: 0, f: -16 } },
        { params: { a: 1, b: 0, c: 0.22, d: 1, e: 0, f: 0 } },
      ],
      goal: "Apply vertical translation before shear.",
      explore: "The same two operations in reverse order should no longer match lesson 8.",
    },
    {
      title: "Mirror Then Drift",
      source: "openverse_037",
      steps: [
        { params: { a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
        { params: { a: 1, b: 0, c: 0, d: 1, e: 18, f: 0 } },
      ],
      goal: "Combine reflection with translation.",
      explore: "Reflection changes orientation, then translation repositions the reflected frame.",
    },
    {
      title: "Rotate, Shear, Drift",
      source: "openverse_042",
      steps: [
        { params: rotateAffine(-12) },
        { params: { a: 1, b: 0, c: 0.22, d: 1, e: 0, f: 0 } },
        { params: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 16 } },
      ],
      goal: "Solve a three-step affine pipeline with rotation, shear, and translation.",
      explore: "Compound transforms stack orientation, skew, and position into one target.",
    },
    {
      title: "Mirror, Rotate, Step",
      source: "openverse_027",
      steps: [
        { params: { a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
        { params: rotateAffine(12) },
        { params: { a: 1, b: 0, c: 0, d: 1, e: 18, f: 0 } },
      ],
      goal: "Combine reflection, rotation, and translation in sequence.",
      explore: "By this stage, you should read each affine stage as a geometric sentence.",
    },
    {
      title: "Zoom, Rotate, Counterstep",
      source: "openverse_039",
      steps: [
        { params: { a: 1.12, b: 0, c: 0, d: 1.12, e: 0, f: 0 } },
        { params: rotateAffine(-12) },
        { params: { a: 1, b: 0, c: 0, d: 1, e: -18, f: 0 } },
      ],
      goal: "Combine scale, rotation, and a balancing translation.",
      explore: "Scale and rotation amplify positioning mistakes, so translation becomes precise work.",
    },
    {
      title: "Step, Step, Shear",
      source: "openverse_025",
      steps: [
        { params: { a: 1, b: 0, c: 0, d: 1, e: 18, f: 0 } },
        { params: { a: 1, b: 0, c: 0, d: 1, e: 0, f: -16 } },
        { params: { a: 1, b: 0, c: 0.22, d: 1, e: 0, f: 0 } },
      ],
      goal: "Chain two translations then shear.",
      explore: "This lesson isolates how repeated movement accumulates before deformation.",
    },
    {
      title: "Shear, Mirror, Rotate",
      source: "openverse_029",
      steps: [
        { params: { a: 1, b: 0, c: 0.22, d: 1, e: 0, f: 0 } },
        { params: { a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
        { params: rotateAffine(12) },
      ],
      goal: "Compose skew, reflection, and rotation into one path.",
      explore: "At this depth, predicting intermediate orientation is the core skill.",
    },
    {
      title: "Final Matrix Kata",
      source: "openverse_032",
      steps: [
        { params: { a: 1, b: 0, c: 0, d: 1, e: -18, f: 0 } },
        { params: { a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
        { params: { a: 1.12, b: 0, c: 0.22, d: 1.12, e: 0, f: 16 } },
      ],
      goal: "Master a full three-stage affine compound transform.",
      explore: "Use all your matrix instincts: translation, reflection, anisotropic-style skew-scale, and final framing.",
    },
  ];

  const affineChapters = affineLessons.map((lesson, index) => ({
    title: lesson.title,
    belt: `Affine ${index + 1}/15`,
    source: lesson.source,
    tools: ["affine"],
    solution: graphFromSteps((Array.isArray(lesson.steps) ? lesson.steps : []).map((step) => ({ type: "affine", params: step.params }))),
    unlockAfter: [],
    lines: [
      `Master Bitshan opens the matrix ledger for lesson ${index + 1}.`,
      lesson.explore,
      "Write the six affine terms carefully: a, b, c, d shape the grid, while e and f slide it.",
    ],
    hints: [
      lesson.goal,
      lesson.explore,
      "Try one affine node at a time and match the target by comparing position, tilt, and rotation before scoring.",
    ],
  }));

  const kernelLessons = [
    {
      title: "Identity: The Mirror Rests",
      source: "openverse_043",
      steps: [{ type: "kernel", params: { size: 3, values: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], normalize: false, scale: 1, bias: 0 } }],
      goal: "Apply the identity kernel to see the original image unchanged.",
      explore: "The identity kernel at the center; zeros everywhere else. No transformation occurs.",
    },
    {
      title: "The Gentle Blur",
      source: "openverse_045",
      steps: [{ type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } }],
      goal: "Apply a weighted blur kernel to smooth the image.",
      explore: "The center pixel is weighted heaviest; neighbors contribute softer influence.",
    },
    {
      title: "The Sharp Edges Wake",
      source: "openverse_047",
      steps: [{ type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } }],
      goal: "Apply a sharpen kernel to enhance edges.",
      explore: "The center is amplified while neighbors are subtracted. The image develops hard boundaries.",
    },
    {
      title: "The Edge Detection Lamp",
      source: "openverse_049",
      steps: [{ type: "kernel", params: { size: 3, values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], normalize: false, scale: 0.55, bias: 128 } }],
      goal: "Apply an edge detection kernel to find boundaries.",
      explore: "All neighbors are subtracted from the amplified center. Edges appear bright; flat areas vanish.",
    },
    {
      title: "The Embossed Relief",
      source: "openverse_051",
      steps: [{ type: "kernel", params: { size: 3, values: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], normalize: false, scale: 0.72, bias: 128 } }],
      goal: "Apply an emboss kernel to create a 3D relief effect.",
      explore: "Diagonal weighting creates the illusion of depth. Light sources appear directional.",
    },
    {
      title: "Blur Then Sharpen",
      source: "openverse_052",
      steps: [
        { type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } },
      ],
      goal: "Apply blur then sharpen in sequence.",
      explore: "Smoothing first, then enhancement. The blur recovers detail that was lost.",
    },
    {
      title: "Sharpen Then Blur",
      source: "openverse_053",
      steps: [
        { type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } },
      ],
      goal: "Apply sharpen then blur in reverse order.",
      explore: "Enhancement first becomes overwhelmed by smoothing. The order inverts the effect.",
    },
    {
      title: "Edges Then Softened",
      source: "openverse_054",
      steps: [
        { type: "kernel", params: { size: 3, values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], normalize: false, scale: 0.55, bias: 128 } },
        { type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } },
      ],
      goal: "Detect edges then smooth them.",
      explore: "Edges are found, then diffused. Harsh lines become whispers.",
    },
    {
      title: "Softened Then Edges",
      source: "openverse_055",
      steps: [
        { type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], normalize: false, scale: 0.55, bias: 128 } },
      ],
      goal: "Smooth the image then find its edges.",
      explore: "Blurred regions produce softer, broader edges. Preprocessing changes what is found.",
    },
    {
      title: "Relief Then Sharpened",
      source: "openverse_056",
      steps: [
        { type: "kernel", params: { size: 3, values: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], normalize: false, scale: 0.72, bias: 128 } },
        { type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } },
      ],
      goal: "Apply emboss then sharpen the result.",
      explore: "3D relief is enhanced further. Light and shadow become more dramatic.",
    },
    {
      title: "Blur, Sharpen, Blur Again",
      source: "openverse_059",
      steps: [
        { type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } },
      ],
      goal: "Chain three kernels: blur, sharpen, blur.",
      explore: "Multiple passes create compound effects. Smoothing then enhancement then smoothing produces unique detail.",
    },
    {
      title: "Edges, Blur, Then Sharp",
      source: "openverse_060",
      steps: [
        { type: "kernel", params: { size: 3, values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], normalize: false, scale: 0.55, bias: 128 } },
        { type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } },
      ],
      goal: "Detect edges, then smooth them, then sharpen.",
      explore: "Post-processing an edge map reveals different features than detection alone.",
    },
    {
      title: "Relief, Sharpen, Edges",
      source: "openverse_061",
      steps: [
        { type: "kernel", params: { size: 3, values: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], normalize: false, scale: 0.72, bias: 128 } },
        { type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], normalize: false, scale: 0.55, bias: 128 } },
      ],
      goal: "Chain relief, sharpen, then edge detection.",
      explore: "The 3D illusion is sharpened before edges are found. Combination reveals structural details.",
    },
    {
      title: "Blur, Emboss, Then Sharp",
      source: "openverse_062",
      steps: [
        { type: "kernel", params: { size: 3, values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], normalize: false, scale: 0.72, bias: 128 } },
        { type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } },
      ],
      goal: "Smooth, then emboss, then sharpen.",
      explore: "Embossing after blur creates a softer 3D effect. Final sharpening adds crispness.",
    },
    {
      title: "Sharpen, Edges, Relief",
      source: "openverse_064",
      steps: [
        { type: "kernel", params: { size: 3, values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 } },
        { type: "kernel", params: { size: 3, values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], normalize: false, scale: 0.55, bias: 128 } },
        { type: "kernel", params: { size: 3, values: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], normalize: false, scale: 0.72, bias: 128 } },
      ],
      goal: "Chain sharpen, edge detection, then emboss.",
      explore: "Starting with enhancement then detecting edges in a sharpened image, finally applying relief.",
    },
  ];

  const kernelChapters = kernelLessons.map((lesson, index) => ({
    title: lesson.title,
    belt: `Kernel ${index + 1}/15`,
    source: lesson.source,
    tools: ["kernel"],
    solution: graphFromSteps(lesson.steps),
    unlockAfter: [],
    lines: [
      `Master Bitshan places a woven mat before lesson ${index + 1}.`,
      lesson.explore,
      "Build the kernel matrix carefully. Weighted centers and edge treatments change how the neighbors influence the result.",
    ],
    hints: [
      lesson.goal,
      lesson.explore,
      "Add kernel nodes one at a time. Watch the preview update as each layer is applied.",
    ],
  }));

  return [...colorChapters, ...affineChapters, ...kernelChapters];
}


