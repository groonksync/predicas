import { Topic, Study, BibleVerse } from '../types';

export const INITIAL_TOPICS: Topic[] = [
  {
    id: 'salvacion',
    name: 'La Salvación',
    description: 'Estudios sobre la gracia, la justificación, la redención y la vida eterna.',
    colorBadge: 'amber',
    iconName: 'Sparkles',
  },
  {
    id: 'fe-gracia',
    name: 'La Fe y la Gracia',
    description: 'El fundamento de la vida cristiana y la confianza plena en las promesas de Dios.',
    colorBadge: 'blue',
    iconName: 'Shield',
  },
  {
    id: 'oracion',
    name: 'La Oración Eficaz',
    description: 'Comunión con el Padre, intercesión, ayuno y vida devocional continua.',
    colorBadge: 'emerald',
    iconName: 'HeartHandshake',
  },
  {
    id: 'profecias',
    name: 'Profecías y Escatología',
    description: 'Análisis de los tiempos bíblicos, pactos mesiánicos y el plan eterno de Dios.',
    colorBadge: 'purple',
    iconName: 'Scroll',
  },
  {
    id: 'guerra-espiritual',
    name: 'Guerra Espiritual',
    description: 'La armadura de Dios, la autoridad del creyente y la victoria en la cruz.',
    colorBadge: 'rose',
    iconName: 'Flame',
  },
  {
    id: 'familia-sabiduria',
    name: 'Familia y Sabiduría',
    description: 'Principios de Proverbios, el hogar cristiano y la edificación mutua.',
    colorBadge: 'indigo',
    iconName: 'Users',
  }
];

export const INITIAL_STUDIES: Record<string, Study[]> = {};

export const COMMON_BIBLE_VERSES: BibleVerse[] = [
  {
    id: 'bv-jn316',
    reference: 'Juan 3:16',
    version: 'RVR1960',
    text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'
  },
  {
    id: 'bv-rom109',
    reference: 'Romanos 10:9',
    version: 'RVR1960',
    text: 'Que si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo.'
  },
  {
    id: 'bv-fil46',
    reference: 'Filipenses 4:6-7',
    version: 'RVR1960',
    text: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.'
  },
  {
    id: 'bv-sal23',
    reference: 'Salmos 23:1-3',
    version: 'RVR1960',
    text: 'Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará. Confortará mi alma; me guiará por sendas de justicia por amor de su nombre.'
  },
  {
    id: 'bv-jer2911',
    reference: 'Jeremías 29:11',
    version: 'RVR1960',
    text: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.'
  },
  {
    id: 'bv-heb111',
    reference: 'Hebreos 11:1',
    version: 'RVR1960',
    text: 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.'
  },
  {
    id: 'bv-2tim17',
    reference: '2 Timoteo 1:7',
    version: 'RVR1960',
    text: 'Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.'
  },
  {
    id: 'bv-is4031',
    reference: 'Isaías 40:31',
    version: 'RVR1960',
    text: 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.'
  }
];
