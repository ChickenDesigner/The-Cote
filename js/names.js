/* ============================================================
   THE COTE — name pools
   500 cock names, 500 hen names, plus rare unisex specials.
   ============================================================ */

var Names = (function () {
  'use strict';

  var MALE = (
    'Abel Abner Abraham Ace Adrian Alaric Albert Alfie Algernon Alonzo ' +
    'Alvin Ambrose Amos Anders Angus Ansel Anton Archer Archie Arlo ' +
    'Armand Arnold Arthur Asa Ashton Atlas August Augustus Aurelius Austin ' +
    'Avery Axel Bailey Baldwin Barnaby Barrett Bartholomew Bash Baxter Bear ' +
    'Beau Beckett Bellamy Benedict Benjamin Bennett Benson Bertram Blaine Blaise ' +
    'Blake Bodhi Booker Boris Bowen Boyd Bradley Bram Brandon Brennan ' +
    'Brett Briar Brody Bruno Bryce Buck Burton Byron Cadmus Caleb ' +
    'Callum Calvin Camden Carlisle Carson Carter Cassius Cedric Chandler Charlie ' +
    'Chester Cicero Clarence Claude Clement Clifford Colby Cole Colin Conrad ' +
    'Cooper Corbin Cormac Cornelius Cosmo Crispin Cullen Curtis Cyrus Dalton ' +

    'Damian Damon Dane Darcy Darius Dashiell Deacon Dean Declan Denver ' +
    'Desmond Dexter Diego Digby Dmitri Dominic Donovan Dorian Douglas Drake ' +
    'Drew Duncan Dustin Dylan Eamon Earl Easton Edgar Edison Edmund ' +
    'Edward Edwin Eli Elias Elliot Ellis Elmer Elton Emerson Emmett ' +
    'Enoch Enzo Ephraim Erasmus Eric Ernest Errol Esteban Ethan Eugene ' +
    'Evan Everett Ezekiel Ezra Fabian Falkner Farley Felix Ferdinand Fergus ' +
    'Finlay Finn Fitzgerald Fletcher Florian Floyd Ford Forrest Foster Francis ' +
    'Frank Franklin Fraser Frederick Fritz Gabriel Gareth Garrett Garrick Gaston ' +
    'Gavin Gene George Gerald Gerard Gideon Gilbert Giles Giovanni Glen ' +
    'Godfrey Gordon Grady Graham Grant Grayson Gregor Gregory Griffin Grover ' +

    'Gunnar Gus Guthrie Guy Hadrian Halden Hamish Hank Harlan Harold ' +
    'Harrison Harry Hartley Harvey Hayden Heath Hector Henry Herbert Herman ' +
    'Hiram Hobart Hogan Holden Hollis Homer Horace Horatio Howard Hubert ' +
    'Hudson Hugh Hugo Humphrey Hunter Huxley Ian Ignatius Igor Ilya ' +
    'Ira Irving Isaac Isaiah Ivan Ives Jack Jacob Jagger Jared ' +
    'Jasper Jax Jedidiah Jefferson Jeremiah Jerome Jesse Jethro Joaquin Jonah ' +
    'Jonas Jordan Joseph Joshua Josiah Jude Julian Julius Justus Kaleb ' +
    'Kane Karl Kasper Keaton Keenan Kellan Kelvin Kendrick Kenneth Kieran ' +
    'Killian Kingsley Kip Kirby Klaus Knox Konrad Kurt Lachlan Lamont ' +
    'Lance Landon Lars Laszlo Laurence Lawson Lazarus Leander Leland Lennox ' +

    'Leo Leon Leonard Leopold Leroy Lester Levi Lewis Liam Lincoln ' +
    'Lionel Lloyd Logan Lorenzo Louis Lowell Lucas Lucian Ludwig Luther ' +
    'Lyle Lysander Maddox Magnus Malcolm Manfred Marcel Marcus Mario Marlon ' +
    'Marshall Martin Marvin Mason Mateo Matthias Maurice Maverick Maximus Maxwell ' +
    'Mercer Merlin Micah Miles Milo Milton Mordecai Morgan Morris Mortimer ' +
    'Moses Murdoch Murray Nash Nathaniel Neville Nicholas Nigel Nikolai Noah ' +
    'Noel Nolan Norman Norris Oakley Obadiah Octavius Odin Olaf Oliver ' +
    'Omar Orion Orlando Orson Osborne Oscar Osgood Oswald Otis Otto ' +
    'Owen Ozias Pablo Pascal Patrick Paxton Pearce Pedro Percival Percy ' +
    'Perry Peter Philip Phineas Pierce Piers Porter Preston Prosper Quentin ' +

    'Quincy Quinn Radcliffe Rafael Ralph Ramsey Randall Ransom Raphael Rasmus ' +
    'Raymond Redmond Reginald Reuben Rex Rhett Richard Rider Riley Ripley ' +
    'Roland Rolf Roman Ronan Roscoe Ross Rowan Roy Rudolph Rufus ' +
    'Rupert Russell Ryder Salvador Samson Samuel Sawyer Sebastian Seamus Seth ' +
    'Seymour Shane Shepherd Sidney Silas Simeon Simon Sinclair Solomon Spencer ' +
    'Stanley Stefan Sterling Stuart Sullivan Sylvester Tarquin Tate Teddy Thaddeus ' +
    'Thatcher Theodore Thomas Thorne Tiberius Tobias Torin Travis Tristan Truman ' +
    'Tucker Turner Ulysses Umberto Upton Uriah Valentine Vance Vaughn Verne ' +
    'Victor Vincent Virgil Wade Wallace Walter Warren Wesley Weston Whitaker ' +
    'Wilbur Wilder William Winston Wolfgang Wyatt Xavier Yorick Zachary Zane'
  ).split(' ').filter(function (n) { return n.length > 0; });

  var FEMALE = (
    'Abigail Acacia Ada Adelaide Adeline Adora Agatha Agnes Aida Ailsa ' +
    'Aisling Alberta Alma Althea Amaryllis Amelia Anastasia Andrea Angelica Anika ' +
    'Annabel Annette Antonia Aphra Arabella Ariadne Arlette Astrid Aubrey Audra ' +
    'Augusta Aurelia Aurora Ava Avis Azalea Beatrice Beatrix Belinda Bellatrix ' +
    'Berenice Bernadette Bertha Bethany Betsy Bianca Birdie Blanche Blossom Bonnie ' +
    'Bridget Brigitta Bronwen Bryony Calliope Camellia Camille Candace Caprice Carlotta ' +
    'Carmen Caroline Cassandra Catalina Catherine Cecilia Celeste Celestine Chantal Charlotte ' +
    'Chloe Christabel Cicely Clara Clarissa Claudia Clementine Cleo Clover Colette ' +
    'Constance Cordelia Corinne Cornelia Cosima Cressida Daffodil Dahlia Daisy Damaris ' +
    'Danae Daphne Davina Deborah Delia Delilah Delphine Demeter Desiree Diana ' +

    'Dinah Dolores Dorcas Doreen Dorothea Dorothy Dulcie Edith Edna Effie ' +
    'Eileen Elaine Eleanor Electra Elena Eliza Elizabeth Ella Ellen Elodie ' +
    'Eloise Elsa Elspeth Elvira Emeline Emilia Emily Emma Enid Erica ' +
    'Esme Esperanza Estelle Esther Ethel Etta Eudora Eugenia Eulalia Eunice ' +
    'Euphemia Eve Faith Fanny Farrah Fatima Faye Felicity Fern Fiona ' +
    'Flora Florence Flossie Fortuna Frances Francesca Freya Frida Gabriella Gemma ' +
    'Genevieve Georgia Georgiana Geraldine Gertrude Gilda Giselle Gladys Glenda Gloria ' +
    'Grace Greta Griselda Guinevere Gwendolyn Gwyneth Hannah Harriet Hattie Hazel ' +
    'Heather Hedda Helen Helena Heloise Henrietta Hermione Hester Hilda Holly ' +
    'Honor Hortense Hyacinth Ida Ilse Imelda Imogen Ines Ingrid Iona ' +

    'Irene Iris Isabella Isadora Iseult Isolde Ivy Jacinta Jacqueline Jane ' +
    'Janet Jasmine Jemima Jenna Jessamine Jewel Joan Jocelyn Johanna Josephine ' +
    'Joyce Juanita Judith Julia Juliet Juno Justine Kalliope Karina Katarina ' +
    'Katherine Kathleen Katya Keira Kerensa Kezia Kira Kirsten Kitty Klara ' +
    'Lacey Ladonna Laila Lark Laura Laurel Lavender Lavinia Leah Leilani ' +
    'Lena Lenora Leona Leonora Lesley Letitia Lettie Libby Lila Lilac ' +
    'Lilian Lily Linnea Lisbeth Livia Lois Lorelei Loretta Lorna Lottie ' +
    'Louisa Lucia Lucinda Lucretia Lucy Ludmilla Luna Lydia Lyra Mabel ' +
    'Madeleine Madge Maeve Magdalena Magnolia Maisie Mallory Malvina Manon Marcella ' +
    'Margaret Margot Marguerite Maria Mariana Marianne Marigold Marina Marion Marisol ' +

    'Marjorie Marlene Martha Mathilda Maud Maureen Mavis Maxine May Meadow ' +
    'Melanie Melisande Melody Mercedes Mercy Meredith Mia Micaela Mildred Millicent ' +
    'Mimi Minerva Mina Miranda Miriam Mirabel Moira Mona Monica Morgana ' +
    'Muriel Myra Myrtle Nadia Nadine Nancy Naomi Natalia Nell Nerissa ' +
    'Nessa Nettie Nina Ninette Noelle Nora Norma Octavia Odette Odile ' +
    'Olga Olive Olivia Olympia Ondine Opal Ophelia Ora Oriana Orla ' +
    'Ottilie Ottoline Paloma Pamela Pandora Patience Patricia Paulette Pearl Peggy ' +
    'Penelope Peony Perdita Persephone Petra Petunia Philippa Phoebe Phyllis Pilar ' +
    'Piper Polly Poppy Portia Primrose Priscilla Prudence Prunella Queenie Rachel ' +
    'Ramona Raquel Rebecca Regina Renata Rhoda Rhonda Rita Roberta Robin ' +

    'Rosa Rosalind Rosamund Rose Rosemary Rowena Roxana Ruby Ruth Sabrina ' +
    'Saffron Sally Salome Samara Sapphira Sasha Saskia Scarlett Selina Seraphina ' +
    'Serena Shirley Sibyl Sienna Signe Simone Solveig Sonia Sophia Stella ' +
    'Stephanie Sunniva Susanna Svetlana Sylvia Tabitha Talia Tallulah Tamsin Tansy ' +
    'Tatiana Temperance Teresa Tess Thea Thelma Theodora Thora Thomasina Tilly ' +
    'Tirzah Trilby Trixie Trudy Ulrica Ursula Valentina Valeria Vanessa Velma ' +
    'Venetia Vera Verity Veronica Vesper Victoria Vida Vienna Viola Violet ' +
    'Virginia Vivian Wanda Wendy Wilhelmina Willa Willow Wilma Winifred Winnie ' +
    'Wren Xanthe Xenia Yasmin Yolanda Yvette Yvonne Zara Zelda Zenobia ' +
    'Zinnia Zipporah Zoe Zora Zuleika Zola Zaida Zephyrine Zenaida Zsofia'
  ).split(' ').filter(function (n) { return n.length > 0; });

  // Rare names, given to either sex.
  var SPECIAL = [
    'Kappa', 'SweetTea', 'Clyde', 'Evangeline', 'Cinder', 'Plato', 'Brick',
    'Dumpy', 'Ridley', 'Brian', 'Nyssa', 'Sadie', 'Balf', 'Potroast',
    'Nymph', 'Corvus', 'Newt', 'Cannoli', 'Cash'
  ];

  var SPECIAL_CHANCE = 0.05;

  // De-dupe defensively so the pools are always clean.
  function clean(list) {
    var seen = {}, out = [];
    list.forEach(function (n) { if (!seen[n]) { seen[n] = 1; out.push(n); } });
    return out;
  }
  MALE = clean(MALE);
  FEMALE = clean(FEMALE);

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /** sex: 'cock' | 'hen'. Anything else falls back to the cock list. */
  function random(sex) {
    if (Math.random() < SPECIAL_CHANCE) {
      return { name: pick(SPECIAL), special: true };
    }
    return { name: pick(sex === 'hen' ? FEMALE : MALE), special: false };
  }

  return {
    random: random,
    MALE: MALE,
    FEMALE: FEMALE,
    SPECIAL: SPECIAL,
    counts: { male: MALE.length, female: FEMALE.length, special: SPECIAL.length }
  };
})();
