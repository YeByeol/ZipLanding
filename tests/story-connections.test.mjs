import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../scripts/story-connections.mjs').catch(()=>({}));

test('leader geometry stays deterministic and rejects invalid coordinates',()=>{
  assert.equal(typeof module.connectionPath,'function');
  const from={x:124.25,y:260},to={x:332,y:419};
  const path=module.connectionPath(from,to);
  assert.match(path,/^M124\.25,260 C/);
  assert.ok(path.endsWith('332,419'));
  assert.equal(module.connectionPath(from,to),path);
  for(const invalid of [null,{x:NaN,y:2},{x:2,y:Infinity}])assert.equal(module.connectionPath(invalid,to),null);
});

test('opaque data surfaces hide covered markers without clamping them to an edge',()=>{
  assert.equal(typeof module.isCovered,'function');
  const rect={left:100,top:200,right:300,bottom:400};
  assert.equal(module.isCovered({x:150,y:250},[rect]),true);
  assert.equal(module.isCovered({x:100,y:200},[rect]),true);
  assert.equal(module.isCovered({x:99.9,y:250},[rect]),false);
  assert.equal(module.isCovered({x:150,y:250},[]),false);
});
