do $$
declare
  channel_id uuid := '14c04289-d9ff-4177-9850-7fe381611ae2';
  hannah uuid := '60093964-9b64-47a4-b019-f231f9cbd842';
  alex uuid := '6b361be8-f5bd-49c9-a02e-ff513f2d1083';
  noelia uuid := 'acb3572e-5eaf-4c9f-ae95-29590a901374';
  topic_ids uuid[] := array[]::uuid[];
  tid uuid;
  rid uuid;
  authors uuid[] := array[hannah, alex, noelia];
  titles text[] := array[
    'Los mejores cómics de superhéroes de todos los tiempos',
    'Watchmen: una obra maestra del noveno arte',
    'El mundo de Maus y el Holocausto en viñetas',
    'Sin City: el noir llevado al cómic',
    'V de Vendetta y su mensaje político',
    'Saga: ciencia ficción adulta en formato cómic',
    'The Walking Dead vs la serie de TV',
    'Batman: Year One, el origen definitivo',
    'Persépolis y el cómic autobiográfico',
    'Los X-Men como metáfora de la discriminación',
    'Neil Gaiman y Sandman: sueños en papel',
    'Los mejores mangas adaptados a novela gráfica occidental',
    'Scott Pilgrim: videojuegos y romance indie',
    'From Hell: Jack el Destripador según Alan Moore',
    'Hellboy y el universo BPRD',
    'Transmetropolitan: periodismo futurista',
    '100 Bullets: conspiración y venganza',
    'Bone: la epopeya de Jeff Smith',
    'Asterix y Obelix, humor atemporal',
    'Tintín: aventura y colonialismo revisitado',
    'Los mejores cómics europeos que pocos conocen',
    'Preacher: religión y violencia en el oeste',
    'Y: El último hombre, feminismo post-apocalíptico',
    'Promethea de Alan Moore',
    'Akira y el manga cyberpunk',
    'Ghost in the Shell: filosofía y tecnología',
    'Death Note: el debate moral en cada página',
    'Berserk: la obra más oscura del manga',
    'Fullmetal Alchemist y sus temas de sacrificio',
    'One Piece: 25 años de aventuras',
    'Naruto: el ninja que conquistó el mundo',
    'Attack on Titan: libertad y opresión',
    'Vinland Saga y los vikingos',
    'Vagabond: el samurái de Takehiko Inoue',
    'Los cómics de terror de los 80s',
    'EC Comics y su influencia en el horror moderno',
    'Spawn y el auge de Image Comics',
    'Los independientes: Fantagraphics y Drawn & Quarterly',
    'Chris Ware y la complejidad visual',
    'Daniel Clowes: Ghost World y más allá',
    'Los Hernandez Brothers y Love & Rockets',
    'Frank Miller antes y después de 300',
    'Grant Morrison y sus experimentos narrativos',
    'Warren Ellis: techno-thriller en cómic',
    'Brubaker y Phillips: el mejor dúo del noir',
    'Los mejores cómics de terror psicológico',
    'Arzach de Moebius: sin palabras, pura imagen',
    'El Incal: la obra cumbre de Jodorowsky',
    'Los Eternos de Kirby: mitología moderna',
    'Nueva lectura de Planetary de Warren Ellis',
    'Los mejores one-shots del cómic independiente',
    'Locke & Key: terror familiar en viñetas',
    'Paper Girls: nostalgia ochentanera',
    'East of West: distopía americana',
    'Black Science: viajes entre dimensiones',
    'Descender: robots y emociones',
    'Lazarus: feudalismo futuro',
    'Low: esperanza bajo el mar',
    'Prophet: space opera bizarra',
    'Saga of the Swamp Thing de Alan Moore',
    'Daredevil Born Again: la caída del héroe',
    'Kraven's Last Hunt: villano como protagonista',
    'Los mejores arcos de Spider-Man',
    'Los mejores arcos de los Vengadores',
    'Thor de Jason Aaron: mitología nórdica épica',
    'Hawkeye de Fraction: el héroe cotidiano',
    'Ms. Marvel: identidad y superheroísmo',
    'Captain America de Brubaker: espionaje y política',
    'Iron Fist: kung fu y misticismo',
    'Luke Cage: el héroe de Harlem',
    'Los mejores crossovers de Marvel',
    'Los mejores crossovers de DC',
    'Crisis on Infinite Earths y el multiverso',
    'Kingdom Come: el futuro de DC',
    'JLA: la Liga de la Justicia definitiva',
    'Green Lantern: el poder de la voluntad',
    'The Flash: la velocidad como narrativa',
    'Aquaman: rehabilitando al rey del mar',
    'Wonder Woman de George Pérez',
    'Supergirl y las heroínas de DC',
    'Lex Luthor: el villano más inteligente',
    'El Joker según distintos autores',
    'Batman: The Long Halloween',
    'Batman Hush: misterio y nostalgia',
    'Batman: Arkham Asylum de Grant Morrison',
    'Los mejores cómics de ciencia ficción dura',
    'Cómics basados en videojuegos que valen la pena',
    'Adaptaciones de novelas a cómic más exitosas',
    'Cómics de terror cósmico lovecraftiano',
    'Westerns en formato cómic',
    'Cómics de piratas que merecen más atención',
    'El renacimiento del cómic español actual',
    'Cómics latinoamericanos imprescindibles',
    'Mafalda: el cómic más político de Argentina',
    'Corto Maltés: aventura y filosofía de Pratt',
    'Los mejores debuts de nuevos autores este año',
    'Cómics que deberían adaptarse al cine',
    'Adaptaciones cinematográficas que superaron al cómic',
    'El futuro del cómic digital e independiente',
    'Webtoons que compiten con el manga tradicional'
  ];
  reply_contents text[] := array[
    '<p>Totalmente de acuerdo, es una lectura obligatoria para cualquier fan del medio.</p>',
    '<p>Lo leí hace años y me cambió la perspectiva sobre lo que puede hacer el cómic como arte.</p>',
    '<p>El arte es increíble, cada página es una obra en sí misma.</p>',
    '<p>Me parece que está sobrevalorado, aunque entiendo por qué tiene tanta fama.</p>',
    '<p>La versión en blanco y negro es superior, le da una atmósfera única.</p>',
    '<p>¿Alguien más releyó esto durante la pandemia? Le da otro significado completamente.</p>',
    '<p>El guion es brillante pero las adaptaciones nunca le hacen justicia.</p>',
    '<p>Lo recomendaría a cualquiera que quiera iniciarse en el cómic adulto.</p>',
    '<p>Llevo años coleccionando ediciones especiales y esta es de mis favoritas.</p>',
    '<p>El contexto histórico le da una capa extra que pocos trabajan tan bien.</p>',
    '<p>Discrepo en varios puntos pero el debate es lo que hace interesante el tema.</p>',
    '<p>Me quedé sin palabras la primera vez que lo terminé, tardé días en procesarlo.</p>',
    '<p>La edición de biblioteca que sacaron el año pasado es espectacular.</p>',
    '<p>Para mi es top 3 del género sin dudas.</p>',
    '<p>El final me decepcionó un poco pero el camino vale cada página.</p>'
  ];
  i int;
  j int;
  author_idx int;
begin
  for i in 1..100 loop
    tid := gen_random_uuid();
    author_idx := (i % 3);
    
    insert into topics (id, channel_id, title, content, author_id, created_at)
    values (
      tid,
      channel_id,
      titles[i],
      '<p>' || titles[i] || '. Un tema que da mucho de qué hablar en la comunidad del cómic y la novela gráfica.</p>',
      authors[author_idx + 1],
      now() - (interval '1 day' * (100 - i))
    );

    topic_ids := array_append(topic_ids, tid);
  end loop;

  foreach tid in array topic_ids loop
    for j in 1..5 loop
      author_idx := (j % 3);
      rid := gen_random_uuid();
      
      insert into replies (id, topic_id, content, author_id, parent_id, created_at)
      values (
        rid,
        tid,
        reply_contents[((j - 1) % 15) + 1],
        authors[author_idx + 1],
        null,
        now() - (interval '1 hour' * (5 - j))
      );
    end loop;
  end loop;
end;
$$;
