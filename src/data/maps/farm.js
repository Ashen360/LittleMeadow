// Little Meadow Farm: 40 x 30 tiles. Legend: see ./legend.js.
// The field (':') is the tillable area; 'r' / 'b' are rocks and branches to clear.
// The path on row 14 leads east to Bramblewick.

export const FARM_MAP = {
  id: 'farm',
  name: 'Little Meadow Farm',
  rows: [
    'PTPPTPTPPTPPTPTPPTPPTPTPPTPPTPTPPTPTPPTP',
    'TPTTPTPTPPTPPTTTPTPPTPTPTTPTPTPPTPTPTPPT',
    'P.B........,.......,.......,......,...TP',
    'T.B...........:::::::::r::::::..,......T',
    'P.............::b:::::::::::r:......o..P',
    'T.............:::::r::b:::::::.,.......T',
    'P.............:::::::::::r::::......,..P',
    'T.....=.......:r::::::::::::b:.........T',
    'PB....=.......::::::::::::::::..o......P',
    'T.....=.......::::b:::r:::::::.....,...T',
    'P.,...=..,....:::::::::::::b::........TP',
    'T.....=.......r:::::::::::::::...,.....T',
    'P.....=................,.........T.....P',
    'T.....=.,.........................,.....',
    'P.....==================================',
    'T.,.....................,...............',
    'P...........T.....................T....P',
    'T........,.....,......T....o..........TT',
    'P.B........................,...T.......P',
    'T...~~~~...T......T.............,......T',
    'P..~~~~~~...............T...........T..P',
    'T.~~~~~~~~.,.....................o.....T',
    'P.~~~~~~~~....o.......,......T.........P',
    'T..~~~~~~............T............,..T.T',
    'P...~~~.....,..................T.......P',
    'T...............T......o............T..T',
    'PB.,...............T.....,......T......P',
    'T.......T...T...T...T....T...T...T...TPT',
    'PTPTPPTPTPTPPTPTPPTPPTPTPTPPTPTPTPPTPTPT',
    'TPPTPTPPTPPTPTPPTPTPTPPTPTPTPPPTPTPTPPTP',
  ],
  // The farmland you own grows from the field's corner nearest the house. sizes[0] is the
  // starting plot; costs[i] buys sizes[i + 1]. The sign to expand stands just outside the plot.
  plots: {
    origin: { x: 14, y: 3 },
    sizes: [[3, 3], [5, 4], [8, 5], [12, 7], [16, 9]],
    costs: [250, 600, 1200, 2500],
  },
  objects: [
    { type: 'house', x: 4, y: 3 },
    { type: 'shippingBox', x: 10, y: 6 },
    { type: 'mailbox', x: 7, y: 8 },
    { type: 'sign', x: 36, y: 13 },
  ],
  warps: [
    { x: 39, y: 13, w: 1, h: 3, to: 'town', tx: 1, ty: 13, facing: 2 },
  ],
  spawn: { x: 6, y: 7 },
};
