import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('the controls screen sits between the selection and level 1, desktop only, and waits for ENTER',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const play=main.slice(main.indexOf('function play()'),main.indexOf('const controlsScreen='));
  assert.match(play,/is-mobile'\)\)return begin\(\)/,'touch devices skip it');
  assert.match(play,/controlsScreen\.show\(selected,[^]*onDone:begin/);
  assert.ok(main.indexOf('controlsScreen.handleKey(event)')<main.indexOf("if (screen === 'game' || event.repeat) return;"),'it owns ENTER before the selection does');
  for(const id of ['controls-screen','controls-actions','controls-combos','controls-start','controls-back'])assert.ok(html.includes(`id="${id}"`),id);
  const ui=readFileSync(new URL('../src/ui/ControlsScreen.js',import.meta.url),'utf8');
  for(const key of ["'H'","'J'","'K'","'SPACE'","'SHIFT'","'Q'","'P'","'L'","'W','A','S','D'","'↑','←','↓','→'"])assert.ok(ui.includes(key),key);
  assert.match(ui,/event\.key==='Enter'/);assert.match(ui,/event\.key==='Escape'/);
  assert.match(main,/id:'controls'[^]*?action:\(\)=>\{mainMenu\.close\(\);controlsScreen\.show/,'the menu must close so it cannot cover the controls dialog');
});
