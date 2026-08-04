// Fuente única de las 5 heridas — la usan /test-heridas-de-infancia/ y /heridas/<slug>/.
// Contenido derivado del marco propio de Endonautica (~/.claude/skills/endonautica.md,
// "La Máscara y las Heridas de Infancia") y alineado con el bot de Telegram: una marca,
// un contenido. Si esto cambia, cambia en los dos canales o la misma persona recibe dos
// espejos distintos. No inventar heridas ni máscaras nuevas.

export interface Herida {
  id: string;
  herida: string;        // nombre de la herida
  mascara: string;       // máscara que genera, con artículo
  mascaraCorta: string;  // para títulos y slugs de texto
  frase: string;         // el golpe del resultado del test
  vida: string;          // cómo se ve en el día a día (tarjeta del hub)
  cuerpo: string;        // dónde se aloja — la coraza muscular del marco
  // ── contenido largo, solo para la página propia ──
  keyword: string;       // término por el que compite la página
  intro: string[];       // 2 párrafos de apertura
  origen: string;        // qué la construyó en la infancia
  adultez: string[];     // señales en la vida adulta (long tail "en la adultez")
  pareja: string[];      // en las relaciones (long tail "en la pareja")
  bucles: string[];      // bucles narrativos de autosabotaje — voz interior
  corazaLarga: string;   // el componente físico de la máscara
  trabajo: { t: string; d: string }[]; // por dónde empezar (long tail "cómo sanar")
  faq: [string, string][];
}

export const HERIDAS: Herida[] = [
  {
    id: 'abandono',
    herida: 'Abandono',
    mascara: 'La Máscara de la Dependencia',
    mascaraCorta: 'Dependencia',
    frase: 'Toleras dinámicas que te hacen daño con tal de no quedarte solo. Tu miedo no es al conflicto: es al silencio después.',
    vida: 'Aceptas migajas antes que nada. Escribes primero, siempre. Cuando alguien tarda en responder, tu cuerpo ya está preparando el abandono. Prefieres una relación que duele a una ausencia que no controlas.',
    cuerpo: 'El pecho o la garganta que se cierran.',
    keyword: 'herida de abandono',
    intro: [
      'La herida de abandono no aparece cuando alguien se va. Aparece antes: en el instante en que aprendiste que el afecto podía retirarse sin aviso y sin explicación. Desde entonces una parte de ti vigila. No vive el vínculo, lo monitorea.',
      'Lo que se construyó encima de esa herida es la Máscara de la Dependencia. No es debilidad de carácter ni falta de amor propio: es una estrategia que funcionó cuando eras chico y no tenías ninguna otra. El problema no es que exista. El problema es que sigue operando en situaciones donde ya no hace falta.',
    ],
    origen: 'Se forma cuando la presencia de quien cuidaba fue intermitente: alguien que estaba y de pronto no, sin que se pudiera anticipar cuándo volvería. No hace falta un abandono literal. Basta con una ausencia emocional repetida, una madre desbordada, un padre que trabajaba lejos, un duelo que nadie explicó. Un niño no concluye "esa persona tiene sus propios problemas": concluye "si me quedo quieto y no molesto, tal vez no se vaya".',
    adultez: [
      'Escribes primero, siempre. Y si tardan en responder, el cuerpo ya empezó a preparar la despedida antes de que exista.',
      'Toleras dinámicas que te lastiman porque terminarlas significaría quedarte solo, y esa opción no se evalúa: se descarta.',
      'Te cuesta estar sin plan y sin compañía. El silencio de una casa vacía no se siente como calma, se siente como aviso.',
      'Confundes intensidad con amor. Un vínculo tranquilo te parece frío, porque tu sistema aprendió a leer la alarma como señal de que algo importa.',
      'Te adaptas tanto a lo que el otro necesita que después no sabes qué querías tú. Y cuando el vínculo termina, la pregunta "¿quién soy sin esto?" llega en serio.',
    ],
    pareja: [
      'Das primero, das más y das antes de que te pidan, y llamas a eso generosidad. Debajo hay un cálculo viejo: si soy indispensable, no me dejan.',
      'Las peleas no te asustan por el conflicto sino por lo que viene después — el silencio, la puerta, la posibilidad de que esta vez no vuelva.',
      'Postergas conversaciones necesarias por miedo a romper algo, y esa postergación termina rompiéndolo igual, más tarde y peor.',
      'A veces te vas tú primero. No es contradicción: irse antes es la única forma de que el abandono ocurra en tus términos.',
    ],
    bucles: [
      '«Si le doy espacio, se va a dar cuenta de que puede estar sin mí.»',
      '«Está raro conmigo. Algo hice.»',
      '«Prefiero esto a estar solo.»',
    ],
    corazaLarga: 'La máscara tiene un componente físico, no solo mental. En el abandono suele instalarse en el pecho y en la garganta: la sensación de que algo se cierra justo cuando ibas a pedir. Es una contracción que aprendió a tragarse la petición antes de que salga, porque pedir era arriesgarse a confirmar la ausencia.',
    trabajo: [
      { t: 'Nómbrala cuando aparece, no después', d: 'La próxima vez que alguien tarde en responder y sientas el tirón en el pecho, di en voz baja: "esto es la herida, no es la situación". No la elimina. Corta la identificación, que es lo que la vuelve verdad.' },
      { t: 'Quédate cinco minutos más', d: 'Cuando aparezca el impulso de escribir para calmar la ansiedad, espera cinco minutos observando la sensación sin actuarla. No es aguantar: es comprobar que la sensación sube, se sostiene y baja sin que tengas que hacer nada.' },
      { t: 'Practica el silencio elegido', d: 'Una hora a la semana sin plan, sin compañía y sin pantalla. La soledad involuntaria confirma la herida; la soledad elegida la desarma, porque enseña que estar solo y estar abandonado no son lo mismo.' },
      { t: 'Revisa la voz de adentro', d: 'Los bucles de arriba se repiten desde la infancia. Escríbelos tal como suenan y al lado escribe qué le dirías a alguien que quieres si te los dijera. Esa distancia entre las dos voces es el trabajo.' },
    ],
    faq: [
      ['¿La herida de abandono se cura?', 'La pregunta útil no es si desaparece, sino si sigue decidiendo por ti. La huella queda; lo que cambia es que dejas de confundirla contigo y empieza a ser información en vez de mandato. Mucha gente describe ese cambio como haber dejado de sentir el miedo, pero lo que pasó es que dejó de obedecerlo.'],
      ['¿Puedo tener herida de abandono si nadie me abandonó?', 'Sí, y es lo más frecuente. La herida no la produce el hecho sino la lectura que hizo un niño de una ausencia que no pudo explicarse: un cuidador emocionalmente ocupado, una enfermedad en la familia, un hermano que necesitaba más atención.'],
      ['¿Por qué elijo siempre a personas que no están disponibles?', 'Porque lo conocido se siente como hogar aunque duela. Un vínculo que está disponible de verdad no activa el sistema de alarma, y sin alarma tu cuerpo no registra que sea importante. Reconocer ese patrón es el primer movimiento; cambiarlo toma más de una decisión.'],
    ],
  },
  {
    id: 'rechazo',
    herida: 'Rechazo',
    mascara: 'La Máscara Huidiza',
    mascaraCorta: 'Huidiza',
    frase: 'Te retiras antes de que te retiren. No es orgullo: es una certeza vieja de que no mereces el afecto que igual estás pidiendo.',
    vida: 'Te haces pequeño en los grupos. Cancelas antes de que te cancelen. Cuando alguien te elige, sospechas del criterio de esa persona en vez de revisar el tuyo.',
    cuerpo: 'Los hombros encogidos hacia adentro.',
    keyword: 'herida de rechazo',
    intro: [
      'La herida de rechazo no se trata de que te dijeran que no. Se trata de que en algún momento concluiste que el problema no era lo que hacías, sino lo que eras. Esa conclusión no se discute con argumentos: se instaló antes de que existieran las palabras para discutirla.',
      'Encima se construyó la Máscara Huidiza. Su lógica es simple y despiadada: si no aparezco del todo, no me pueden rechazar del todo. Así que ocupas menos espacio del que necesitas y llamas a eso ser reservado.',
    ],
    origen: 'Suele formarse cuando la existencia misma del niño resultaba incómoda para alguien: un padre que se irritaba con su sola presencia, una comparación permanente con un hermano, un entorno donde había que merecer el lugar en vez de tenerlo. El niño no concluye "esta persona no sabe querer": concluye "sobro".',
    adultez: [
      'Te haces pequeño en los grupos. Hablas después de que hablaron todos, y muchas veces ya no hablas.',
      'Cancelas antes de que te cancelen. Adelantarte al rechazo se siente como control, y en el fondo lo es: es elegir el dolor conocido.',
      'Cuando alguien te elige, sospechas del criterio de esa persona en vez de revisar el tuyo. El halago no entra; rebota.',
      'Tienes vida interior intensa y vida social escasa, y explicas esa diferencia diciendo que prefieres estar solo. A veces es cierto. A veces es la máscara hablando por ti.',
      'Te cuesta ocupar espacio en lo tuyo: pedir un aumento, cobrar lo que vales, mandar el mensaje primero, mostrar el trabajo terminado.',
    ],
    pareja: [
      'Te enamoras de lejos y con detalle. La distancia es segura: ahí el rechazo todavía no ocurrió.',
      'Cuando el vínculo se acerca de verdad, aparece el impulso de desaparecer — no por falta de interés, sino porque la cercanía es exactamente donde vive el riesgo.',
      'Interpretas la neutralidad como desagrado. Un mensaje seco, una cara cansada, y el sistema ya concluyó que te dejaron de querer.',
      'Te cuesta pedir. Pedir es exponer que necesitas, y necesitar fue justamente lo que en tu historia resultó demasiado.',
    ],
    bucles: [
      '«Mejor no digo nada, total a nadie le importa.»',
      '«Si me conocieran de verdad, se irían.»',
      '«No deberías haber estado ahí.»',
    ],
    corazaLarga: 'Físicamente aparece como un encogimiento: hombros hacia adentro, pecho hundido, la postura de quien intenta ocupar menos volumen del que su cuerpo tiene. Es una coraza que lleva años sosteniéndose sola, y por eso cansa sin que hagas nada.',
    trabajo: [
      { t: 'Ocupa un espacio pequeño a propósito', d: 'Una opinión en una reunión, un mensaje que mandas primero, un plato que pides como lo quieres. La herida no se desarma con gestos grandes: se desarma acumulando evidencia de que apareciste y no pasó nada.' },
      { t: 'No corrijas el halago', d: 'Cuando alguien te reconozca algo, la respuesta es "gracias" y nada más. Sin minimizar, sin explicar por qué se equivoca. Vas a notar la incomodidad física: ahí está la máscara defendiéndose.' },
      { t: 'Separa el hecho de la conclusión', d: 'Escribe el hecho ("no respondió el mensaje") y debajo la conclusión que sacó tu mente ("no le intereso"). Verlos en dos líneas distintas muestra el salto que das sin darte cuenta.' },
      { t: 'Quédate cuando quieras irte', d: 'El impulso de retirarte aparece justo cuando el vínculo se vuelve real. Quedarte diez minutos más, sin actuar el impulso, es donde se juega el cambio.' },
    ],
    faq: [
      ['¿Cuál es la diferencia entre herida de rechazo y de abandono?', 'El abandono teme que el otro se vaya; el rechazo teme no haber tenido derecho a estar. En el abandono la pregunta es "¿te vas a quedar?"; en el rechazo es "¿tengo lugar acá?". Pueden convivir, y de hecho suelen hacerlo.'],
      ['¿Por qué me alejo justo cuando algo va bien?', 'Porque la cercanía es donde el rechazo podría confirmarse. Mientras hay distancia, la posibilidad de no ser querido sigue siendo teórica. La máscara huidiza prefiere la teoría.'],
      ['¿Ser introvertido es tener herida de rechazo?', 'No. La introversión es una forma legítima de administrar la energía y no duele. La herida duele: se reconoce porque después del retiro queda malestar, no descanso.'],
    ],
  },
  {
    id: 'humillacion',
    herida: 'Humillación',
    mascara: 'La Máscara Masoquista',
    mascaraCorta: 'Masoquista',
    frase: 'Cargas lo de todos y llamas a eso ser buena persona. El olvido de ti mismo se disfrazó de generosidad.',
    vida: 'Dices que sí antes de saber si puedes. Te avergüenza pedir. Te sientes útil solo cuando estás cansado, y descansar te resulta más difícil que trabajar.',
    cuerpo: 'La espalda cargada, un peso encima.',
    keyword: 'herida de humillación',
    intro: [
      'La herida de humillación se instala cuando algo tuyo — el cuerpo, una necesidad, una emoción, un deseo — fue expuesto y motivo de burla o de vergüenza. Lo que quedó no fue el episodio: quedó la certeza de que mostrarse es peligroso y que lo propio es, de algún modo, indecente.',
      'Sobre eso se construyó la Máscara Masoquista, que en este marco no significa buscar dolor por placer. Significa un foco puesto permanentemente en los demás y un olvido sistemático de uno mismo, tan bien disfrazado de virtud que hasta te felicitan por él.',
    ],
    origen: 'Aparece cuando el cuidado vino mezclado con humillación: un adulto que corregía en público, que hacía chistes sobre el cuerpo del niño, que castigaba la necesidad ("¿otra vez tienes hambre?") o que usaba la vergüenza como método de educación. El niño no concluye "esto es maltrato": concluye "lo que necesito da vergüenza".',
    adultez: [
      'Dices que sí antes de saber si puedes, y después reorganizas tu vida entera para cumplir lo que prometiste sin pensar.',
      'Te sientes útil solo cuando estás cansado. El descanso viene con culpa, como si hubiera que pagarlo.',
      'Pedir algo para ti te resulta más difícil que dar cualquier cosa. Y cuando pides, lo haces con tantas disculpas alrededor que el pedido desaparece.',
      'Cargas trabajo, favores y problemas ajenos, y cuando alguien no lo agradece sientes una rabia que después te avergüenza.',
      'Tienes dificultad para poner precio a lo tuyo. Cobrar se siente como pedir de más, aunque el valor esté a la vista.',
    ],
    pareja: [
      'Te vuelves imprescindible en lo práctico y desaparecido en lo propio. El otro no sabe qué necesitas porque nunca se lo dijiste, y a veces porque tú tampoco lo sabes.',
      'Aguantas mucho antes de decir algo, y cuando lo dices sale acumulado — lo que confirma tu idea de que era mejor callar.',
      'La intimidad física puede activar la vergüenza vieja: mostrarse es exactamente lo que quedó marcado como peligroso.',
      'Te atraen personas que necesitan ser cuidadas, porque en el cuidado tu lugar está claro y no hay que pedir nada.',
    ],
    bucles: [
      '«No es para tanto, ya se me pasa.»',
      '«Si no lo hago yo, nadie lo hace.»',
      '«Qué vergüenza haber pedido eso.»',
    ],
    corazaLarga: 'Se aloja en la espalda y los hombros: la postura de quien lleva un peso encima que nadie le puso encima hoy. Suele venir con tensión cervical crónica y con una respiración corta, alta, que nunca termina de llenar. El cuerpo sostiene literalmente lo que la persona dice que puede sostener.',
    trabajo: [
      { t: 'Pide una cosa pequeña por día', d: 'Un vaso de agua, que te alcancen algo, cinco minutos de silencio. El tamaño no importa: importa que el circuito de pedir se active sin que ocurra la catástrofe que anticipa la herida.' },
      { t: 'Responde "déjame ver" en vez de "sí"', d: 'La respuesta automática es el problema. Una frase que compra tres minutos alcanza para que aparezca lo que realmente quieres, que casi siempre llega tarde porque el sí llegó primero.' },
      { t: 'Descansa sin haberlo ganado', d: 'Media hora de descanso un día en que no estuviste agotado. La culpa que aparezca es el dato, no el error — muestra el precio que tu sistema le puso a existir sin producir.' },
      { t: 'Distingue generosidad de deuda', d: 'Antes de ayudar, pregúntate: "¿esto lo doy o lo pago?". Lo que se da alegra; lo que se paga deja resentimiento después. El resentimiento es la señal más honesta que tienes.' },
    ],
    faq: [
      ['¿La herida de humillación es lo mismo que baja autoestima?', 'No exactamente. La baja autoestima es una evaluación de uno mismo; esta herida es una relación con la exposición: lo propio siente que no debe mostrarse. Se puede tener buena valoración de las capacidades y aun así vergüenza profunda de las necesidades.'],
      ['¿Por qué me da culpa descansar?', 'Porque en tu historia el valor estuvo atado a servir. Si el descanso no produce nada para nadie, el sistema lo lee como estar de más — que es exactamente lo que la herida no tolera.'],
      ['Me dicen que soy muy buena persona. ¿Eso es la máscara?', 'Puede serlo, y la pista está en el costo. La bondad que no pasa cuenta es bondad; la que deja agotamiento y rabia callada es una máscara que aprendió a llamarse virtud.'],
    ],
  },
  {
    id: 'traicion',
    herida: 'Traición',
    mascara: 'La Máscara Controladora',
    mascaraCorta: 'Controladora',
    frase: 'Necesitas tenerlo todo atado porque una vez lo soltaste y se cayó. A tu desconfianza le dices carácter fuerte.',
    vida: 'Delegas y revisas. Anticipas la mentira antes de que exista. Te cuesta creer que alguien haga algo por ti sin que haya un costo escondido más adelante.',
    cuerpo: 'La mandíbula apretada.',
    keyword: 'herida de traición',
    intro: [
      'La herida de traición se forma cuando alguien en quien confiabas sin reservas rompió una promesa que para ti era estructura. No fue el hecho: fue descubrir que la confianza podía costar caro. Desde ahí, confiar dejó de ser natural y pasó a ser una decisión que se evalúa cada vez.',
      'Encima quedó la Máscara Controladora. Se presenta con buena reputación — responsable, capaz, con carácter — y sostiene una tesis que nadie discute en voz alta: si lo tengo todo atado, nadie me puede sorprender de nuevo.',
    ],
    origen: 'Se instala cuando una figura de referencia falló en algo que sostenía el mundo del niño: una promesa incumplida de forma repetida, un secreto expuesto, una lealtad rota, un adulto que decía una cosa y hacía otra. El niño no concluye "esa persona falló": concluye "no se puede soltar".',
    adultez: [
      'Delegas y revisas. La ayuda te alivia poco porque el control vuelve a ti igual.',
      'Anticipas la mentira antes de que exista, y esa anticipación se confunde con intuición cuando muchas veces es memoria.',
      'Te cuesta creer que alguien haga algo por ti sin costo escondido. El regalo genera cálculo, no gratitud.',
      'Reaccionas fuerte ante cambios de plan de último momento. No es rigidez: es que un plan que cambia se parece demasiado a una promesa que se rompe.',
      'Te agotas. Sostener el mundo entero para que no se caiga es un trabajo de tiempo completo que nadie te pidió y que nadie te paga.',
    ],
    pareja: [
      'Necesitas saber. Dónde, con quién, a qué hora — y cada respuesta calma diez minutos, no más.',
      'Interpretas la autonomía del otro como una amenaza, aunque en la superficie digas que valoras la independencia.',
      'Pones a prueba sin avisar: pequeños exámenes que el otro no sabe que está rindiendo, y cuyo resultado ya esperabas.',
      'Cuando te fallan en algo menor, el sistema responde como si fuera lo mayor. La reacción no está midiendo el presente.',
    ],
    bucles: [
      '«Si no lo controlo yo, se cae.»',
      '«Algo me está ocultando.»',
      '«No confíes en nadie, ya viste lo que pasa.»',
    ],
    corazaLarga: 'Se aloja en la mandíbula y en el cuello: apretar es la forma física de sostener. Suele aparecer con bruxismo, tensión en la nuca y una dificultad real para soltar el cuerpo cuando por fin hay tiempo de descansar — porque soltar es exactamente el verbo que la herida prohíbe.',
    trabajo: [
      { t: 'Delega algo y no revises', d: 'Elige algo cuyo costo de fracaso sea bajo y déjalo ir de verdad. La incomodidad que aparece no es señal de que va a salir mal: es la máscara pidiendo el volante.' },
      { t: 'Distingue desconfianza de información', d: 'Antes de reaccionar, pregúntate: "¿esto lo sé por algo que pasó hoy o por algo que pasó entonces?". La mayoría de las alarmas no traen datos nuevos.' },
      { t: 'Practica no saber', d: 'Un día sin preguntar dónde está el otro, sin revisar, sin confirmar. Es incómodo y es el punto: comprobar que la ausencia de control no produce el desastre que anticipas.' },
      { t: 'Suelta la mandíbula tres veces al día', d: 'Aflojar conscientemente el maxilar, el cuello y las manos. El marco lo dice al revés y también es cierto: la máscara tiene cuerpo, y a veces el cuerpo cede antes que la idea.' },
    ],
    faq: [
      ['¿Ser desconfiado es malo?', 'La desconfianza es una función útil: protege. Se vuelve máscara cuando deja de responder a los datos del presente y empieza a aplicarse a todos por igual, incluidos quienes nunca fallaron.'],
      ['¿Por qué me cuesta tanto delegar?', 'Porque delegar es soltar, y en tu historia soltar tuvo un costo alto. No es que no confíes en la capacidad del otro: es que confiar activa un riesgo que ya conociste.'],
      ['¿Se puede volver a confiar después de una traición?', 'Sí, pero no volviendo a la confianza ciega de antes. Lo que se construye después es otra cosa: una confianza que sabe lo que puede pasar y elige igual. Es menos romántica y bastante más sólida.'],
    ],
  },
  {
    id: 'injusticia',
    herida: 'Injusticia',
    mascara: 'La Máscara Rígida',
    mascaraCorta: 'Rígida',
    frase: 'El perfeccionismo te mantiene de pie y a la vez te impide decidir. Ordenas por fuera lo que no sabes cómo ordenar por dentro.',
    vida: 'Mides todo con una vara que no le aplicas a nadie más. Postergas por miedo a que salga mal. Sientes que relajarte es bajar la guardia, y bajar la guardia es peligroso.',
    cuerpo: 'Todo el cuerpo recto, rígido.',
    keyword: 'herida de injusticia',
    intro: [
      'La herida de injusticia se forma en un entorno donde el afecto dependía del desempeño y las reglas se aplicaban de manera desigual. No dolió el rigor: dolió que el rigor fuera arbitrario, que lo mismo a veces estuviera bien y a veces no, sin que se pudiera predecir.',
      'De ahí sale la Máscara Rígida: si soy impecable, no me pueden acusar de nada. El perfeccionismo no es amor por la excelencia; es un sistema de defensa que funciona tan bien que nadie sospecha que hay algo debajo.',
    ],
    origen: 'Aparece con adultos exigentes y poco disponibles emocionalmente, o con un trato desigual entre hermanos que nunca se nombró. También en familias donde el error se castigaba y el acierto se daba por hecho. El niño no concluye "esto es injusto": concluye "tengo que hacerlo perfecto para que no me caiga encima".',
    adultez: [
      'Mides todo con una vara que no le aplicas a nadie más, y encima crees que esa vara es lo normal.',
      'Postergas cosas importantes por miedo a que salgan mal. El perfeccionismo, visto de cerca, produce menos trabajo terminado, no más.',
      'Te cuesta tomar decisiones porque cada opción se evalúa contra un óptimo que no existe.',
      'Relajarte se siente como bajar la guardia. El descanso llega solo cuando el cuerpo lo impone, casi siempre enfermándose.',
      'Reconoces poco lo hecho. Cuando algo sale bien, el foco pasa de inmediato a lo que faltó.',
    ],
    pareja: [
      'Corriges. Detalles, formas, maneras de hacer las cosas, y cada corrección es objetivamente cierta y acumulativamente demoledora.',
      'Te cuesta mostrarte desarmado. La vulnerabilidad se siente como un error de cálculo, no como cercanía.',
      'Llevas una contabilidad interna de quién hizo qué. Cuando el balance se rompe, aparece una indignación que sorprende al otro por su tamaño.',
      'La ternura te resulta más difícil que la responsabilidad. Cumplir sabes; abandonarte a algo, menos.',
    ],
    bucles: [
      '«Si no está perfecto, no sirve.»',
      '«Debiste hacerlo bien.»',
      '«Descansar es para cuando termine todo.» (y nunca termina todo)',
    ],
    corazaLarga: 'Se aloja en todo el eje: cuerpo recto, espalda tensa, movimientos contenidos. Es la coraza más difícil de ver porque se lee como buena postura y como disciplina. La pista está en que no se puede soltar a voluntad — un cuerpo que solo descansa cuando se rompe no está descansando.',
    trabajo: [
      { t: 'Entrega algo en 80%', d: 'Elige una tarea de bajo riesgo y déjala explícitamente incompleta. La ansiedad que aparece muestra el tamaño real del acuerdo interno que estás rompiendo.' },
      { t: 'Aplícate tu propia vara', d: 'Cuando te juzgues, escribe la frase y pregúntate si se la dirías a alguien que quieres. La diferencia entre esas dos varas es la herida operando.' },
      { t: 'Decide rápido en lo pequeño', d: 'Qué comer, qué película, qué ruta. Practicar decisiones sin optimizar entrena el músculo que la rigidez tiene atrofiado.' },
      { t: 'Programa el descanso como una obligación', d: 'Paradójico y efectivo: si el descanso está en la lista, el sistema lo permite. Con el tiempo deja de necesitar el permiso.' },
    ],
    faq: [
      ['¿El perfeccionismo es siempre una herida?', 'No. Hay exigencia que nace del gusto por hacer bien las cosas y se disfruta. La de la herida no se disfruta: alivia por un rato y vuelve. La diferencia se nota en lo que queda después de terminar, no durante.'],
      ['¿Por qué me cuesta tanto decidir?', 'Porque decidir implica aceptar que se pierde una opción, y en un sistema donde el error se castigaba, perder una opción se parece demasiado a equivocarse. No es indecisión: es protección.'],
      ['¿Se puede ser exigente sin la máscara rígida?', 'Sí, y esa es la salida realista. No se trata de bajar el estándar sino de sacarle el castigo: hacer bien las cosas porque importa, no para no ser acusado de nada.'],
    ],
  },
];

export const porId = (id: string) => HERIDAS.find((h) => h.id === id);
