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

export const INITIAL_STUDIES: Record<string, Study[]> = {
  salvacion: [
    {
      id: 'estudio-salvacion-gracia',
      topicId: 'salvacion',
      title: 'La Salvación: El Regalo Inmerecido de la Gracia',
      subtitle: 'Estudio exegético y bosquejo de predicación sobre la reconciliación del creyente',
      date: '2026-11-05',
      mainVerse: {
        id: 'mv-efesios-2',
        reference: 'Efesios 2:8-9',
        version: 'RVR1960',
        text: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.',
        notes: 'Clave teológica: "Gracia" (Jaris) = favor inmerecido. "Don" (Dôron) = regalo absoluto sin contraprestación.'
      },
      relatedVerses: [
        {
          id: 'v-jn-3-16',
          reference: 'Juan 3:16',
          version: 'RVR1960',
          text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
          notes: 'El motor de la salvación es el amor incondicional del Padre.'
        },
        {
          id: 'v-rom-5-1',
          reference: 'Romanos 5:1',
          version: 'RVR1960',
          text: 'Justificados, pues, por la fe, tenemos paz para con Dios por medio de nuestro Señor Jesucristo.',
          notes: 'Resultado directo: cesación de la enemistad con Dios; paz interior y posicional.'
        },
        {
          id: 'v-rom-10-9',
          reference: 'Romanos 10:9-10',
          version: 'RVR1960',
          text: 'Que si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo. Porque con el corazón se cree para justicia, pero con la boca se confiesa para salvación.',
          notes: 'Aspecto práctico: fe interna genuina unida a confesión pública.'
        },
        {
          id: 'v-tito-3-5',
          reference: 'Tito 3:5',
          version: 'RVR1960',
          text: 'Nos salvó, no por obras de justicia que nosotros hubiéramos hecho, sino por su misericordia, por el lavamiento de la regeneración y por la renovación en el Espíritu Santo.',
          notes: 'Énfasis en la regeneración espiritual como obra exclusiva del Espíritu Santo.'
        },
        {
          id: 'v-1ped-1-18',
          reference: '1 Pedro 1:18-19',
          version: 'RVR1960',
          text: 'Sabiendo que fuisteis rescatados de vuestra vana manera de vivir, la cual recibisteis de vuestros padres, no con cosas corruptibles, como oro o plata, sino con la sangre preciosa de Cristo, como de un cordero sin mancha y sin contaminación.',
          notes: 'El costo infinito de nuestro rescate.'
        }
      ],
      outlinePoints: [
        {
          id: 'p-1',
          number: 1,
          title: 'La Condición Caída del Hombre: Separación Total',
          scriptureRef: 'Romanos 3:23 / Efesios 2:1',
          content: 'El hombre por sus propias fuerzas se encuentra en bancarrota espiritual. Ningún esfuerzo moral, ritual religioso o mérito humano puede cruzar el abismo de la santidad divina. La religión intenta que el hombre alcance a Dios; el Evangelio revela a Dios descendiendo a rescatar al hombre.'
        },
        {
          id: 'p-2',
          number: 2,
          title: 'La Iniciativa Divina: El Amor Demostrado en la Cruz',
          scriptureRef: 'Romanos 5:8 / Juan 3:16',
          content: 'Dios no esperó a que fuéramos dignos ni perfectos para amarnos. Cristo murió por nosotros mientras éramos aún pecadores e incapaces de salvarnos. La salvación no es una recompensa al mérito, sino una muestra pura del carácter misericordioso del Padre.'
        },
        {
          id: 'p-3',
          number: 3,
          title: 'El Sacrificio Sustitucionario de Cristo',
          scriptureRef: 'Isaías 53:5 / 2 Corintios 5:21',
          content: 'En la cruz ocurrió el gran intercambio: Aquel que no conoció pecado fue hecho pecado por nosotros, para que nosotros fuésemos hechos justicia de Dios en Él. La deuda moral y la condenación que pesaban sobre nosotros fueron completamente saldadas (Tetélestai).'
        },
        {
          id: 'p-4',
          number: 4,
          title: 'Apropiación Personal: Fe y Confesión Genuina',
          scriptureRef: 'Efesios 2:8-9 / Romanos 10:9',
          content: 'La salvación es un regalo terminado, pero requiere ser recibido con las manos vacías de la fe. No añadimos nada a la obra de Cristo; simplemente depositamos nuestra confianza en Su fidelidad. El fruto de esta fe es una vida transformada por Su gracia.'
        },
        {
          id: 'p-5',
          number: 5,
          title: 'Llamado a la Aplicación y Compromiso',
          scriptureRef: 'Hebreos 2:3 / 2 Pedro 3:9',
          content: '¿Cómo escaparemos si descuidamos una salvación tan grande? Invitación a orar rindiendo el control de la vida a Cristo, dejando atrás la autosuficiencia y descansando en la promesa de Su perdón pleno.'
        }
      ],
      detailedNotes: `### Léxico Griego de Referencia (Romanos 5:1 & Efesios 2:8)
- **Justificados:** *Dikaiōthentes* (δικαιωθέντες, aoristo pasivo de *dikaioō*). Declaración judicial divina de inocencia total y justicia perfecta acreditada por la fe en la sangre de Cristo.
- **Fe:** *Pistis* (πίστις). Confianza plena, convicción inamovible y abandono completo de la justicia propia para apoyarse únicamente en la fidelidad de Dios.
- **Paz para con Dios:** *Eirēnē* (εἰρήνη). Reconciliación definitiva, cesación de toda enemistad con el Creador y reposo interior del alma bajo el pacto eterno.
- **Gracia:** *Charis* (χάρις). Favor absoluto inmerecido hacia quien merecía condenación.
- **Salvación:** *Sōtēria* (σωτηρία). Rescate integral, sanidad espiritual y preservación para la eternidad.

### Apuntes Teológicos y Exegéticos
- **Gracia frente a Ley:** Pablo recuerda a los Efesios que antes estábamos muertos en delitos y pecados. El Evangelio no es un consejo moral para mejorar al hombre, sino una resurrección espiritual.
- **Paz interior vs. Paz posicional:** La paz de Romanos 5:1 no es simplemente una emoción de calma, sino un estatus judicial permanente ante el tribunal de Dios.

### Preguntas para reflexionar o interactuar con el grupo:
1. ¿En qué áreas de nuestra vida seguimos intentando "ganarnos" el favor de Dios por obras en lugar de descansar en Su gracia?
2. ¿Cómo cambia nuestra actitud hacia los demás cuando comprendemos que todos fuimos rescatados de la misma bancarrota espiritual?
3. Si la salvación es por fe y no por obras, ¿cuál es el verdadero lugar de las buenas obras en la vida diaria? (Ver Efesios 2:10).`,
      images: [
        {
          id: 'img-1',
          title: 'Infografía: El Gran Puente de la Gracia',
          url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
          caption: 'Ilustración visual del abismo moral y la cruz de Cristo como único puente eterno.'
        },
        {
          id: 'img-2',
          title: 'Manuscrito y Texto Bíblico Antiguo',
          url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
          caption: 'Contexto de las cartas paulinas a las iglesias de Asia Menor.'
        }
      ],
      videos: [
        {
          id: 'vid-1',
          title: 'Ilustración Explicativa: El Regalo Inmerecido de la Cruz',
          url: 'https://www.youtube.com/watch?v=XhZsmkK5NlQ',
          timestamp: '03:15',
          notes: 'Usar este video o concepto de analogía al llegar al punto 2 del sermón.'
        }
      ],
      quickNotes: [
        {
          id: 'qn-1',
          text: 'Hacer una pausa de silencio antes del llamado para que la congregación medite en Efesios 2:8.',
          tag: 'Pausa',
          color: 'red',
          createdAt: '10:15 AM'
        },
        {
          id: 'qn-2',
          text: 'Cita de C.S. Lewis: "El cristianismo no te dice cómo ser una buena persona; te dice cómo una persona muerta puede volver a vivir".',
          tag: 'Cita',
          color: 'blue',
          createdAt: '11:30 AM'
        },
        {
          id: 'qn-3',
          text: 'Llevar la referencia de Tito 3:5 lista si alguien pregunta sobre el bautismo y las buenas obras.',
          tag: 'Recordatorio',
          color: 'slate',
          createdAt: '03:45 PM'
        }
      ]
    }
  ]
};

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
