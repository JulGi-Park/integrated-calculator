import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import React, {act} from 'react';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {KnowledgeCenter} from '../components/knowledge/KnowledgeCenter.tsx';
import {renderKnowledgeList} from '../pages-functions/knowledge-list.ts';

test('injected public HTML hydrates without errors or duplicates and initializes page from URL',async()=>{
  const q={id:'12345678-1234-4123-8123-123456789abc',title:'둘째 페이지 고유 질문 < &',body:'질문 본문',category:null,isAnonymous:true,nickname:null,status:'published',createdAt:'2026-10-01T00:00:00Z',answer:null,relatedServices:[]};
  const html=renderToString(React.createElement(KnowledgeCenter,{enabled:true}));
  const injected=html.replace('<div id="knowledge-server-list"></div>',`<div id="knowledge-server-list">${renderKnowledgeList({items:[q],page:2,total:11,totalPages:2})}</div>`);
  assert.notEqual(injected,html);
  const dom=new JSDOM(`<div id="root">${injected}</div>`,{url:'https://test.integrated-calculator.pages.dev/knowledge/?page=2'});
  for(const [name,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:callback=>callback()}))Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  const errors=[];const messages=[];const original=console.error;console.error=(...args)=>messages.push(args.join(' '));
  const originalFetch=globalThis.fetch;const requests=[];
  globalThis.fetch=async url=>{requests.push(String(url));return Response.json({ok:true,data:String(url).includes('/services')?{items:[]}:{items:[q],page:2,total:11,total_pages:2}});};
  let root;
  try {
    assert.equal(dom.window.document.querySelectorAll('#knowledge-server-list li').length,1);
    await act(async()=>{root=hydrateRoot(dom.window.document.getElementById('root'),React.createElement(KnowledgeCenter,{enabled:true}),{onRecoverableError:e=>errors.push(e.message)});});
    assert.deepEqual(errors,[]);assert.deepEqual(messages,[]);
    assert.equal(dom.window.document.querySelector('#knowledge-server-list'),null);
    assert.equal(dom.window.document.querySelectorAll('[data-testid=knowledge-question-list] strong').length,1);
    assert.equal(dom.window.document.querySelector('[data-testid=knowledge-question-list] strong').textContent,q.title);
    assert.ok(requests.some(url=>url.includes('page=2')));
    assert.equal(dom.window.document.querySelector('main > div[hidden]'),null);
  } finally {if(root)await act(async()=>root.unmount());console.error=original;globalThis.fetch=originalFetch;dom.window.close();}
});
