import { workflow, node, trigger, switchCase, ifElse, languageModel, outputParser, newCredential, sticky, expr } from '@n8n/workflow-sdk';

const TABLE = { __rl: true, mode: 'id', value: 'PHYx7pi2rFgQkQQI', cachedResultName: 'motdang_video_posts' };
const SCHEMA = [
  { required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, id: 'post_date', displayName: 'post_date' }, { required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, id: 'slot', displayName: 'slot' }, { required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, id: 'status', displayName: 'status' },
  { required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, id: 'caption', displayName: 'caption' }, { required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, id: 'fb_post_id', displayName: 'fb_post_id' }, { required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, id: 'fb_url', displayName: 'fb_url' },
  { required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, id: 'note', displayName: 'note' }
];
const FOPT = { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 };

// ───────────── 1. Pipeline webhook (called by the Claude render task) ─────────────
const hook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.2,
  config: { name: 'Pipeline webhook', position: [0, 400], parameters: { httpMethod: 'POST', path: 'motdang-video', responseMode: 'responseNode' } },
  output: [{ body: { action: 'caption', slot: 'noon', post_date: '2026-10-15', edition: 'openNow,cinema,festival', facts: 'Open now near Chiang Mai old city: 623 places' } }]
});

const normalize = node({
  type: 'n8n-nodes-base.set', version: 3.5,
  config: { name: 'Normalize request', position: [220, 400], parameters: { mode: 'manual', assignments: { assignments: [
    { id: 'a1', name: 'action', value: expr('{{ ($json.body.action || "").toLowerCase().trim() }}'), type: 'string' },
    { id: 'a2', name: 'slot', value: expr('{{ ($json.body.slot || "").toLowerCase().trim() }}'), type: 'string' },
    { id: 'a3', name: 'post_date', value: expr('{{ $json.body.post_date || $now.setZone("Asia/Bangkok").toFormat("yyyy-MM-dd") }}'), type: 'string' },
    { id: 'a4', name: 'facts', value: expr('{{ ($json.body.facts || "").toString().slice(0, 4000) }}'), type: 'string' },
    { id: 'a5', name: 'edition', value: expr('{{ $json.body.edition || "" }}'), type: 'string' },
    { id: 'a6', name: 'row_id', value: expr('{{ $json.body.row_id || "" }}'), type: 'string' },
    { id: 'a7', name: 'status', value: expr('{{ $json.body.status || "" }}'), type: 'string' },
    { id: 'a8', name: 'fb_post_id', value: expr('{{ $json.body.fb_post_id || "" }}'), type: 'string' },
    { id: 'a9', name: 'fb_url', value: expr('{{ $json.body.fb_url || "" }}'), type: 'string' },
    { id: 'a10', name: 'note', value: expr('{{ $json.body.note || "" }}'), type: 'string' },
    { id: 'a11', name: 'caption', value: expr('{{ $json.body.caption || "" }}'), type: 'string' }
  ] } } }
});

const route = switchCase({
  version: 3.2,
  config: { name: 'Route action', position: [440, 400], parameters: {
    rules: { values: [
      { outputKey: 'caption', conditions: { options: FOPT, conditions: [{ leftValue: expr('{{ $json.action }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'caption' }], combinator: 'and' } },
      { outputKey: 'log', conditions: { options: FOPT, conditions: [{ leftValue: expr('{{ $json.action }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'log' }], combinator: 'and' } },
      { outputKey: 'status', conditions: { options: FOPT, conditions: [{ leftValue: expr('{{ $json.action }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'status' }], combinator: 'and' } }
    ] },
    options: { fallbackOutput: 'extra', renameFallbackOutput: 'Unknown action' }
  } }
});

// ── caption branch
const validCaption = ifElse({
  version: 2.3,
  config: { name: 'Valid caption request?', position: [680, 160], parameters: { conditions: { combinator: 'and', options: FOPT, conditions: [
    { leftValue: expr('{{ ["morning","noon","evening"].includes($json.slot) }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } },
    { leftValue: expr('{{ $json.facts.length }}'), rightValue: 20, operator: { type: 'number', operation: 'gte' } }
  ] } } }
});

const rejectBad = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Reject bad request', position: [920, 320], parameters: { respondWith: 'json', responseBody: expr('{{ JSON.stringify({ error: "need slot (morning|noon|evening) and facts", got: { slot: $json.slot, facts_len: $json.facts.length } }) }}'), options: { responseCode: 400 } } }
});

const findPosted = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Already posted this slot?', position: [920, 60], alwaysOutputData: true, parameters: {
    resource: 'row', operation: 'get', dataTableId: TABLE, matchType: 'allConditions', limit: 1,
    filters: { conditions: [
      { keyName: 'post_date', condition: 'eq', keyValue: expr('{{ $json.post_date }}') },
      { keyName: 'slot', condition: 'eq', keyValue: expr('{{ $json.slot }}') },
      { keyName: 'status', condition: 'eq', keyValue: 'posted' }
    ] }
  } }
});

const isDuplicate = ifElse({
  version: 2.3,
  config: { name: 'Duplicate?', position: [1140, 60], parameters: { conditions: { combinator: 'and', options: FOPT, conditions: [
    { leftValue: expr('{{ $json.id }}'), rightValue: '', operator: { type: 'number', operation: 'exists', singleValue: true } }
  ] } } }
});

const skipDuplicate = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Skip duplicate', position: [1380, -60], parameters: { respondWith: 'json', responseBody: expr('{{ JSON.stringify({ skip: true, reason: "already posted", fb_url: $json.fb_url, row_id: $json.id }) }}') } }
});

const liveCheck = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Live data freshness check', position: [1380, 140], alwaysOutputData: true, parameters: { method: 'GET', url: 'https://motdang.net/data/weather.json', options: { timeout: 15000 } } }
});

const context = node({
  type: 'n8n-nodes-base.set', version: 3.5,
  config: { name: 'Build writer context', position: [1600, 140], parameters: { mode: 'manual', assignments: { assignments: [
    { id: 'c1', name: 'slot', value: expr('{{ $("Normalize request").item.json.slot }}'), type: 'string' },
    { id: 'c2', name: 'post_date', value: expr('{{ $("Normalize request").item.json.post_date }}'), type: 'string' },
    { id: 'c3', name: 'edition', value: expr('{{ $("Normalize request").item.json.edition }}'), type: 'string' },
    { id: 'c4', name: 'facts', value: expr('{{ $("Normalize request").item.json.facts }}'), type: 'string' },
    { id: 'c5', name: 'live_fetched', value: expr('{{ $json.fetched || "unavailable" }}'), type: 'string' },
    { id: 'c6', name: 'tone', value: expr('{{ { morning: "fresh start-of-day, practical (umbrella? mask?)", noon: "curious, what to do this afternoon", evening: "relaxed, plan tonight and tomorrow" }[$("Normalize request").item.json.slot] }}'), type: 'string' }
  ] } } }
});

const writerModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', version: 1.6,
  config: { name: 'Claude writer', position: [1820, 340], parameters: { model: { __rl: true, mode: 'list', value: 'claude-sonnet-5', cachedResultName: 'Claude Sonnet 5' }, options: { maxTokensToSample: 1000 } }, credentials: { anthropicApi: newCredential('Anthropic') } }
});

const writeCaption = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm', version: 1.9,
  config: { name: 'Write caption', position: [1820, 140], parameters: {
    promptType: 'define',
    text: expr('Edition: {{ $json.slot }} on {{ $json.post_date }}. Scenes in the video: {{ $json.edition }}.\nTone: {{ $json.tone }}.\nFacts shown in the video (all from motdang.net):\n{{ $json.facts }}\n\nWrite the Facebook caption.'),
    messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: 'You write Facebook captions for the Page "Motdang.net" (มดแดง), a free bilingual local guide for Chiang Mai and Chiang Rai. Each post is a 45-second motion-graphic video. Structure: a short punchy Thai hook with 1 emoji; 2-4 Thai lines with the key numbers from the facts; a blank line; the same in shorter natural English; a call to action pointing to motdang.net; then 4-6 hashtags mixing Thai and English, always including #เชียงใหม่ #ChiangMai #มดแดง. Rules: use only numbers, names and places that appear in the facts; PM2.5 values are modelled estimates, say so lightly if you mention them; never give lottery tips, lucky numbers or investment advice; no exaggeration; under 900 characters. Output only the caption.' }] }
  }, subnodes: { model: writerModel } }
});

const checkerModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', version: 1.6,
  config: { name: 'Claude fact-checker', position: [2060, 340], parameters: { model: { __rl: true, mode: 'list', value: 'claude-sonnet-5', cachedResultName: 'Claude Sonnet 5' }, options: { maxTokensToSample: 1400 } }, credentials: { anthropicApi: newCredential('Anthropic') } }
});

const checkParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured', version: 1.3,
  config: { name: 'Check result schema', position: [2200, 340], parameters: { schemaType: 'fromJson', jsonSchemaExample: '{ "ok": true, "issues": ["number 31 not in facts"], "fixed_caption": "caption text with problems fixed, or empty string when ok" }' } }
});

const factCheck = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm', version: 1.9,
  config: { name: 'Fact-check caption', position: [2060, 140], parameters: {
    promptType: 'define', hasOutputParser: true,
    text: expr('FACTS:\n{{ $("Build writer context").item.json.facts }}\n\nCAPTION:\n{{ $json.text }}'),
    messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: 'You are the fact-checker for a local news Page. Compare the CAPTION with the FACTS. Fail it (ok=false) if: any number, place, film, time or date is not supported by the FACTS; it lacks Thai or English; it lacks motdang.net; it lacks #เชียงใหม่ #ChiangMai #มดแดง; it gives lottery tips, lucky numbers or investment advice; it is over 900 characters. When failing, list each issue and return fixed_caption: the caption corrected with the smallest possible edits. When ok, fixed_caption is an empty string.' }] }
  }, subnodes: { model: checkerModel, outputParser: checkParser } }
});

const guardrails = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Apply guardrails', position: [2300, 140], parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const draft = ($('Write caption').first().json.text || '').trim();
const chk = $('Fact-check caption').first().json.output || {};
const ctx = $('Build writer context').first().json;
let cap = (chk.ok === false && chk.fixed_caption) ? chk.fixed_caption.trim() : draft;
const must = ['#เชียงใหม่', '#ChiangMai', '#มดแดง'];
const missing = must.filter(h => !cap.includes(h));
if (missing.length) cap += '\\n' + missing.join(' ');
if (!/motdang\\.net/i.test(cap)) cap += '\\n👉 motdang.net';
cap = cap.replace(/\\n{3,}/g, '\\n\\n').slice(0, 1900);
const facts = ctx.facts || '';
const ignore = new Set(['2569', '2026', '1', '2', '3', '4', '5', '6', '7']);
const nums = [...new Set((cap.replace(/#\\S+/g, '').match(/\\d+(?:[.,]\\d+)?/g) || []))].filter(n => !ignore.has(n) && !facts.includes(n));
return [{ json: { caption: cap, fact_check_ok: chk.ok !== false, used_fix: chk.ok === false && !!chk.fixed_caption, issues: chk.issues || [], unverified_numbers: nums, slot: ctx.slot, post_date: ctx.post_date, edition: ctx.edition, live_fetched: ctx.live_fetched } }];` } }
});

const logCaptioned = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Log captioned', position: [2520, 140], parameters: {
    resource: 'row', operation: 'insert', dataTableId: TABLE,
    columns: { mappingMode: 'defineBelow', schema: SCHEMA, value: {
      post_date: expr('{{ $json.post_date }}'), slot: expr('{{ $json.slot }}'), status: 'captioned', caption: expr('{{ $json.caption }}'),
      note: expr('{{ "edition: " + $json.edition + " | fact_check_ok: " + $json.fact_check_ok + ($json.issues.length ? " | issues: " + $json.issues.join("; ") : "") + ($json.unverified_numbers.length ? " | unverified: " + $json.unverified_numbers.join(",") : "") }}')
    } }
  } }
});

const returnCaption = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Return caption', position: [2740, 140], parameters: { respondWith: 'json', responseBody: expr('{{ JSON.stringify({ caption: $("Apply guardrails").item.json.caption, row_id: $json.id, fact_check_ok: $("Apply guardrails").item.json.fact_check_ok, used_fix: $("Apply guardrails").item.json.used_fix, issues: $("Apply guardrails").item.json.issues, unverified_numbers: $("Apply guardrails").item.json.unverified_numbers }) }}') } }
});

// ── log branch (after posting)
const hasRow = ifElse({
  version: 2.3,
  config: { name: 'Has row id?', position: [680, 520], parameters: { conditions: { combinator: 'and', options: FOPT, conditions: [
    { leftValue: expr('{{ $json.row_id }}'), rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } }
  ] } } }
});

const updateRow = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Update post row', position: [920, 480], parameters: {
    resource: 'row', operation: 'update', dataTableId: TABLE, matchType: 'allConditions',
    filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.row_id }}') }] },
    columns: { mappingMode: 'defineBelow', schema: SCHEMA, value: {
      status: expr('{{ $json.status || "posted" }}'), fb_post_id: expr('{{ $json.fb_post_id }}'), fb_url: expr('{{ $json.fb_url }}'),
      note: expr('{{ $json.note }}')
    } }
  } }
});

const insertRow = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Insert post row', position: [920, 640], parameters: {
    resource: 'row', operation: 'insert', dataTableId: TABLE,
    columns: { mappingMode: 'defineBelow', schema: SCHEMA, value: {
      post_date: expr('{{ $json.post_date }}'), slot: expr('{{ $json.slot }}'), status: expr('{{ $json.status || "posted" }}'), caption: expr('{{ $json.caption }}'),
      fb_post_id: expr('{{ $json.fb_post_id }}'), fb_url: expr('{{ $json.fb_url }}'), note: expr('{{ $json.note }}')
    } }
  } }
});

const confirmUpdate = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Confirm update', position: [1140, 480], parameters: { respondWith: 'json', responseBody: expr('{{ JSON.stringify({ logged: true, row_id: $json.id, status: $json.status }) }}') } }
});

const confirmInsert = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Confirm insert', position: [1140, 640], parameters: { respondWith: 'json', responseBody: expr('{{ JSON.stringify({ logged: true, row_id: $json.id }) }}') } }
});

// ── status branch
const todayRows = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: "Today's rows", position: [680, 800], alwaysOutputData: true, parameters: {
    resource: 'row', operation: 'get', dataTableId: TABLE, returnAll: true,
    filters: { conditions: [{ keyName: 'post_date', condition: 'eq', keyValue: expr('{{ $json.post_date }}') }] }
  } }
});

const returnStatus = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Return status', position: [920, 800], parameters: { respondWith: 'allIncomingItems', options: { responseKey: 'rows' } } }
});

const unknownAction = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Unknown action', position: [680, 960], parameters: { respondWith: 'json', responseBody: '{"error":"action must be caption, log or status"}', options: { responseCode: 400 } } }
});

// ───────────── 2. Watchdog: did each edition actually post? ─────────────
const watchdog = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.4,
  config: { name: 'Watchdog 07:30 · 12:30 · 18:30', position: [0, 1200], parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 30 7,12,18 * * *' }] } } }
});

const whichSlot = node({
  type: 'n8n-nodes-base.set', version: 3.5,
  config: { name: 'Which slot is due?', position: [220, 1200], parameters: { mode: 'manual', assignments: { assignments: [
    { id: 'w1', name: 'post_date', value: expr('{{ $now.setZone("Asia/Bangkok").toFormat("yyyy-MM-dd") }}'), type: 'string' },
    { id: 'w2', name: 'slot', value: expr('{{ $now.setZone("Asia/Bangkok").hour < 10 ? "morning" : ($now.setZone("Asia/Bangkok").hour < 15 ? "noon" : "evening") }}'), type: 'string' }
  ] } } }
});

const slotPosted = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Slot posted?', position: [440, 1200], alwaysOutputData: true, parameters: {
    resource: 'row', operation: 'get', dataTableId: TABLE, matchType: 'allConditions', limit: 1,
    filters: { conditions: [
      { keyName: 'post_date', condition: 'eq', keyValue: expr('{{ $json.post_date }}') },
      { keyName: 'slot', condition: 'eq', keyValue: expr('{{ $json.slot }}') },
      { keyName: 'status', condition: 'eq', keyValue: 'posted' }
    ] }
  } }
});

const isMissing = ifElse({
  version: 2.3,
  config: { name: 'Missing?', position: [660, 1200], parameters: { conditions: { combinator: 'and', options: FOPT, conditions: [
    { leftValue: expr('{{ $json.id }}'), rightValue: '', operator: { type: 'number', operation: 'notExists', singleValue: true } }
  ] } } }
});

const logMissed = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Log missed slot', position: [880, 1140], parameters: {
    resource: 'row', operation: 'insert', dataTableId: TABLE,
    columns: { mappingMode: 'defineBelow', schema: SCHEMA, value: {
      post_date: expr('{{ $("Which slot is due?").item.json.post_date }}'), slot: expr('{{ $("Which slot is due?").item.json.slot }}'), status: 'missed',
      note: expr('{{ "No Facebook post logged 30 min after the " + $("Which slot is due?").item.json.slot + " slot" }}')
    } }
  } }
});

// ───────────── 3. Nightly report ─────────────
const nightly = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.4,
  config: { name: 'Nightly report 21:30', position: [0, 1500], parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 30 21 * * *' }] } } }
});

const dayRows = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: "Fetch today's log", position: [220, 1500], alwaysOutputData: true, parameters: {
    resource: 'row', operation: 'get', dataTableId: TABLE, returnAll: true,
    filters: { conditions: [{ keyName: 'post_date', condition: 'eq', keyValue: expr('{{ $now.setZone("Asia/Bangkok").toFormat("yyyy-MM-dd") }}') }] }
  } }
});

const summarise = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Summarise the day', position: [440, 1500], parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const rows = $input.all().map(i => i.json).filter(r => r && r.slot && r.slot !== 'daily-report');
const slots = ['morning', 'noon', 'evening'];
const by = {};
for (const s of slots) {
  const rs = rows.filter(r => r.slot === s);
  by[s] = rs.some(r => r.status === 'posted') ? 'posted' : rs.some(r => r.status === 'failed') ? 'failed' : rs.some(r => r.status === 'missed') ? 'missed' : rs.length ? rs[rs.length - 1].status : 'nothing logged';
}
const posted = slots.filter(s => by[s] === 'posted').length;
const links = rows.filter(r => r.fb_url).map(r => r.slot + ': ' + r.fb_url);
const fixes = rows.filter(r => (r.note || '').includes('fact_check_ok: false')).length;
const date = $now.setZone('Asia/Bangkok').toFormat('yyyy-MM-dd');
return [{ json: { date, posted, by, links, fixes, text: 'Date ' + date + ': ' + posted + '/3 editions posted. ' + slots.map(s => s + '=' + by[s]).join(', ') + '. Captions auto-fixed by fact-checker: ' + fixes + '. Links: ' + (links.join(' | ') || 'none') } }];` } }
});

const reportModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', version: 1.6,
  config: { name: 'Claude reporter', position: [660, 1700], parameters: { model: { __rl: true, mode: 'list', value: 'claude-sonnet-5', cachedResultName: 'Claude Sonnet 5' }, options: { maxTokensToSample: 500 } }, credentials: { anthropicApi: newCredential('Anthropic') } }
});

const writeReport = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm', version: 1.9,
  config: { name: 'Write daily report', position: [660, 1500], parameters: {
    promptType: 'define', text: expr('{{ $json.text }}'),
    messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: 'Write a 3-line operations note (Thai first line, then English) for the Mot Dang owner about today\'s automated Facebook video posts: how many of 3 went out, anything missed or failed and what to check. Plain text, no hashtags, use only the given numbers.' }] }
  }, subnodes: { model: reportModel } }
});

const logReport = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Save daily report', position: [880, 1500], parameters: {
    resource: 'row', operation: 'insert', dataTableId: TABLE,
    columns: { mappingMode: 'defineBelow', schema: SCHEMA, value: {
      post_date: expr('{{ $("Summarise the day").item.json.date }}'), slot: 'daily-report', status: expr('{{ $("Summarise the day").item.json.posted + "/3 posted" }}'),
      caption: expr('{{ $json.text }}'), note: expr('{{ $("Summarise the day").item.json.text }}')
    } }
  } }
});

// ───────────── 4. Errors from this workflow ─────────────
const onError = trigger({
  type: 'n8n-nodes-base.errorTrigger', version: 1,
  config: { name: 'On workflow error', position: [0, 1800] }
});

const logError = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Log n8n error', position: [220, 1800], parameters: {
    resource: 'row', operation: 'insert', dataTableId: TABLE,
    columns: { mappingMode: 'defineBelow', schema: SCHEMA, value: {
      post_date: expr('{{ $now.setZone("Asia/Bangkok").toFormat("yyyy-MM-dd") }}'), slot: 'n8n', status: 'n8n-error',
      note: expr('{{ ($json.execution && $json.execution.lastNodeExecuted || "") + ": " + ($json.execution && $json.execution.error && $json.execution.error.message || "unknown error") }}')
    } }
  } }
});

const s1 = sticky('## 🐜 Mot Dang · daily motion-graphic videos\n**Claude** renders a 45-second video 3× a day (07:00 · 12:00 · 18:00) from live motdang.net data, then calls this webhook:\n1. `caption` → duplicate guard → Claude writes → Claude fact-checks against the facts → guardrails → logged\n2. Claude posts video + caption to the **Motdang.net** Facebook Page\n3. `log` → row updated with the Facebook link\n4. `status` → today\'s rows', [hook, normalize, route], { color: 5 });
const s2 = sticky('### Watchdog & nightly report\nIf an edition has no `posted` row 30 min after its slot, a `missed` row is written. At 21:30 Claude writes a short ops note into the table (slot = daily-report).', [watchdog, whichSlot], { color: 3 });

export default workflow('motdang-video-pipeline', 'Mot Dang · Daily video pipeline')
  .add(hook)
  .to(normalize)
  .to(route
    .onCase(0, validCaption
      .onTrue(findPosted.to(isDuplicate
        .onTrue(skipDuplicate)
        .onFalse(liveCheck.to(context).to(writeCaption).to(factCheck).to(guardrails).to(logCaptioned).to(returnCaption))))
      .onFalse(rejectBad))
    .onCase(1, hasRow.onTrue(updateRow.to(confirmUpdate)).onFalse(insertRow.to(confirmInsert)))
    .onCase(2, todayRows.to(returnStatus))
    .onCase(3, unknownAction))
  .add(watchdog)
  .to(whichSlot)
  .to(slotPosted)
  .to(isMissing.onTrue(logMissed))
  .add(nightly)
  .to(dayRows)
  .to(summarise)
  .to(writeReport)
  .to(logReport)
  .add(onError)
  .to(logError)
  .add(s1)
  .add(s2)
  .group('Write & fact-check the caption', [liveCheck, context, writeCaption, writerModel, factCheck, checkerModel, checkParser, guardrails, logCaptioned], { description: 'Live data freshness check, Claude writes the caption, a second Claude pass fact-checks and repairs it, code guardrails, then logs it' })
  .group('Nightly report', [dayRows, summarise, writeReport, reportModel, logReport], { description: "Counts today's posted / missed / failed editions and saves a short ops note" });
