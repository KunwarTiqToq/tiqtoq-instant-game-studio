import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type {AddressInfo} from 'node:net';
import WebSocket from 'ws';
import {createCoreServer} from '../src/server.js';

test('WebSocket heartbeats keep responsive clients and close silent clients', {timeout:5000}, async(t)=>{
  const core=createCoreServer(null,100);
  t.after(()=>core.close());
  core.server.listen(0,'127.0.0.1');await once(core.server,'listening');
  const url=`ws://127.0.0.1:${(core.server.address() as AddressInfo).port}/ws/games`;
  const live=new WebSocket(url);
  t.after(()=>live.terminate());
  await once(live,'open');
  const silent=new WebSocket(url,{autoPong:false});
  t.after(()=>silent.terminate());
  await once(silent,'open');
  const closed=once(silent,'close');
  await once(live,'ping');
  await once(live,'ping');
  await closed;
  assert.equal(live.readyState,WebSocket.OPEN);
  assert.equal(silent.readyState,WebSocket.CLOSED);
});
