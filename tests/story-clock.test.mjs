import test from 'node:test';
import assert from 'node:assert/strict';
import * as story from '../scripts/story.mjs';

test('one90ms exponential progress clock is frame-rate independent, bounded and snaps exactly',()=>{
 assert.equal(typeof story.stepStoryProgress,'function');
 const once=story.stepStoryProgress(0,1,90);let many=0;for(let i=0;i<9;i++)many=story.stepStoryProgress(many,1,10);
 assert.ok(Math.abs(once-(1-Math.exp(-1)))<1e-12);assert.ok(Math.abs(once-many)<1e-12);
 assert.ok(story.stepStoryProgress(.8,.1,16)<.8&&story.stepStoryProgress(.8,.1,16)>.1);
 assert.equal(story.stepStoryProgress(.499999,.5,16),.5);
 assert.equal(story.stepStoryProgress(1,1,16),1);
 assert.equal(story.stepStoryProgress(NaN,.7,16),.7);
 for(const current of [-5,2]){const p=story.stepStoryProgress(current,.5,16);assert.ok(p>=0&&p<=1);}
});
