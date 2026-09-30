// Villagers. Everything here is content: looks live in PlaceholderArt (npc.<id>.*, portrait.<id>).
//
// home: the tile in front of their front door. A schedule leg with `inside: true` walks home
// and goes indoors (the villager is hidden until their next leg).
// schedule: legs sorted by time; at each time the villager walks (BFS over the map grid,
// through warps if the target is on another map) to (x, y) and faces `facing`
// (0 down, 1 left, 2 right, 3 up).
// lines: what they say, by friendship tier (see FRIENDSHIP in tuning.js). `again` is used after
// the first chat of the day. A line may have several pages separated by '|'.

export const NPCS = {
  marigold: {
    name: 'Marigold',
    home: { map: 'town', x: 6, y: 8 },
    schedule: [
      { time: '6:00', inside: true },
      { time: '8:20', map: 'town', x: 21, y: 9, facing: 0 },      // outside the store
      { time: '17:10', map: 'town', x: 19, y: 17, facing: 3 },    // by the fountain
      { time: '20:30', inside: true },
    ],
    lines: {
      0: [
        'Well, look who it is! The new farmer! I\'m Marigold. I run Fenn\'s Provisions, right behind me.|Seeds, sprout. That\'s what you need. Come by between nine and five.',
        'Your great-aunt used to buy turnip seeds by the bagful. She said they were "honest vegetables."',
        'Pip tells me you have a pond on your farm. He\'ll be visiting it, I expect. Send him home by supper!',
        'Otto pretends he doesn\'t care about anyone\'s garden. Then he asks me every day how yours is doing.',
      ],
      1: [
        'Sprout! I sold a strawberry to June and she said it was from your farm. Proud of you.',
        'The trick with potatoes is patience. And watering. Mostly watering.',
        'I\'ve lived in Bramblewick my whole life. Every season it smells different. You\'ll see.',
      ],
      2: [
        'You know, the village feels fuller since you arrived. In the good way, like a pantry.',
        'If you ever need anything, you just knock. Even after five. Well... before nine at night.',
      ],
      again: ['Back again? I\'m not going anywhere, sprout.', 'Mind the fountain, it splashes.'],
    },
  },

  otto: {
    name: 'Otto',
    home: { map: 'town', x: 31, y: 8 },
    schedule: [
      { time: '6:00', inside: true },
      { time: '7:30', map: 'town', x: 16, y: 10, facing: 3 },     // west flowerbeds
      { time: '10:30', map: 'town', x: 25, y: 10, facing: 3 },    // east flowerbeds
      { time: '13:00', map: 'town', x: 17, y: 17, facing: 3 },    // the bench
      { time: '17:00', map: 'town', x: 14, y: 20, facing: 3 },    // south beds
      { time: '19:00', inside: true },
    ],
    lines: {
      0: [
        'Hm. The farmer. Otto. I keep the flowers.|Don\'t step on them.',
        'Bees like the pink ones. So do I. Don\'t tell anyone.',
        'Forty years a botanist. Now I weed. It\'s better, honestly.',
      ],
      1: [
        'Your field. Heard you cleared the rocks. Good. Roots hate rocks.',
        'Strawberries come back if you keep watering. Like friends.',
        'I pressed a flower from your farm. It\'s on my windowsill. Don\'t make it a thing.',
      ],
      2: [
        'Your great-aunt and I argued about compost for thirty years. I miss it. You\'ll do.',
        'Here\'s a secret. The soil remembers kindness. Water it on grey days too.',
      ],
      again: ['Still here.', 'Mm.'],
    },
  },

  june: {
    name: 'June',
    home: { map: 'town', x: 30, y: 24 },
    schedule: [
      { time: '6:00', inside: true },
      { time: '7:00', map: 'farm', x: 7, y: 9, facing: 3 },       // your mailbox
      { time: '8:30', map: 'farm', x: 30, y: 14, facing: 2 },     // jogging the farm road
      { time: '10:00', map: 'town', x: 34, y: 14, facing: 1 },
      { time: '12:30', map: 'town', x: 10, y: 15, facing: 0 },
      { time: '15:00', map: 'town', x: 22, y: 20, facing: 0 },
      { time: '18:30', inside: true },
    ],
    lines: {
      0: [
        'Hi hi! June! I do the mail! And I run. Mostly I run WITH the mail.|Your mailbox is my first stop every morning, so wave!',
        'Do you collect stamps? No? That\'s okay. More for me!',
        'I timed it: town square to your farm in two minutes flat. Well. Three.',
      ],
      1: [
        'Today\'s stamp is a little snail. Isn\'t he great? He\'s great.',
        'I told everyone your turnips are the best in Bramblewick. Don\'t prove me wrong!',
        'Otto smiled at me yesterday. I think. Hard to tell with the beard.',
      ],
      2: [
        'You\'re my favourite stop, you know. Don\'t tell the fountain.',
        'Someday I want to run all the way to the sea. Want to come? We can walk. Mostly.',
      ],
      again: ['Can\'t stop, running!', 'Wave at the mailbox tomorrow!'],
    },
  },

  pip: {
    name: 'Pip',
    home: { map: 'town', x: 6, y: 8 },
    schedule: [
      { time: '6:00', inside: true },
      { time: '8:30', map: 'town', x: 23, y: 12, facing: 1 },     // the fountain
      { time: '12:30', map: 'farm', x: 10, y: 21, facing: 1 },    // your pond
      { time: '15:30', map: 'town', x: 22, y: 15, facing: 3 },
      { time: '19:00', inside: true },
    ],
    lines: {
      0: [
        'Are you the farmer? Do you have worms? Do you have BIG worms?',
        'I found a rock that looks like a potato. Or a potato that looks like a rock. I\'m checking.',
        'Aunt Marigold says I ask too many questions. Is that true? Why?',
      ],
      1: [
        'Your pond has a frog. I named him Sir Ribbit. He\'s the king of the pond.',
        'When I grow up I want a farm. Or a fountain. Can you grow a fountain?',
        'I have forty-one treasures. You can see them. Not touch them. Maybe touch one.',
      ],
      2: [
        'You\'re my best grown-up friend. Don\'t tell Aunt Marigold. Actually, you can tell her.',
        'I buried a treasure on your farm. Just kidding. Or am I? I am.',
      ],
      again: ['Did you find any worms yet?', 'Sir Ribbit says hi.'],
    },
  },
};

// Used when a villager has nothing specific to say.
export const GENERIC_LINES = ['Lovely day, isn\'t it?', 'Oh, hello again.'];
