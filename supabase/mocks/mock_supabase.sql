-- ============================================================
-- SEED: Datos de prueba realistas para AgoraShell
-- Usuarios: hannah, Alex, noelia
-- Para purgar: ejecutar el bloque PURGE al final
-- ============================================================

DO $$
DECLARE
  hannah uuid := '60093964-9b64-47a4-b019-f231f9cbd842';
  alex   uuid := '6b361be8-f5bd-49c9-a02e-ff513f2d1083';
  noelia uuid := 'acb3572e-5eaf-4c9f-ae95-29590a901374';

  ch_tech      uuid;
  ch_ciencia   uuid;
  ch_gaming    uuid;
  ch_politica  uuid;
  ch_arte      uuid;
  ch_musica    uuid;
  ch_deportes  uuid;
  ch_cine      uuid;
  ch_viajes    uuid;
  ch_filosofia uuid;

  t01 uuid; t02 uuid; t03 uuid; t04 uuid; t05 uuid;
  t06 uuid; t07 uuid; t08 uuid; t09 uuid; t10 uuid;
  t11 uuid; t12 uuid; t13 uuid; t14 uuid; t15 uuid;
  t16 uuid; t17 uuid; t18 uuid; t19 uuid; t20 uuid;
  t21 uuid; t22 uuid; t23 uuid; t24 uuid; t25 uuid;

  r1 uuid; r2 uuid; r3 uuid; r4 uuid; r5 uuid;

BEGIN

  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Tecnología', 'Software, hardware, IA y el futuro digital', 'tecnologia', '💻', hannah) RETURNING id INTO ch_tech;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Ciencia', 'Física, biología, astronomía y los misterios del universo', 'ciencia', '🔬', alex) RETURNING id INTO ch_ciencia;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Gaming', 'Videojuegos, reviews, noticias y comunidad gamer', 'gaming', '🎮', noelia) RETURNING id INTO ch_gaming;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Política y Sociedad', 'Debate respetuoso sobre eventos políticos y sociales globales', 'politica-sociedad', '🌍', hannah) RETURNING id INTO ch_politica;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Arte y Diseño', 'Ilustración, diseño gráfico, arquitectura y expresión visual', 'arte-diseno', '🎨', noelia) RETURNING id INTO ch_arte;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Música', 'Géneros, artistas, producción musical y recomendaciones', 'musica', '🎵', alex) RETURNING id INTO ch_musica;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Deportes', 'Fútbol, baloncesto, atletismo y todo el mundo deportivo', 'deportes', '⚽', hannah) RETURNING id INTO ch_deportes;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Cine y Series', 'Reseñas, teorías, estrenos y clásicos del séptimo arte', 'cine-series', '🎬', alex) RETURNING id INTO ch_cine;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Viajes y Cultura', 'Destinos, experiencias, gastronomía y culturas del mundo', 'viajes-cultura', '✈️', noelia) RETURNING id INTO ch_viajes;
  INSERT INTO channels (name, description, slug, icon, created_by) VALUES ('Filosofía', 'Ética, existencialismo, lógica y grandes preguntas humanas', 'filosofia', '🧠', hannah) RETURNING id INTO ch_filosofia;

  -- TOPICS TECNOLOGÍA
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_tech, '¿La inteligencia artificial reemplazará a los programadores en 10 años?', '<p>Con el avance de herramientas como GitHub Copilot, ChatGPT y los modelos de código abierto, muchos se preguntan si los desarrolladores de software tendrán trabajo en la próxima década. Los modelos de lenguaje ya pueden escribir funciones completas, corregir bugs y hasta diseñar arquitecturas básicas.</p><p>Sin embargo, hay quienes argumentan que la IA es solo una herramienta más, como lo fue el compilador o los frameworks. La creatividad, el entendimiento del negocio y la capacidad de hacer las preguntas correctas seguirán siendo habilidades humanas difíciles de automatizar.</p>', hannah) RETURNING id INTO t01;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_tech, 'Linux vs Windows en 2025: ¿sigue siendo relevante el debate?', '<p>Durante años el debate Linux vs Windows fue casi religioso entre los entusiastas de la tecnología. Hoy, con WSL2, Linux en el escritorio ha mejorado enormemente y Windows ha adoptado muchas características del mundo Unix.</p><p>Para desarrollo web, ciencia de datos o DevOps, Linux sigue siendo el rey. Pero para gaming, diseño o productividad empresarial, Windows tiene ventajas claras.</p>', alex) RETURNING id INTO t02;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_tech, 'Rust está comiendo el mercado de C++: ¿es un cambio permanente?', '<p>Mozilla creó Rust como una alternativa segura a C++ y en pocos años el lenguaje ha ganado terreno en sistemas operativos, WebAssembly, blockchain y hasta en el kernel de Linux. La promesa de seguridad de memoria sin garbage collector es muy atractiva para proyectos críticos.</p>', noelia) RETURNING id INTO t03;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_tech, 'El problema con los smartphones modernos: todos son iguales', '<p>Recuerdo cuando comprar un teléfono nuevo era emocionante. Cada marca tenía su identidad: Nokia era durabilidad, Sony Ericsson era multimedia, BlackBerry era productividad. Hoy todos los teléfonos son rectangulares negros con pantalla enorme y cámara prominente.</p>', hannah) RETURNING id INTO t04;

  -- TOPICS CIENCIA
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_ciencia, 'El telescopio James Webb está cambiando todo lo que creíamos saber del universo', '<p>Las imágenes del James Webb Space Telescope han sorprendido incluso a los astrofísicos más experimentados. Galaxias masivas y completamente formadas aparecen en épocas del universo donde según los modelos estándar no deberían existir todavía.</p>', noelia) RETURNING id INTO t05;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_ciencia, 'CRISPR y la edición genética: ¿estamos listos como sociedad?', '<p>La tecnología CRISPR-Cas9 permite editar el genoma con una precisión sin precedentes. Ya se han realizado ensayos clínicos exitosos para enfermedades como la anemia falciforme y la beta-talasemia.</p>', alex) RETURNING id INTO t06;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_ciencia, 'La paradoja de Fermi en 2025: ¿por qué seguimos solos?', '<p>Con miles de exoplanetas confirmados, muchos en zonas habitables, y una Vía Láctea con 400 mil millones de estrellas, la pregunta de Fermi sigue sin respuesta. Las explicaciones van desde el Gran Filtro hasta la hipótesis del zoo.</p>', hannah) RETURNING id INTO t07;

  -- TOPICS GAMING
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_gaming, 'Elden Ring dos años después: sigue siendo el mejor FromSouls', '<p>Han pasado más de dos años desde el lanzamiento de Elden Ring y el juego sigue siendo el punto de referencia del género. La expansión Shadow of the Erdtree demostró que FromSoftware no pierde el toque.</p>', alex) RETURNING id INTO t08;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_gaming, 'Indie games vs AAA: ¿quién está innovando más en 2024?', '<p>Mientras los grandes estudios siguen apostando por secuelas y remasters, el sector indie ha producido algunas de las experiencias más originales: Hollow Knight, Hades, Stardew Valley, Celeste, Disco Elysium.</p>', noelia) RETURNING id INTO t09;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_gaming, 'El problema del gaming moderno: demasiados juegos, poco tiempo', '<p>El backlog de juegos se ha convertido en una fuente de ansiedad para muchos gamers adultos. Entre los Game Pass, PlayStation Plus y las ofertas de Steam, hay más juegos buenos de los que físicamente se pueden jugar en una vida.</p>', hannah) RETURNING id INTO t10;

  -- TOPICS POLÍTICA
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_politica, 'La polarización política en redes sociales: ¿causa o consecuencia?', '<p>Los algoritmos de las redes sociales están diseñados para maximizar el engagement, y el contenido que más genera interacción es el que provoca respuestas emocionales fuertes: indignación, miedo, tribalismo.</p>', noelia) RETURNING id INTO t11;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_politica, 'El futuro del trabajo: renta básica universal vs empleo garantizado', '<p>Con la automatización avanzando y la IA eliminando empleos en sectores que antes parecían seguros, el debate sobre el futuro del trabajo se vuelve urgente.</p>', alex) RETURNING id INTO t12;

  -- TOPICS ARTE
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_arte, 'El arte generado por IA y la crisis de identidad de los artistas digitales', '<p>Midjourney, Stable Diffusion y DALL-E han democratizado la creación de imágenes de alta calidad visual. Las IAs se entrenaron con millones de imágenes de artistas sin su consentimiento ni compensación.</p>', hannah) RETURNING id INTO t13;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_arte, 'Diseño brutalista web: ¿tendencia pasajera o regreso legítimo?', '<p>El brutalismo web, caracterizado por tipografías enormes, colores agresivos y asimetría deliberada, ha ganado tracción entre diseñadores jóvenes como reacción al minimalismo genérico.</p>', noelia) RETURNING id INTO t14;

  -- TOPICS MÚSICA
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_musica, 'El vinilo no murió: por qué el formato analógico sigue creciendo', '<p>Las ventas de discos de vinilo llevan más de 15 años consecutivos de crecimiento. Hay algo en el ritual del vinilo que el streaming no puede replicar: sacar el disco de su funda, colocarlo en el tornamesa.</p>', alex) RETURNING id INTO t15;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_musica, 'Hyperpop: ¿el género más interesante o más irritante del siglo XXI?', '<p>El hyperpop surgió de SoundCloud y PC Music y se convirtió en uno de los géneros más polarizantes. Artistas como 100 gecs, Charli XCX, Sophie y Arca empujaron los límites de lo que puede considerarse pop.</p>', hannah) RETURNING id INTO t16;

  -- TOPICS DEPORTES
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_deportes, 'El debate eterno: ¿Messi o Ronaldo y por qué ya no importa?', '<p>Durante más de una década el debate Messi vs Ronaldo consumió energía infinita. Messi ganó el Mundial con Argentina en 2022, completando el único trofeo que le faltaba.</p>', noelia) RETURNING id INTO t17;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_deportes, 'La NBA en 2025: la era post-Curry y el nuevo orden', '<p>Stephen Curry transformó el baloncesto. El tiro de tres puntos pasó de ser un recurso secundario a ser el fundamento de prácticamente cada ofensiva de la liga.</p>', alex) RETURNING id INTO t18;

  -- TOPICS CINE
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_cine, 'El cine de autor está muriendo en las salas: ¿la culpa es del streaming?', '<p>Las salas se han convertido en territorio casi exclusivo de franquicias Marvel, DC y remakes. Hace veinte años películas como Eternal Sunshine tenían estrenos teatrales significativos.</p>', hannah) RETURNING id INTO t19;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_cine, 'Dune Parte 2: Denis Villeneuve y el arte de adaptar lo inadaptable', '<p>Durante décadas se dijo que Dune era inadaptable. Denis Villeneuve hizo lo imposible: dos películas que respetan la complejidad del material fuente mientras son espectáculos cinematográficos accesibles.</p>', noelia) RETURNING id INTO t20;

  -- TOPICS VIAJES
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_viajes, 'Japón en 2024: el turismo masivo está arruinando la experiencia', '<p>Japón reabrió sus fronteras post-pandemia y el resultado fue una avalancha de turistas. Kioto, Tokio y el Monte Fuji están saturados hasta el punto de que los residentes locales han empezado a cerrar calles.</p>', alex) RETURNING id INTO t21;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_viajes, 'Viajar solo: la experiencia más transformadora que puedes darte', '<p>Hubo un punto en mi vida donde decidí tomar un vuelo solo, sin itinerario fijo, a un país donde no conocía a nadie. Fue aterrador las primeras 48 horas y absolutamente liberador después.</p>', noelia) RETURNING id INTO t22;

  -- TOPICS FILOSOFÍA
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_filosofia, 'El libre albedrío en la era de la neurociencia: ¿ilusión o realidad?', '<p>Los experimentos de Benjamin Libet mostraron que la actividad cerebral que precede a una decisión consciente ocurre antes de que la persona reporte haber tomado esa decisión. Si cada decisión es resultado de procesos físicos, ¿en qué sentido somos libres?</p>', hannah) RETURNING id INTO t23;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_filosofia, 'El estoicismo se puso de moda: ¿filosofía real o solo aesthetic?', '<p>Marco Aurelio, Epicteto y Séneca se convirtieron en los filósofos más citados en libros de autoayuda y podcasts de productividad. Hay una tensión entre el estoicismo como práctica filosófica seria y el estoicismo como frases motivacionales descontextualizadas.</p>', alex) RETURNING id INTO t24;
  INSERT INTO topics (channel_id, title, content, author_id) VALUES (ch_filosofia, 'Hipótesis de la simulación: ¿seguimos hablando de esto en serio?', '<p>Nick Bostrom argumentó en 2003 que al menos una de tres cosas debe ser verdad: las civilizaciones avanzadas se extinguen antes de poder simular realidades, eligen no hacerlo, o estamos en una simulación. Con el avance de la computación, ¿la hipótesis gana o pierde fuerza?</p>', noelia) RETURNING id INTO t25;

  -- ============================================================
  -- REPLIES - t01 IA y programadores
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>La IA es una herramienta, no un reemplazo. Los programadores que la usen serán más productivos, pero siempre habrá necesidad de alguien que entienda el problema de negocio.</p>', hannah) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r1, '<p>Exactamente. El problema nunca fue escribir código, sino entender qué código escribir. Eso requiere contexto y comunicación con humanos que la IA no tiene.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r2, '<p>Aunque la IA ya es bastante buena en entender contexto cuando le das información suficiente. El gap se está cerrando rápido, hay que ser honestos.</p>', noelia) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r3, '<p>Cerrando pero no eliminando. Para proyectos complejos con años de deuda técnica, la IA todavía se pierde completamente.</p>', alex) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r4, '<p>Eso cambiará cuando los modelos puedan leer repositorios enteros. Ya estamos viendo eso con algunas herramientas como Cursor.</p>', hannah) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r5, '<p>Cursor lo uso diariamente y es impresionante para tareas acotadas. Pero cuando el problema es ambiguo, sigue fallando de maneras costosas.</p>', noelia);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>Trabajo en consultoría y ya usamos IA para boilerplate, tests y documentación. Ahorra un 30% del tiempo. Pero el diseño de sistemas es 100% humano.</p>', noelia) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r1, '<p>El 30% es conservador. En tareas bien definidas ahorra más del 60%. Lo que consume tiempo son los meetings y requisitos cambiantes.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r2, '<p>La IA puede escribir el código pero no puede estar en la reunión donde el cliente pide exactamente lo contrario a lo que pidió la semana pasada.</p>', hannah) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r3, '<p>Jajaja, tan cierto. Eso no lo automatiza nadie mientras los humanos seamos así de inconsistentes.</p>', noelia) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r4, '<p>Hay herramientas que ya generan documentación automáticamente a partir de los commits y conversaciones del equipo. El trabajo burocrático también se está automatizando.</p>', alex);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>Me preocupa más el efecto en programadores junior. Si la IA hace el trabajo básico, ¿cómo van a construir intuición? Se necesita cometer errores propios para entender por qué las cosas funcionan.</p>', alex) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r1, '<p>Es como calculadoras en matemáticas. Hay debate sobre si entorpecen la comprensión fundamental o liberan energía para conceptos más altos.</p>', hannah) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r2, '<p>La diferencia es que una calculadora no te da el proceso. La IA sí. Un junior que lee y entiende código de IA puede aprender mucho si tiene disciplina.</p>', noelia) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r3, '<p>O puede volverse dependiente sin entender nada. Depende del individuo y de la cultura del equipo donde trabaje.</p>', alex) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t01, r4, '<p>Los buenos mentores van a ser más valiosos que nunca. El rol del senior cambia: menos escribir código, más enseñar a evaluar código generado por IA.</p>', hannah);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>En 10 años no, pero en 20-30 sí creo que el rol cambiará radicalmente. La pregunta es si habrá trabajo suficiente para todos.</p>', hannah);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>Ya estoy usando Cursor y Claude para programar y mi productividad se triplicó. Pero también cometo errores que antes no cometería porque confío demasiado en el output.</p>', noelia);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>La ingeniería de prompts es una habilidad real. Saber cómo darle contexto a una IA y validar resultados es la nueva programación básica.</p>', alex);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>Lo que me fascina es que la IA está haciendo que programar sea más accesible para no programadores. Diseñadores y PMs ahora pueden crear prototipos funcionales.</p>', hannah);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>Eso puede ser un arma de doble filo. Más personas creando software mal arquitecturado sin entender las implicaciones de seguridad.</p>', noelia);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t01, '<p>¿Y eso es diferente a lo que pasaba con WordPress hace 15 años? La democratización siempre tiene ese costo y generalmente vale la pena.</p>', alex);

  -- ============================================================
  -- REPLIES - t02 Linux vs Windows
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t02, '<p>Llevo 8 años en Linux exclusivamente para trabajo y no volvería. Pop_OS hace que el hardware funcione sin complicaciones y el entorno de desarrollo es simplemente mejor.</p>', noelia) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r1, '<p>Pop_OS es excelente pero últimamente Fedora me convence más. Más actualizado, más estable para trabajo diario.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r2, '<p>Fedora es mi recomendación para quien viene de Windows. No tan bleeding edge como Arch pero tampoco tan conservadora como Ubuntu LTS.</p>', hannah) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r3, '<p>Arch Linux btw. La instalación manual te obliga a entender cada componente. Una vez que lo haces sabes exactamente por qué tu sistema funciona.</p>', noelia) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r4, '<p>Arch es genial hasta que tienes que entregar algo mañana y una actualización rompió tu entorno. La estabilidad tiene valor real en producción.</p>', alex) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r5, '<p>Por eso uso Arch en el equipo personal y algo más estable en el de trabajo. Lo mejor de ambos mundos.</p>', hannah);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t02, '<p>Para gaming Windows sigue siendo necesario. Proton ha mejorado pero todavía hay juegos con anti-cheat que no funcionan en Linux.</p>', alex) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r1, '<p>El Steam Deck aceleró esto bastante. Valve tiene un incentivo económico real para que Proton funcione perfecto.</p>', hannah) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r2, '<p>El Steam Deck fue el mejor argumento para Linux gaming que ha existido. Ver números reales de compatibilidad cambió la conversación.</p>', noelia);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t02, '<p>WSL2 cambió todo para los desarrolladores web en Windows. Ya no necesito una VM completa. Es suficientemente bueno para el 90% de los casos de uso.</p>', hannah) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r1, '<p>Suficientemente bueno no es lo mismo que bueno. El acceso a archivos entre Windows y WSL sigue siendo lento y hay edge cases que rompen el flujo regularmente.</p>', noelia) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t02, r2, '<p>Para desarrollo web moderno con Node y Docker, WSL2 funciona perfectamente el 95% del tiempo. Los edge cases son menos frecuentes de lo que la comunidad Linux hace creer.</p>', alex);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t02, '<p>El debate ya no es Linux vs Windows sino qué necesidades tienes. Para DevOps: Linux. Para diseño: Mac. Para gaming: Windows. Simple.</p>', noelia);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t02, '<p>macOS siendo ignorado en este debate como siempre. Para muchos developers es el mejor de los dos mundos: Unix debajo, apps nativas de calidad encima.</p>', hannah);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t02, '<p>macOS sería perfecto si no fuera por el precio del hardware y la política de reparabilidad de Apple.</p>', alex);

  -- ============================================================
  -- REPLIES - t05 James Webb
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t05, '<p>El hallazgo que más me impactó fue GLASS-z13, una galaxia completamente formada a solo 300 millones de años después del Big Bang. Estamos básicamente reescribiendo la cosmología.</p>', hannah) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t05, r1, '<p>Para ponerlo en perspectiva: ver galaxias maduras a 300 millones de años es como encontrar a alguien de 80 años que ya tenía una carrera establecida a los 2.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t05, r2, '<p>Las tasas de formación estelar que implican esas observaciones son extremadamente altas según los modelos actuales. Algo no cuadra.</p>', noelia) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t05, r3, '<p>Una posibilidad es que la materia oscura jugó un papel más activo en la formación temprana de estructuras. Hay varios papers nuevos explorando eso.</p>', hannah) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t05, r4, '<p>También hay quienes están revisitando teorías alternativas como MOND. El JWST está dando argumentos a ambos lados del debate.</p>', alex) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t05, r5, '<p>La ciencia siendo ciencia: una nueva observación abre más preguntas de las que cierra. Es frustrante y emocionante al mismo tiempo.</p>', noelia);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t05, '<p>Lo que me parece más significativo es el análisis de atmósferas de exoplanetas. Detectar CO2 y metano en planetas de otros sistemas es el primer paso hacia encontrar biosignaturas.</p>', alex) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t05, r1, '<p>K2-18b y su posible dimetilsulfuro fue emocionante aunque hay que ser cautelosos. La interpretación de espectros tiene muchos márgenes de error.</p>', noelia) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t05, r2, '<p>Estamos literalmente oliendo la atmósfera de planetas a decenas de años luz. Eso es extraordinario independientemente de lo que resulte ser.</p>', hannah);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t05, '<p>Sigo todas las publicaciones del JWST en arXiv. La velocidad a la que está generando datos es increíble.</p>', noelia);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t05, '<p>Comparar una imagen de Hubble con una del JWST del mismo objeto es casi filosofía. De repente todo lo que creíamos ver era solo el principio.</p>', alex);

  -- ============================================================
  -- REPLIES - t08 Elden Ring
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t08, '<p>Elden Ring tiene los mejores bosses del género por lejos. Malenia, Radahn, Maliketh, Morgott. Ningún Dark Souls tiene una densidad tan alta de encuentros memorables.</p>', hannah) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t08, r1, '<p>Malenia es el mejor boss de FromSoftware en términos de diseño de moveset. Aunque su agresividad y el lifesteal la hacen injusta para ciertos builds.</p>', noelia) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t08, r2, '<p>El lifesteal es intencional para forzarte a jugar agresivo. Una vez que entiendes eso el fight se vuelve más manejable aunque igual brutal.</p>', alex) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t08, r3, '<p>O subir nivel hasta que el fight sea manejable. El juego es generoso en ese sentido, siempre tienes opciones para reducir la dificultad sin quitarla por completo.</p>', hannah) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t08, r4, '<p>Lo bueno de FromSoftware es que siempre puedes equipar mejor equipo si un boss te bloquea. La dificultad es opcional en ese sentido.</p>', noelia) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t08, r5, '<p>Sekiro no te da esa opción y es mejor juego por eso en mi opinión. Te obliga a aprender de verdad.</p>', alex);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t08, '<p>Prefiero los mapas interconectados de Dark Souls 1. Descubrir que Blighttown conecta con el Valle de los Dracones es un momento de diseño que Elden Ring no puede replicar.</p>', noelia) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t08, r1, '<p>Elden Ring tiene sus propios momentos dentro de los legacy dungeons. El ascenso de Raya Lucaria o las catacumbas debajo de Stormveil son comparables.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t08, r2, '<p>Están buenos pero son islas dentro de un mundo abierto. En DS1 todo estaba conectado y cada atajo era una victoria personal sobre el mapa mismo.</p>', hannah) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t08, r3, '<p>Son experiencias diferentes que buscan lograr cosas diferentes. Comparar Elden Ring con DS1 es como comparar una novela con un cuento.</p>', noelia);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t08, '<p>Shadow of the Erdtree me pareció mejor que la mayoría de juegos completos de 2024. La densidad de bosses y lore en ese DLC es impresionante.</p>', alex);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t08, '<p>Mi ranking: DS1 > Elden Ring > Bloodborne > DS3 > Sekiro > DS2. Aunque Bloodborne y Sekiro son casi imposibles de rankear porque son géneros diferentes.</p>', hannah);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t08, '<p>La falta de builds en Sekiro lo hace menos rejugable. Una de las alegrías de Elden Ring es que cada playthrough puede ser radicalmente diferente.</p>', noelia);

  -- ============================================================
  -- REPLIES - t11 Polarización política
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t11, '<p>Creo que las redes sociales son amplificadoras, no causas. La polarización tiene raíces económicas: décadas de estancamiento salarial y desigualdad creciente crean las condiciones para el tribalismo.</p>', alex) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t11, r1, '<p>Hay evidencia de esto. Los países con menor desigualdad tienden a tener menor polarización aunque usen las mismas redes sociales.</p>', hannah) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t11, r2, '<p>También hay países con alta desigualdad y baja polarización. Es multifactorial: instituciones, historia, sistema electoral.</p>', noelia) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t11, r3, '<p>El sistema electoral importa mucho. Los sistemas de representación proporcional tienden a producir menos polarización porque necesitas coaliciones para gobernar.</p>', alex) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t11, r4, '<p>Gran Bretaña vs Alemania son un experimento natural interesante. Más fragmentación en Alemania pero menos odio entre facciones que en UK.</p>', hannah) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t11, r5, '<p>La fragmentación tiene su propio problema cuando da poder desproporcionado a partidos minoritarios extremos que actúan como kingmakers.</p>', noelia);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t11, '<p>Los algoritmos de maximización de engagement son activamente dañinos para la deliberación democrática. La polarización genera más clicks que el acuerdo.</p>', hannah) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t11, r1, '<p>Las plataformas no van a reducir voluntariamente su engagement. Necesitas regulación externa o modelos de negocio alternativos.</p>', noelia) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t11, r2, '<p>Mastodon es un experimento interesante en esto. Sin algoritmo de maximización, el tono del discourse es notablemente diferente. Más aburrido también, hay que reconocerlo.</p>', alex);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t11, '<p>La solución más prometedora es la alfabetización mediática desde temprana edad. No eliminar las redes sino enseñar a usarlas críticamente.</p>', noelia);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t11, '<p>La sobreexposición a outrage constante tiene un costo psicológico real: ansiedad, cinismo y sensación de que el mundo está peor de lo que estadísticamente está.</p>', hannah);

  -- ============================================================
  -- REPLIES - t13 Arte e IA
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t13, '<p>Soy diseñadora freelance y puedo decir que el impacto es real. Clientes que antes pagaban por ilustraciones personalizadas ahora me piden que refine outputs de Midjourney. El trabajo bajó un 40%.</p>', noelia) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t13, r1, '<p>La industria del concept art para videojuegos está siendo golpeada especialmente fuerte. Algunos estudios ya usan IA para iteraciones iniciales.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t13, r2, '<p>El refinamiento final sigue siendo una habilidad cara. Hay una ventana para artistas que aprendan a usar IA como herramienta sin perder su criterio estético.</p>', hannah) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t13, r3, '<p>Es fácil decir eso cuando no es tu trabajo el que está siendo reemplazado. La transición tiene costos reales para personas reales.</p>', noelia) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t13, r4, '<p>Tienes razón. Reconocer que hay costos humanos reales no es incompatible con reconocer que la tecnología avanzará independientemente.</p>', alex) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t13, r5, '<p>Hay que tener ambas conversaciones en paralelo: cómo proteger a los trabajadores en la transición Y cómo prepararse para el nuevo panorama.</p>', hannah);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t13, '<p>El problema legal del entrenamiento sin consentimiento es el más importante. Artistas como Greg Rutkowski se convirtieron en prompt involuntariamente.</p>', hannah) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t13, r1, '<p>Algunas plataformas ya implementan opt-out para artistas pero sigue siendo opt-out cuando debería ser opt-in por defecto.</p>', noelia) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t13, r2, '<p>Adobe Firefly se entrenó solo con imágenes licenciadas. Es más lento para desarrollar pero puede ser el modelo ético que gane a largo plazo.</p>', alex);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t13, '<p>Uso IA para el trabajo y también soy artista tradicional como hobby. Los uso para cosas diferentes. El arte manual tiene un valor meditativo que ninguna IA puede replicar.</p>', alex);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t13, '<p>La pregunta filosófica: ¿qué hace que algo sea arte? Si es la intención y el criterio curatorial, un humano usando IA puede hacer arte.</p>', hannah);

  -- ============================================================
  -- REPLIES - t17 Messi vs Ronaldo
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t17, '<p>El Mundial de 2022 cerró el debate. No porque Messi sea mejor en términos absolutos sino porque completó el único argumento que faltaba.</p>', alex) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t17, r1, '<p>El argumento de Ronaldo siempre fue los goles y los títulos individuales. Messi tiene más Balones de Oro, más asistencias, y ahora el Mundial.</p>', hannah) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t17, r2, '<p>Ronaldo tiene la Champions con tres equipos diferentes y eso no es menor. Demostrar ese nivel en contextos tan distintos dice algo sobre su adaptación.</p>', noelia) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t17, r3, '<p>Messi ganó Champions, Liga, Copa del Rey, Copa América y el Mundial. Si quieres hablar de palmarés, Messi gana esa conversación también.</p>', alex) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t17, r4, '<p>La diferencia es el contexto. Messi siempre estuvo en el mejor equipo del mundo durante su prime en Barcelona.</p>', noelia) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t17, r5, '<p>¿Xavi, Iniesta, Puyol eran de relleno? Los dos tuvieron equipos excelentes en sus mejores épocas, no hay que minimizar eso.</p>', hannah);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t17, '<p>Lo que ambos demostraron es que el talento más los hábitos de trabajo más la mentalidad competitiva pueden sostenerse en el tiempo. A los 36 ambos seguían siendo determinantes.</p>', noelia) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t17, r1, '<p>La longevidad de Ronaldo especialmente es extraordinaria desde el punto de vista atlético. Transformó su cuerpo completamente sin perder el instinto goleador.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t17, r2, '<p>Messi en cambio mantuvo el mismo cuerpo y estilo durante 20 años. Son dos aproximaciones completamente diferentes a la longevidad deportiva.</p>', hannah);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t17, '<p>Agradezco que hayamos tenido esta generación. Con Messi y Ronaldo no hay el problema de "no los vi en su prime" que existe con Pelé y Maradona.</p>', alex);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t17, '<p>El legado real será la influencia en la siguiente generación. Yamal y Mbappe mencionan a ambos como inspiraciones.</p>', hannah);

  -- ============================================================
  -- REPLIES - t21 Japón turismo
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t21, '<p>Estuve en Kioto en 2023 y la situación en el barrio de Gion es caótica. Los fotógrafos de geishas son una plaga, persiguiendo a mujeres locales con cámaras en la cara.</p>', hannah) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t21, r1, '<p>Muchos turistas tienen una imagen de Japón construida por Instagram y anime que no corresponde a la realidad. Van a buscar una fantasía y destruyen lo que la hace real.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t21, r2, '<p>Lo mismo pasa en Venecia, Dubrovnik, Hallstatt. El turismo masivo y el turismo de Instagram están matando los mismos lugares que hacen virales.</p>', noelia) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t21, r3, '<p>Algunas ciudades están probando el turismo de cuota con precios premium. Bhutan lo hizo durante décadas con bastante éxito.</p>', hannah) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t21, r4, '<p>Eso elitiza el viaje. Hay un argumento de justicia en que viajar no debería ser solo para los que pueden pagar cuotas de conservación.</p>', alex) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t21, r5, '<p>Contraargumento: los efectos del turismo masivo son regresivos. Los residentes locales de clase media son los más afectados por los precios inflados.</p>', noelia);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t21, '<p>La respuesta práctica: evitar los hotspots de Instagram, viajar en temporada baja, quedarse más tiempo en menos lugares.</p>', alex);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t21, '<p>Hay zonas de Japón como Tohoku o el norte de Hokkaido prácticamente inexploradas por el turismo internacional. Igual de hermosas, sin las multitudes.</p>', hannah);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t21, '<p>La pandemia paradójicamente fue un reset para muchos destinos. Los residentes de Venecia dijeron que por primera vez en décadas pudieron disfrutar su ciudad.</p>', noelia);

  -- ============================================================
  -- REPLIES - t23 Libre albedrío
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t23, '<p>Los experimentos de Libet tienen problemas metodológicos serios. La tarea era extremadamente simple y el margen de error en el auto-reporte de la decisión es significativo.</p>', alex) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t23, r1, '<p>Cierto, pero estudios más recientes encuentran patrones similares. El potencial de preparación precede la conciencia de la decisión consistentemente en diferentes paradigmas.</p>', hannah) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t23, r2, '<p>Preceder no implica causar. El cerebro puede estar preparando opciones múltiples y la conciencia selecciona entre ellas. Eso sería libre albedrío compatible con determinismo.</p>', noelia) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t23, r3, '<p>Eso es compatibilismo y es la posición más sostenida en filosofía contemporánea. Daniel Dennett lo argumenta brillantemente.</p>', alex) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t23, r4, '<p>Harris argumenta que el compatibilismo es solo redefinir libre albedrío hasta que pierde su significado intuitivo. Si determinismo es cierto, nuestra noción cotidiana de culpa es ilusoria.</p>', hannah) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t23, r5, '<p>Harris tiene el problema de que su conclusión práctica no difiere mucho del compatibilismo: seguimos responsabilizando a la gente porque hacerlo produce mejores resultados.</p>', noelia);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t23, '<p>La pregunta de responsabilidad moral me parece la más importante. Si no hay libre albedrío en el sentido fuerte, el sistema penal debería ser puramente rehabilitador.</p>', noelia) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t23, r1, '<p>Muchos países nórdicos han avanzado en esa dirección y los resultados en reincidencia son mejores. La neurociencia puede ser argumento para sistemas de justicia más humanos.</p>', alex) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t23, r2, '<p>El argumento de la disuasión sobrevive al determinismo. Si las consecuencias del crimen son suficientemente negativas, el determinismo predice que habrá menos crimen.</p>', hannah);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t23, '<p>Lo que me resulta útil, independientemente de la metafísica, es vivir como si mis decisiones importaran. La sensación de agencia tiene efectos reales en el bienestar.</p>', hannah);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t23, '<p>William James diría lo mismo. El pragmatismo nació en parte como respuesta a este tipo de preguntas: si la diferencia práctica entre creer A o B es cero, la pregunta no tiene respuesta significativa.</p>', alex);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t23, '<p>Aunque la diferencia práctica no siempre es cero. Las creencias metafísicas tienen consecuencias sociales aunque sean abstracciones.</p>', noelia);

  -- ============================================================
  -- REPLIES - t24 Estoicismo
  -- ============================================================
  INSERT INTO replies (topic_id, content, author_id) VALUES (t24, '<p>El estoicismo popular es exactamente eso: frases de Aurelio en fondos de pantalla sin entender que las Meditaciones era un diario privado de un hombre luchando con sus propios demonios.</p>', noelia) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t24, r1, '<p>Eso es lo que más me fascina de las Meditaciones. El hombre más poderoso del mundo tenía notas privadas llenas de autocrítica y dudas. La vulnerabilidad es notable.</p>', hannah) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t24, r2, '<p>La apropiación por el mundo corporativo es lo que molesta. El estoicismo de Silicon Valley justifica la indiferencia ante la injusticia social.</p>', alex) RETURNING id INTO r3;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t24, r3, '<p>Los estoicos también tenían obligaciones cívicas. Aurelio gobernó el Imperio, no se retiró a meditar. El estoicismo incluía acción en el mundo.</p>', noelia) RETURNING id INTO r4;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t24, r4, '<p>Epicteto era esclavo y su estoicismo emergió de condiciones de opresión real. Usar esa filosofía para decirle a trabajadores explotados que se enfoquen en su actitud es una perversión.</p>', hannah) RETURNING id INTO r5;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t24, r5, '<p>El estoicismo original tenía una dimensión política: deberes hacia la comunidad, cosmopolitismo, igualdad de todos los seres racionales. Todo eso se pierde en la versión de autoayuda.</p>', alex);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t24, '<p>A pesar de todo, creo que la popularidad ha acercado a genuina curiosidad filosófica a mucha gente. Si Ryan Holiday lleva a alguien a leer las Cartas a Lucilio, el resultado es bueno.</p>', alex) RETURNING id INTO r1;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t24, r1, '<p>Ese es el argumento de la puerta de entrada. Igual que el cine de superhéroes lleva a algunos a explorar el cine de autor.</p>', noelia) RETURNING id INTO r2;
  INSERT INTO replies (topic_id, parent_id, content, author_id) VALUES (t24, r2, '<p>El problema es que la mayoría se queda en la puerta. La filosofía genuina requiere esfuerzo y las frases motivacionales son más fáciles de consumir.</p>', hannah);

  INSERT INTO replies (topic_id, content, author_id) VALUES (t24, '<p>Lo que el estoicismo ofrece que otras filosofías no ofrecen de manera tan práctica es una tecnología de gestión emocional: el triángulo de control, memento mori, la visión negativa.</p>', hannah);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t24, '<p>El Budismo tiene herramientas similares pero el estoicismo encaja mejor con la sensibilidad occidental secularizada. No requiere reencarnación ni karma.</p>', alex);
  INSERT INTO replies (topic_id, content, author_id) VALUES (t24, '<p>Cualquiera que lo practique honestamente, aunque sea la versión popular, probablemente lleva una vida con menos ansiedad. Si funciona pragmáticamente, algo de valor tiene.</p>', noelia);

  RAISE NOTICE 'Seed completado exitosamente: 10 canales, 25 topics, ~150 replies insertados.';

END $$;


-- ============================================================
-- PURGE: Ejecutar esto para eliminar todo el seed
-- Descomentar y ejecutar solo cuando quieras limpiar
-- ============================================================

/*
DELETE FROM replies WHERE author_id IN (
  '60093964-9b64-47a4-b019-f231f9cbd842',
  '6b361be8-f5bd-49c9-a02e-ff513f2d1083',
  'acb3572e-5eaf-4c9f-ae95-29590a901374'
);
DELETE FROM topics WHERE author_id IN (
  '60093964-9b64-47a4-b019-f231f9cbd842',
  '6b361be8-f5bd-49c9-a02e-ff513f2d1083',
  'acb3572e-5eaf-4c9f-ae95-29590a901374'
);
DELETE FROM channels WHERE created_by IN (
  '60093964-9b64-47a4-b019-f231f9cbd842',
  '6b361be8-f5bd-49c9-a02e-ff513f2d1083',
  'acb3572e-5eaf-4c9f-ae95-29590a901374'
);
*/
