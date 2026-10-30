// Programme d'entraînement : perte de poids + force, priorité au bas du dos.
// Structure : chaque séance commence par le « Big 3 » de McGill, puis exercices
// polyarticulaires lourds (5–8 rép.), accessoires (8–15 rép.) et gainage.
// reps = [min, max] ; pour track 'time' en secondes ; pour 'cardio' en minutes.

// Échauffement général (≈ 8 min) : cardio léger + mobilité, avant le Big 3.
const PREP_LOWER = [
  { ex: 'bike', sets: 1, reps: [5, 5], rest: 0, tag: 'prep' },
  { ex: 'cat_camel', sets: 1, reps: [6, 8], rest: 0, tag: 'prep' },
  { ex: 'leg_swing', sets: 1, reps: [10, 10], rest: 0, tag: 'prep' },
  { ex: 'hip_opener', sets: 1, reps: [4, 5], rest: 0, tag: 'prep' },
];
const PREP_UPPER = [
  { ex: 'rower', sets: 1, reps: [5, 5], rest: 0, tag: 'prep' },
  { ex: 'cat_camel', sets: 1, reps: [6, 8], rest: 0, tag: 'prep' },
  { ex: 'shoulder_pass', sets: 1, reps: [10, 10], rest: 0, tag: 'prep' },
  { ex: 'hip_opener', sets: 1, reps: [4, 5], rest: 0, tag: 'prep' },
];
const PREP_FULL = [
  { ex: 'bike', sets: 1, reps: [5, 5], rest: 0, tag: 'prep' },
  { ex: 'cat_camel', sets: 1, reps: [6, 8], rest: 0, tag: 'prep' },
  { ex: 'hip_opener', sets: 1, reps: [4, 5], rest: 0, tag: 'prep' },
  { ex: 'shoulder_pass', sets: 1, reps: [10, 10], rest: 0, tag: 'prep' },
];

// Activation du tronc : « Big 3 » de McGill.
const BIG3 = [
  { ex: 'curl_up', sets: 2, reps: [5, 6], rest: 30, tag: 'warmup' },
  { ex: 'bird_dog', sets: 2, reps: [5, 6], rest: 30, tag: 'warmup' },
  { ex: 'side_plank', sets: 2, reps: [15, 30], rest: 30, tag: 'warmup' },
];

// Retour au calme : étirements statiques (≈ 6 min).
const st = (ex) => ({ ex, sets: 1, reps: [30, 30], rest: 10, tag: 'stretch' });
const STRETCH_LOWER = [st('hip_flexor_stretch'), st('hamstring_stretch'), st('glute_stretch'), st('quad_stretch')];
const STRETCH_UPPER = [st('pec_stretch'), st('lat_stretch'), st('hip_flexor_stretch'), st('glute_stretch')];
const STRETCH_FULL = [st('hip_flexor_stretch'), st('hamstring_stretch'), st('glute_stretch'), st('pec_stretch')];

export const PLANS = {
  3: {
    name: 'Full body · 3 jours',
    short: 'Full body',
    desc: 'Trois séances complètes par semaine (ex. lundi, mercredi, vendredi). Chaque muscle est sollicité 3 fois par semaine : la fréquence idéale quand on perd du poids et qu’on veut gagner en force. Barres pour les mouvements de force, machines pour le volume en sécurité.',
    sessions: [
      {
        id: 'A', name: 'Séance A', focus: 'Squat · Développé couché',
        items: [
          ...PREP_FULL, ...BIG3,
          { ex: 'squat', sets: 3, reps: [5, 8], rest: 180, tag: 'main' },
          { ex: 'bench', sets: 3, reps: [5, 8], rest: 180, tag: 'main' },
          { ex: 'machine_row', sets: 3, reps: [8, 12], rest: 120, tag: 'acc' },
          { ex: 'leg_curl', sets: 3, reps: [10, 15], rest: 90, tag: 'acc' },
          { ex: 'back_ext_machine', sets: 3, reps: [10, 15], rest: 90, tag: 'core' },
          { ex: 'pallof', sets: 2, reps: [10, 12], rest: 60, tag: 'core' },
          ...STRETCH_FULL,
        ],
      },
      {
        id: 'B', name: 'Séance B', focus: 'Soulevé de terre · Épaules',
        items: [
          ...PREP_FULL, ...BIG3,
          { ex: 'deadlift', sets: 3, reps: [4, 6], rest: 180, tag: 'main' },
          { ex: 'shoulder_press_machine', sets: 3, reps: [8, 12], rest: 120, tag: 'main' },
          { ex: 'lat_pulldown', sets: 3, reps: [8, 12], rest: 120, tag: 'acc' },
          { ex: 'leg_extension', sets: 3, reps: [10, 15], rest: 90, tag: 'acc' },
          { ex: 'pec_deck', sets: 2, reps: [12, 15], rest: 60, tag: 'acc' },
          { ex: 'farmer_walk', sets: 3, reps: [30, 45], rest: 90, tag: 'core' },
          ...STRETCH_FULL,
        ],
      },
      {
        id: 'C', name: 'Séance C', focus: 'Machines · Fessiers et dos',
        items: [
          ...PREP_FULL, ...BIG3,
          { ex: 'leg_press', sets: 3, reps: [8, 12], rest: 150, tag: 'main' },
          { ex: 'chest_press', sets: 3, reps: [8, 12], rest: 120, tag: 'main' },
          { ex: 'hip_thrust_machine', sets: 3, reps: [8, 12], rest: 120, tag: 'acc' },
          { ex: 'cable_row', sets: 3, reps: [10, 12], rest: 90, tag: 'acc' },
          { ex: 'reverse_fly', sets: 2, reps: [12, 15], rest: 60, tag: 'acc' },
          { ex: 'suitcase_carry', sets: 2, reps: [30, 40], rest: 60, tag: 'core' },
          ...STRETCH_FULL,
        ],
      },
    ],
  },
  4: {
    name: 'Haut / Bas · 4 jours',
    short: 'Haut / Bas',
    desc: 'Quatre séances par semaine alternant bas du corps et haut du corps (ex. lundi, mardi, jeudi, vendredi). Plus de volume par séance, chaque muscle travaillé 2 fois par semaine, avec une large place aux machines.',
    sessions: [
      {
        id: 'L1', name: 'Bas A', focus: 'Squat · Quadriceps',
        items: [
          ...PREP_LOWER, ...BIG3,
          { ex: 'squat', sets: 4, reps: [5, 8], rest: 180, tag: 'main' },
          { ex: 'rdl', sets: 3, reps: [6, 10], rest: 150, tag: 'main' },
          { ex: 'leg_extension', sets: 3, reps: [10, 15], rest: 90, tag: 'acc' },
          { ex: 'lying_leg_curl', sets: 3, reps: [10, 15], rest: 90, tag: 'acc' },
          { ex: 'calf_machine', sets: 3, reps: [10, 15], rest: 60, tag: 'acc' },
          { ex: 'back_ext_machine', sets: 3, reps: [10, 15], rest: 90, tag: 'core' },
          ...STRETCH_LOWER,
        ],
      },
      {
        id: 'U1', name: 'Haut A', focus: 'Développé couché · Rowing',
        items: [
          ...PREP_UPPER, ...BIG3,
          { ex: 'bench', sets: 4, reps: [5, 8], rest: 180, tag: 'main' },
          { ex: 'machine_row', sets: 4, reps: [8, 12], rest: 120, tag: 'main' },
          { ex: 'shoulder_press_machine', sets: 3, reps: [8, 12], rest: 120, tag: 'acc' },
          { ex: 'lat_pulldown', sets: 3, reps: [8, 12], rest: 90, tag: 'acc' },
          { ex: 'db_curl', sets: 2, reps: [10, 15], rest: 60, tag: 'acc' },
          { ex: 'pushdown', sets: 2, reps: [10, 15], rest: 60, tag: 'acc' },
          ...STRETCH_UPPER,
        ],
      },
      {
        id: 'L2', name: 'Bas B', focus: 'Soulevé de terre · Fessiers',
        items: [
          ...PREP_LOWER, ...BIG3,
          { ex: 'deadlift', sets: 3, reps: [4, 6], rest: 180, tag: 'main' },
          { ex: 'hack_squat', sets: 3, reps: [8, 12], rest: 150, tag: 'main' },
          { ex: 'hip_thrust_machine', sets: 3, reps: [8, 12], rest: 120, tag: 'acc' },
          { ex: 'leg_curl', sets: 3, reps: [10, 15], rest: 90, tag: 'acc' },
          { ex: 'kickback', sets: 2, reps: [12, 15], rest: 60, tag: 'acc' },
          { ex: 'pallof', sets: 3, reps: [10, 12], rest: 60, tag: 'core' },
          ...STRETCH_LOWER,
        ],
      },
      {
        id: 'U2', name: 'Haut B', focus: 'Tractions · Machines',
        items: [
          ...PREP_UPPER, ...BIG3,
          { ex: 'pullup', sets: 4, reps: [5, 10], rest: 150, tag: 'main' },
          { ex: 'incline_press_machine', sets: 3, reps: [8, 12], rest: 120, tag: 'main' },
          { ex: 'cable_row', sets: 3, reps: [10, 12], rest: 90, tag: 'acc' },
          { ex: 'pec_deck', sets: 3, reps: [12, 15], rest: 60, tag: 'acc' },
          { ex: 'reverse_fly', sets: 3, reps: [12, 15], rest: 60, tag: 'acc' },
          { ex: 'farmer_walk', sets: 3, reps: [30, 45], rest: 90, tag: 'core' },
          ...STRETCH_UPPER,
        ],
      },
    ],
  },
};

// Style « Priorité machines » : équivalents guidés des exercices à la barre
// (liste = premier choix, puis repli si l'exercice figure déjà dans la séance).
export const MACHINE_EQUIV = {
  squat: 'hack_squat',
  goblet_squat: 'leg_press',
  deadlift: ['hip_thrust_machine', 'back_ext_machine'],
  rdl: ['lying_leg_curl', 'hip_thrust_machine'],
  good_morning: 'back_ext_machine',
  hip_thrust: 'hip_thrust_machine',
  split_squat: 'leg_press',
  bench: 'chest_press',
  incline_db: 'incline_press_machine',
  ohp: 'shoulder_press_machine',
  barbell_row: 'machine_row',
  db_row: 'machine_row',
  pullup: 'assisted_pullup',
  face_pull: 'reverse_fly',
  back_extension: 'back_ext_machine',
};

export const STYLES = [
  { v: 'mixte', label: 'Mixte', hint: 'Barres pour la force + machines pour le volume (recommandé)' },
  { v: 'machines', label: 'Priorité machines', hint: 'Les exercices à la barre sont remplacés par des machines guidées' },
];

// Séances cardio facultatives (jours de repos).
export const CARDIO = [
  {
    id: 'Z2', name: 'Cardio zone 2', focus: 'Marche inclinée · 30–45 min',
    items: [{ ex: 'incline_walk', sets: 1, reps: [30, 45], rest: 0, tag: 'cardio' }],
  },
  {
    id: 'HIIT', name: 'Intervalles rameur', focus: '6–8 × 30 s / 90 s',
    items: [{ ex: 'rower', sets: 1, reps: [15, 20], rest: 0, tag: 'cardio' }],
  },
  {
    id: 'BIKE', name: 'Vélo zone 2', focus: 'Vélo · 30–45 min',
    items: [{ ex: 'bike', sets: 1, reps: [30, 45], rest: 0, tag: 'cardio' }],
  },
];

// Cycle de 6 semaines : effort progressif (RIR = répétitions en réserve) puis décharge.
export const CYCLE = [
  { week: 1, rir: 3, label: 'Prise en main' },
  { week: 2, rir: 2, label: 'Accumulation' },
  { week: 3, rir: 2, label: 'Accumulation' },
  { week: 4, rir: 1, label: 'Intensification' },
  { week: 5, rir: 1, label: 'Intensification' },
  { week: 6, rir: 4, label: 'Décharge', deload: true },
];

// Variantes plus douces pour le dos, proposées quand la douleur du jour est ≥ 4/10.
export const BACK_FRIENDLY = {
  deadlift: 'hip_thrust_machine',
  squat: 'hack_squat',
  rdl: 'lying_leg_curl',
  good_morning: 'bird_dog',
  hip_thrust: 'hip_thrust_machine',
  barbell_row: 'machine_row',
  db_row: 'machine_row',
  ohp: 'shoulder_press_machine',
  back_extension: 'bird_dog',
  back_ext_machine: 'bird_dog',
  leg_press: 'leg_extension',
  hack_squat: 'leg_extension',
  farmer_walk: 'suitcase_carry',
};

export const TAG_LABEL = {
  prep: 'Échauffement',
  warmup: 'Activation du tronc',
  stretch: 'Retour au calme',
  main: 'Principal',
  acc: 'Complémentaire',
  core: 'Gainage',
  cardio: 'Cardio',
};

// Contenu de la page « Méthode ».
export const SCIENCE = [
  {
    title: 'La perte de poids se joue surtout dans l’assiette',
    body: [
      'Perdre de la graisse demande un déficit calorique. Un rythme modéré de 0,5 à 1 % du poids par semaine préserve mieux la masse musculaire et la force qu’un régime agressif.',
      'L’application calcule ta dépense (équation de Mifflin-St Jeor × activité) et une cible calorique adaptée à ton rythme.',
      'Les protéines (1,6 à 2,2 g/kg) et la musculation sont les deux leviers majeurs pour que le poids perdu soit de la graisse, pas du muscle.',
      'Pèse-toi idéalement chaque matin : la moyenne sur 7 jours lisse les variations d’eau et révèle la vraie tendance.',
    ],
    refs: [0, 1, 2, 3],
  },
  {
    title: 'La force : peu d’exercices, bien progressés',
    body: [
      'Les mouvements polyarticulaires (squat, soulevé de terre, développés, tirages) en 4 à 8 répétitions développent la force le plus efficacement.',
      'Chaque muscle est entraîné 2 à 3 fois par semaine avec environ 10 séries hebdomadaires : le meilleur compromis efficacité / temps.',
      'Repos longs (2–3 min) sur les exercices lourds : ils permettent de soulever plus et de progresser davantage.',
      'Progression « double » : quand tu atteins le haut de la fourchette de répétitions sur toutes les séries, la charge augmente. L’application te le propose automatiquement.',
    ],
    refs: [4, 5, 6, 7],
  },
  {
    title: 'L’effort : répétitions en réserve (RIR)',
    body: [
      'Le RIR est le nombre de répétitions que tu pourrais encore faire en fin de série. RIR 2 = tu t’arrêtes 2 répétitions avant l’échec.',
      'S’entraîner proche de l’échec (RIR 0–3) suffit pour progresser, sans la fatigue inutile de l’échec systématique — surtout important en déficit calorique.',
      'Le cycle de 6 semaines augmente progressivement l’effort (RIR 3 → 1), puis une semaine de décharge (moitié des séries) permet de récupérer et de repartir plus fort.',
    ],
    refs: [8, 9],
  },
  {
    title: 'Un bas du dos solide',
    body: [
      'Chaque séance commence par le « Big 3 » de Stuart McGill (curl-up, bird dog, planche latérale) : ils entraînent l’endurance des muscles stabilisateurs avec très peu de contrainte sur la colonne.',
      'Le renforcement progressif des extenseurs lombaires (extension à 45°, soulevé de terre) améliore la force du dos et réduit la douleur chez les personnes lombalgiques.',
      'Les exercices de stabilisation et de renforcement figurent parmi les approches les plus efficaces contre la lombalgie chronique.',
      'Le portage (marche du fermier, marche valise) et l’anti-rotation (Pallof press) apprennent au tronc à rester rigide sous charge.',
      'Note ta douleur lombaire avant chaque séance : si elle dépasse 4/10, l’application propose des variantes plus douces. Une douleur vive, irradiant dans la jambe, ou qui s’aggrave nécessite un avis médical.',
    ],
    refs: [10, 11, 12, 13],
  },
  {
    title: 'Machines, échauffement et étirements',
    body: [
      'Machines guidées et poids libres donnent des gains de force et de masse musculaire comparables. Le programme garde quelques mouvements à la barre (spécifiques à la force) et utilise largement les machines : plus stables, faciles à apprendre et à charger, elles permettent beaucoup de volume avec peu de risque pour le dos. Le style « Priorité machines » remplace les exercices à la barre par leur équivalent guidé.',
      'Chaque séance commence par ~8 minutes d’échauffement général (vélo ou rameur, puis mobilité : chat-chameau, fente avec rotation, balancés de jambe ou passage d’épaules) : l’échauffement améliore la performance. Les séries d’approche sont ensuite calculées pour les mouvements lourds.',
      'La séance se termine par des étirements statiques de 30 s des muscles clés pour le dos (fléchisseurs de hanche, ischios, fessiers) et le haut du corps. Ils améliorent la souplesse au fil des semaines et favorisent le retour au calme ; en revanche, ils ne réduisent pas les courbatures.',
    ],
    refs: [16, 17, 18],
  },
  {
    title: 'Cardio et activité quotidienne',
    body: [
      'Le nombre de pas quotidien (objectif 8 000–10 000) est un puissant levier de dépense énergétique et de santé.',
      'Le cardio en zone 2 (marche inclinée, vélo, rameur doux) s’ajoute sans nuire à la force, surtout s’il est à faible impact et séparé des séances de jambes.',
    ],
    refs: [14, 15],
  },
];

export const REFERENCES = [
  'Garthe I. et al. (2011). Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes. Int J Sport Nutr Exerc Metab, 21(2), 97–104.',
  'Helms E.R., Aragon A.A., Fitschen P.J. (2014). Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. J Int Soc Sports Nutr, 11, 20.',
  'Mifflin M.D., St Jeor S.T. et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr, 51(2), 241–247.',
  'Morton R.W. et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength. Br J Sports Med, 52(6), 376–384.',
  'Schoenfeld B.J., Grgic J. et al. (2017). Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. J Strength Cond Res, 31(12), 3508–3523.',
  'Schoenfeld B.J., Ogborn D., Krieger J.W. (2016). Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. Sports Med, 46(11), 1689–1697.',
  'Schoenfeld B.J., Ogborn D., Krieger J.W. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci, 35(11), 1073–1082.',
  'Schoenfeld B.J. et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. J Strength Cond Res, 30(7), 1805–1812.',
  'Helms E.R. et al. (2016). Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training. Strength Cond J, 38(4), 42–49.',
  'Bell L. et al. (2023). Integrating deloading into strength and physique sports training programmes: an international Delphi consensus approach. Sports Med Open, 9, 87.',
  'McGill S.M. (2016). Low Back Disorders: Evidence-Based Prevention and Rehabilitation (3e éd.). Human Kinetics.',
  'Steele J., Bruce-Low S., Smith D. (2015). A review of the clinical value of isolated lumbar extension resistance training for chronic low back pain. PM&R, 7(2), 169–187.',
  'Owen P.J. et al. (2020). Which specific modes of exercise training are most effective for treating low back pain? Network meta-analysis. Br J Sports Med, 54(21), 1279–1287.',
  'Berglund L. et al. (2015). Which patients with low back pain benefit from deadlift training? J Strength Cond Res, 29(7), 1803–1811.',
  'Paluch A.E. et al. (2022). Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health, 7(3), e219–e228.',
  'Wilson J.M. et al. (2012). Concurrent training: a meta-analysis examining interference of aerobic and resistance exercises. J Strength Cond Res, 26(8), 2293–2307.',
  'Haugen M.E. et al. (2023). Effect of free-weight vs. machine-based strength training on maximal strength, hypertrophy and jump performance: a systematic review and meta-analysis. BMC Sports Sci Med Rehabil, 15, 103.',
  'Fradkin A.J., Zazryn T.R., Smoliga J.M. (2010). Effects of warming-up on physical performance: a systematic review with meta-analysis. J Strength Cond Res, 24(1), 140–148.',
  'Afonso J. et al. (2021). The effectiveness of post-exercise stretching in short-term and delayed recovery of strength, range of motion and delayed onset muscle soreness: a systematic review and meta-analysis. Front Physiol, 12, 677581.',
];
