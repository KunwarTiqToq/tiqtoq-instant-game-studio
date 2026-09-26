import test from 'node:test';
import assert from 'node:assert/strict';
import {startTargetRound,hitTarget,nextTargetId,targetOutcome} from '../src/games/mini/target-round.js';
const config={mode:'multiplier' as const,baseAmount:10,durationSeconds:5,targetRange:{min:3,max:3},prizes:[{amount:3},{amount:3}]};
test('timed targets keep at least three active birds, replace hits, sum rewards, and reject repeats or expired hits',()=>{
  const round=startTargetRound(config,1000);
  assert.equal(round.endsAt,6000);assert.equal(round.activeIds.length,3);
  const id=round.activeIds[0];const first=hitTarget(round,config,id,1001);
  assert.equal(first.activeIds[0],nextTargetId(id));assert.equal(first.activeIds.length,3);
  assert.deepEqual(hitTarget(first,config,id,1002),first);
  const second=hitTarget(first,config,first.activeIds[0],5999);
  assert.equal(second.amount,6);assert.equal(second.payout,60);
  assert.deepEqual(hitTarget(second,config,second.activeIds[1],6000),second);
  assert.throws(()=>hitTarget(first,config,'invented',2000));
  assert.deepEqual(targetOutcome(second,config),{prizeIndex:0,amount:6,payout:60,mode:'multiplier',baseAmount:10,total:true,hitCount:2});
  assert.equal(targetOutcome(round,config).payout,0);
});
test('instant credit rewards add without multiplying the sum',()=>{
  const instant={...config,mode:'instant' as const};
  let round=startTargetRound(instant,0);
  for(let i=0;i<10;i++)round=hitTarget(round,instant,round.activeIds[1],i+1);
  assert.equal(round.payout,30);assert.equal(round.hits.length,10);assert.equal(round.activeIds.length,3);
});
