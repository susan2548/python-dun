import assert from 'node:assert/strict';
import {mapFloorState,currentMapFloor,ROOM_POINTS} from './expedition-map.js';
const fresh=Object.freeze({cleared:0,stars:Object.freeze([]),activeBattle:null});
assert.equal(currentMapFloor(fresh),0);
assert.equal(mapFloorState(fresh,0).canEnter,true);
for(let i=1;i<12;i++){assert.equal(mapFloorState(fresh,i).locked,true);assert.equal(mapFloorState(fresh,i).canEnter,false);}
const midway={cleared:3,stars:[3,2,1],activeBattle:null};
assert.equal(currentMapFloor(midway),3);
assert.equal(mapFloorState(midway,1).stars,2);assert.equal(mapFloorState(midway,2).done,true);
assert.equal(mapFloorState(midway,3).frontier,true);assert.equal(mapFloorState(midway,3).canEnter,true);
assert.equal(mapFloorState(midway,4).canEnter,false);
const replay=Object.freeze({...midway,activeBattle:Object.freeze({level:1,hp:47,mp:2,phase:2,turn:8})});
assert.equal(currentMapFloor(replay),1);assert.equal(mapFloorState(replay,1).resume,true);assert.equal(mapFloorState(replay,1).canEnter,true);
for(const i of [0,2,3]){assert.equal(mapFloorState(replay,i).otherBattle,true);assert.equal(mapFloorState(replay,i).canEnter,false);}
const completed={cleared:12,stars:Array(12).fill(3),activeBattle:null};
assert.equal(currentMapFloor(completed),11);for(let i=0;i<12;i++){assert.equal(mapFloorState(completed,i).done,true);assert.equal(mapFloorState(completed,i).canEnter,true);}
const migrated={cleared:0,stars:[0,3,0,0,3,0,0,0,0,0,0,0],activeBattle:{level:7}};
assert.equal(mapFloorState(migrated,1).done,true);assert.equal(mapFloorState(migrated,1).locked,false);assert.equal(mapFloorState(migrated,7).canEnter,true);assert.equal(mapFloorState(migrated,6).locked,true);
assert.throws(()=>mapFloorState(fresh,12),RangeError);
assert.equal(ROOM_POINTS.length,12);assert.equal(new Set(ROOM_POINTS.map(String)).size,12);
console.log('Map state passed: new, midway, replay-in-progress, all-clear, locked entry and read-only save views.');
