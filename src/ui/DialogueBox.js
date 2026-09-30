// The dialogue box: portrait, name, friendship hearts and typewriter text in pages of three
// lines. E / Space / Enter / click finishes the page, then advances; Esc closes.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { LINE_H } from '../rendering/Font.js';
import { FRIENDSHIP } from '../data/tuning.js';
import { confirmPressed } from './MenuBox.js';

const BOX_W = VIEW_W - 16;
const BOX_H = 58;
const BOX_X = 8;
const BOX_Y = VIEW_H - BOX_H - 6;
const TEXT_X = BOX_X + 54;
const TEXT_W = BOX_W - 62;
const LINES_PER_PAGE = 3;
const CHARS_PER_SECOND = 55;

export class DialogueBox {
  constructor(kit, atlas) {
    this.kit = kit;
    this.atlas = atlas;
    this.npc = null;
    this.pages = [];
    this.page = 0;
    this.shown = 0;       // characters of the current page revealed so far
    this.pageLength = 0;
    this.portrait = null;
  }

  // large: the large-text setting (2x text, two lines per page).
  open(npc, text, large = false) {
    this.npc = npc;
    this.large = large;
    this.portrait = this.atlas.get(`portrait.${npc.id}`);
    this.pages = [];
    const font = this.kit.font;
    for (const para of text.split('|')) {
      const per = large ? 2 : LINES_PER_PAGE;
      const lines = font.wrap(para, large ? TEXT_W / 2 : TEXT_W);
      for (let i = 0; i < lines.length; i += per) this.pages.push(lines.slice(i, i + per));
    }
    this.setPage(0);
  }

  setPage(k) {
    this.page = k;
    this.shown = 0;
    this.pageLength = this.pages[k].reduce((n, l) => n + l.length, 0);
  }

  get typing() {
    return this.shown < this.pageLength;
  }

  update(input, game) {
    if (this.typing) {
      this.shown = Math.min(this.pageLength, this.shown + game.frameDt * CHARS_PER_SECOND);
      game.dirty = true;
    }
    if (input.wasPressed('menu')) {
      game.closeModal(this);
      return;
    }
    if (confirmPressed(input) || input.mouse.leftPressed) {
      if (this.typing) this.shown = this.pageLength;
      else if (this.page + 1 < this.pages.length) this.setPage(this.page + 1);
      else game.closeModal(this);
      game.dirty = true;
    }
  }

  draw(ctx, game) {
    const { kit } = this;
    const { font } = kit;
    kit.panel(ctx, BOX_X, BOX_Y, BOX_W, BOX_H);
    // Portrait in a frame.
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(BOX_X + 6, BOX_Y + 8, 42, 42);
    this.atlas.draw(ctx, this.portrait, BOX_X + 7, BOX_Y + 9);

    const npc = this.npc;
    font.draw(ctx, npc.name, TEXT_X, BOX_Y + 6, PAL.sun);
    const hearts = Math.floor(npc.friendship / FRIENDSHIP.heart);
    const total = FRIENDSHIP.max / FRIENDSHIP.heart;
    let hx = TEXT_X + font.measure(npc.name) + 8;
    for (let i = 0; i < total; i++) {
      font.draw(ctx, '♥', hx, BOX_Y + 6, i < hearts ? PAL.rose : PAL.wood);
      hx += 7;
    }

    // Typewriter text.
    let left = Math.floor(this.shown);
    const lines = this.pages[this.page];
    for (let i = 0; i < lines.length && left > 0; i++) {
      const line = lines[i];
      const text = left >= line.length ? line : line.slice(0, left);
      left -= line.length;
      if (this.large) font.drawScaled(ctx, text, TEXT_X, BOX_Y + 17 + i * 17, PAL.cream, 2, null, 'left');
      else font.draw(ctx, text, TEXT_X, BOX_Y + 18 + i * LINE_H, PAL.cream);
    }
    if (!this.typing) {
      const more = this.page + 1 < this.pages.length;
      font.draw(ctx, more ? 'E: more' : 'E: close', BOX_X + BOX_W - 8, BOX_Y + BOX_H - 9, PAL.dirtLight, 'right');
    }
  }
}
