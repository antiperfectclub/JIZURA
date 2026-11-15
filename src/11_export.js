/* ============================================================
   JIZURA — export: MP4 (WebCodecs + mp4-muxer), PNG sequence ZIP,
   file saving (artifact download capability or plain browser download)
   ============================================================ */
(() => {
'use strict';

/* ---------- saving ---------- */
J.saveFile = async (filename, data) => {
  const blob = data instanceof Blob ? data : new Blob([data]);
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const dl = await window.claude.use('downloads');
      if (dl) { await dl.save({ filename, data: blob }); return 'saved'; }
    }
  } catch (e) {
    if (e && e.code === 'declined') return 'declined';
    if (e && e.code && e.code !== 'unavailable' && e.code !== 'not_granted') throw e;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return 'saved';
};

/* ---------- codec negotiation ---------- */
const VIDEO_CANDS = [
  { codec: 'avc1.640034', mux: 'avc', label: 'H.264 High' },
  { codec: 'avc1.640033', mux: 'avc', label: 'H.264 High' },
  { codec: 'avc1.4d0033', mux: 'avc', label: 'H.264 Main' },
  { codec: 'avc1.42003e', mux: 'avc', label: 'H.264 Baseline' },
  { codec: 'vp09.00.51.08', mux: 'vp9', label: 'VP9' },
  { codec: 'av01.0.12M.08', mux: 'av1', label: 'AV1' },
];
// hardware encoders often refuse very high bitrates (52 Mbps+ for 1080p60 at 最高) — keep them in a range they accept
J.videoBitrate = (w, h, fps, quality) => {
  const want = w * h * fps * (quality === 'max' ? 0.42 : quality === 'high' ? 0.28 : 0.16);
  const px = w * h, cap = px <= 2.2e6 ? 40e6 : px <= 3.8e6 ? 60e6 : 90e6;
  return Math.round(Math.min(want, cap));
};
const vcfg = (c, w, h, fps, bitrate, hw) => {
  const cfg = { codec: c.codec, width: w, height: h, bitrate, framerate: fps };
  if (hw) cfg.hardwareAcceleration = hw;
  if (c.mux === 'avc') cfg.avc = { format: 'avc' };
  return cfg;
};
async function supported(cfg) { try { const s = await VideoEncoder.isConfigSupported(cfg); return !!(s && s.supported); } catch (e) { return false; } }
const codecMemo = new Map();   // the answer never changes for a page load; asking the browser again costs ~100 ms
J.pickVideoCodec = (w, h, fps, bitrate) => {
  const key = [w, h, fps, bitrate].join('/');
  if (!codecMemo.has(key)) codecMemo.set(key, (async () => {
    if (typeof VideoEncoder === 'undefined') return null;
    for (const c of VIDEO_CANDS) { const cfg = vcfg(c, w, h, fps, bitrate); if (await supported(cfg)) return Object.assign({}, c, { cfg }); }
    return null;
  })());
  return codecMemo.get(key).then(vc => vc && Object.assign({}, vc, { cfg: Object.assign({}, vc.cfg) }));
};
/* the encoders to try, best first: the browser's choice, then the same codec in software (GPU encoders are the usual
   reason an export fails every time on one PC), then a simpler profile / lower bitrate in software, then VP9 */
J.videoAttempts = async (w, h, fps, bitrate) => {
  if (typeof VideoEncoder === 'undefined') return [];
  const out = [], seen = new Set();
  const add = async (c, hw, br) => {
    const key = c.codec + '|' + (hw || '') + '|' + br;
    if (seen.has(key) || out.length >= 5) return;
    const cfg = vcfg(c, w, h, fps, br, hw);
    if (await supported(cfg)) { seen.add(key); out.push(Object.assign({}, c, { cfg, hw: hw || 'auto' })); }
  };
  let first = null;
  for (const c of VIDEO_CANDS) { const cfg = vcfg(c, w, h, fps, bitrate); if (await supported(cfg)) { first = c; break; } }
  if (first) { await add(first, null, bitrate); await add(first, 'prefer-software', bitrate); }
  const avc = VIDEO_CANDS.filter(c => c.mux === 'avc' && c !== first);
  for (const c of avc) { await add(c, 'prefer-software', Math.round(bitrate * 0.7)); if (out.length >= 3) break; }
  for (const c of VIDEO_CANDS.filter(c => c.mux !== 'avc')) await add(c, 'prefer-software', Math.round(bitrate * 0.7));
  return out;
};
J.pickAudioCodec = async (sr, chn) => {
  if (typeof AudioEncoder === 'undefined') return null;
  for (const c of [{ codec: 'mp4a.40.2', mux: 'aac', sr: 48000 }, { codec: 'opus', mux: 'opus', sr: 48000 }]) {
    try { const s = await AudioEncoder.isConfigSupported({ codec: c.codec, sampleRate: c.sr, numberOfChannels: chn, bitrate: 192000 }); if (s.supported) return c; } catch (e) {}
  }
  return null;
};
const ALPHA_VIDEO_CANDS = [
  { codec: 'vp09.00.51.08', webm: 'V_VP9', label: 'VP9' },
  { codec: 'vp09.00.41.08', webm: 'V_VP9', label: 'VP9' },
  { codec: 'vp09.00.31.08', webm: 'V_VP9', label: 'VP9' },
  { codec: 'vp8', webm: 'V_VP8', label: 'VP8' },
];
const alphaMemo = new Map();
J.pickAlphaVideoCodec = (w, h, fps, bitrate) => {
  const key = [w, h, fps, bitrate].join('/');
  if (!alphaMemo.has(key)) alphaMemo.set(key, (async () => {
    if (typeof VideoEncoder === 'undefined') return null;
    for (const c of ALPHA_VIDEO_CANDS) { const cfg = vcfg(c, w, h, fps, bitrate); if (await supported(cfg)) return Object.assign({}, c, { cfg }); }
    return null;
  })());
  return alphaMemo.get(key).then(vc => vc && Object.assign({}, vc, { cfg: Object.assign({}, vc.cfg) }));
};
J.alphaVideoAttempts = async (w, h, fps, bitrate) => {
  if (typeof VideoEncoder === 'undefined') return [];
  const out = [], seen = new Set();
  const add = async (c, hw, br) => {
    const key = c.codec + '|' + (hw || '') + '|' + br;
    if (seen.has(key) || out.length >= 5) return;
    const cfg = vcfg(c, w, h, fps, br, hw);
    if (await supported(cfg)) { seen.add(key); out.push(Object.assign({}, c, { cfg, hw: hw || 'auto' })); }
  };
  let first = null;
  for (const c of ALPHA_VIDEO_CANDS) { const cfg = vcfg(c, w, h, fps, bitrate); if (await supported(cfg)) { first = c; break; } }
  if (first) { await add(first, null, bitrate); await add(first, 'prefer-software', bitrate); }
  for (const c of ALPHA_VIDEO_CANDS.filter(x => x !== first)) await add(c, 'prefer-software', Math.round(bitrate * 0.75));
  return out;
};
J.pickAlphaAudioCodec = async (sr, chn) => {
  if (typeof AudioEncoder === 'undefined') return null;
  try { const s = await AudioEncoder.isConfigSupported({ codec: 'opus', sampleRate: 48000, numberOfChannels: chn, bitrate: 192000 }); if (s.supported) return { codec: 'opus', mux: 'opus', sr: 48000 }; } catch (e) {}
  return null;
};

async function resample(buffer, sr, duration, offset = 0) {
  const chn = Math.min(2, buffer.numberOfChannels);
  const len = Math.ceil(duration * sr);
  const oc = new OfflineAudioContext(chn, len, sr);
  const src = oc.createBufferSource(); src.buffer = buffer; src.connect(oc.destination); src.start(0, Math.max(0, offset));
  return oc.startRendering();
}
/* part of the song to export: range = { t0, t1 } in seconds (選んだ行だけ), default the whole plan */
J.exportSpan = (plan, range) => {
  const t0 = range ? Math.max(0, range.t0) : 0, t1 = range ? Math.min(plan.duration, range.t1) : plan.duration;
  return { t0, dur: Math.max(1 / plan.fps, t1 - t0) };
};

/* ---------- LRC (timed lyrics) ----------
   each line gets its start time (typed / tapped > LRC tag > estimate), the lyric row as written (/ * ! | and interlude rows kept).
   With a line range, only those lines, timed from the start of the exported video. */
J.lrcText = (project, lines, range) => {
  const parsed = J.parseLyrics(project.lyrics);
  const tm = J.computeTiming(project, parsed, null);
  const rows = String(project.lyrics || '').replace(/\r/g, '').split('\n');
  const stamp = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return `[${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}]`; };
  const clean = r => String(r || '').trim().replace(/^(\[\d+:\d+(?:[.:]\d+)?\])+/, '').trim();
  const out = [];
  const ti = project.title || parsed.meta.ti, ar = project.artist || parsed.meta.ar;
  if (ti) out.push(`[ti:${ti}]`); if (ar) out.push(`[ar:${ar}]`); if (parsed.meta.al) out.push(`[al:${parsed.meta.al}]`);
  const from = range ? range.from : 0, to = range ? range.to : parsed.lines.length - 1, t0 = range ? range.t0 : 0;
  for (let i = from; i <= to && i < parsed.lines.length; i++) {
    const L = parsed.lines[i];
    let txt = clean(rows[L.src]);
    if (L.interlude && !/^\[/.test(txt)) txt = '[間奏]';
    out.push(stamp(tm.starts[i] - t0) + txt);
  }
  return out.join('\n') + '\n';
};

/* ---------- SRT / WebVTT (subtitles) → timed lyrics ----------
   one subtitle block = one lyric row, tagged with its start time. A block's end time is kept as an interlude row
   when the next block starts `gap` seconds or more later, so the line ends where the singing ends; the last
   block gets a short one. Returns null when the text holds no subtitle timing. */
J.isSubtitleText = text => /(?:^|\n)\s*(?:\d+:)?\d+:\d+[.,]\d+\s*-->\s*(?:\d+:)?\d+:\d+[.,]\d+/.test(String(text || ''));
J.srtToLyrics = (text, gap = 1) => {
  const sec = s => { const m = s.match(/(?:(\d+):)?(\d+):(\d+)[.,](\d+)/); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + parseFloat('0.' + m[4]) : NaN; };
  const stamp = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return `[${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}]`; };
  const TIME = /^\s*((?:\d+:)?\d+:\d+[.,]\d+)\s*-->\s*((?:\d+:)?\d+:\d+[.,]\d+)/;
  const cues = [];
  let cur = null;
  for (const row of String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n')) {
    const m = row.match(TIME);
    if (m) { cur = { start: sec(m[1]), end: sec(m[2]), rows: [] }; cues.push(cur); continue; }
    if (!row.trim()) { cur = null; continue; }
    if (cur) cur.rows.push(row);
  }
  const body = c => c.rows.map(r => r.replace(/<[^>]*>/g, '').replace(/\{\\[^}]*\}/g, '').trim()).filter(Boolean).join(' ')
    .replace(/^[♪♫\s]+|[♪♫\s]+$/g, '').replace(/^#/, '＃').replace(/^\[/, '［');     // a row may not read as a comment or a tag
  const list = cues.filter(c => isFinite(c.start) && isFinite(c.end)).map(c => ({ start: c.start, end: Math.max(c.start, c.end), text: body(c) })).filter(c => c.text).sort((a, b) => a.start - b.start);
  if (!list.length) return null;
  const out = [], IL = '[間奏]'; let gaps = 0;
  list.forEach((c, i) => {
    out.push(stamp(c.start) + c.text);
    const next = list[i + 1];
    if (next && next.start - c.end >= gap) { out.push(stamp(c.end) + IL); gaps++; }
    else if (!next && c.end - c.start >= 0.2) out.push(stamp(c.end) + IL.slice(0, -1) + ' 1]');
  });
  return { lyrics: out.join('\n'), lines: list.length, gaps };
};

/* ---------- MP4 ---------- */
/* The MP4 is written as it is encoded (mp4-muxer, moov at the end) instead of being assembled in one huge
   ArrayBuffer: into many small memory blocks (file: null), or straight into a file the user picked
   (file: a FileSystemWritableFileStream, the "large video" button). A long 1080p / 1440p song used to need one contiguous
   buffer of several hundred MB, doubled on finalize, which is what made those exports fail. */
class BlockStore {                    // positioned writes into a list of blocks → Blob (no single giant buffer)
  constructor() { this.blocks = []; this.end = 0; }
  write(data, pos) {
    let u = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (pos > this.end) { this.blocks.push({ pos: this.end, u: new Uint8Array(pos - this.end) }); this.end = pos; }
    // overwrite what already exists (mp4-muxer patches the mdat size at finalize)
    for (const b of this.blocks) {
      if (pos >= this.end || !u.length) break;
      const s0 = Math.max(pos, b.pos), s1 = Math.min(pos + u.length, b.pos + b.u.length);
      if (s1 > s0) b.u.set(u.subarray(s0 - pos, s1 - pos), s0 - b.pos);
    }
    if (pos + u.length > this.end) { const from = Math.max(0, this.end - pos); this.blocks.push({ pos: this.end, u: u.slice(from) }); this.end = pos + u.length; }
  }
  blob(type) { return new Blob(this.blocks.map(b => b.u), { type }); }
}
J.exportMP4 = async (o) => {
  const { plan, project, audio, quality = 'high', onProgress, signal, range, file = null } = o;
  const [w, h] = J.outputSize(project);
  const fps = plan.fps, bitrate = J.videoBitrate(w, h, fps, quality);
  const attempts = await J.videoAttempts(w, h, fps, bitrate);
  if (!attempts.length) throw new Error('このブラウザは動画エンコード（WebCodecs）に対応していません。Chrome か Edge の最新版で開いてください。');
  const tried = [];
  for (let k = 0; k < attempts.length; k++) {
    const vc = attempts[k];
    try {
      if (file && k > 0) { await file.seek(0); await file.truncate(0); }
      const r = await encodeMP4(Object.assign({}, o, { w, h, vc, note: k > 0 ? `（${vc.label}・ソフトウェアで再試行 ${k}）` : '' }));
      r.tried = tried; return r;
    } catch (e) {
      if (signal && signal.aborted) throw new Error('キャンセルしました');
      if (e && e.jzFatal) throw e;
      tried.push(`${vc.label}/${vc.hw}: ${e && e.message ? e.message : e}`);
      console.warn('MP4 export attempt failed', vc.codec, vc.hw, e);
    }
  }
  const err = new Error('MP4 を書き出せませんでした。' + (file ? '' : '「大きな動画用（ファイルに直接保存）」か、') + '解像度・fps・画質を下げて試してください。詳細：' + tried.join(' ／ '));
  err.detail = tried; throw err;
};
async function encodeMP4({ plan, project, audio, onProgress, signal, range, file, w, h, vc, note }) {
  const span = J.exportSpan(plan, range);
  const fps = plan.fps;
  let ac = null;
  if (audio && audio.buffer && project.includeAudio !== false) ac = await J.pickAudioCodec(48000, Math.min(2, audio.buffer.numberOfChannels));
  const store = file ? null : new BlockStore();
  const target = file ? new Mp4Muxer.FileSystemWritableFileStreamTarget(file, { chunkSize: 8 * 1048576 })
    : new Mp4Muxer.StreamTarget({ onData: (data, pos) => store.write(data, pos), chunked: true, chunkSize: 8 * 1048576 });
  const muxOpts = { target, video: { codec: vc.mux, width: w, height: h, frameRate: fps }, fastStart: false, firstTimestampBehavior: 'offset' };
  if (ac) muxOpts.audio = { codec: ac.mux, numberOfChannels: Math.min(2, audio.buffer.numberOfChannels), sampleRate: ac.sr };
  const muxer = new Mp4Muxer.Muxer(muxOpts);
  let err = null, outFrames = 0;
  const venc = new VideoEncoder({ output: (chunk, meta) => { outFrames++; try { muxer.addVideoChunk(chunk, meta); } catch (e) { err = e; } }, error: e => { err = e; } });
  venc.configure(Object.assign({}, vc.cfg, { latencyMode: 'quality' }));
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  const R = new J.Renderer();
  const total = Math.max(1, Math.round(span.dur * fps));
  const scale = w / plan.W;
  const prevRes = J.glyphs.maxRes; J.glyphs.maxRes = h >= 1000 ? 768 : 512;
  const closeEnc = () => { try { if (venc.state !== 'closed') venc.close(); } catch (e) {} };
  try {
    for (let i = 0; i < total; i++) {
      if (signal && signal.aborted) { closeEnc(); throw new Error('キャンセルしました'); }
      if (err) throw err;
      if (venc.state === 'closed') throw new Error('エンコーダーが停止しました');
      R.frame(ctx, plan, span.t0 + i / fps, { scale });
      const vf = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      try { venc.encode(vf, { keyFrame: i % (fps * 2) === 0 }); } finally { vf.close(); }
      let spins = 0;
      // (time in the background doesn't count: a phone pauses the encoder while the page is hidden)
      while (venc.encodeQueueSize > 4 && !err) { await new Promise(r => setTimeout(r, 2)); if (!document.hidden && ++spins > 15000) throw new Error('エンコーダーが応答しません'); }
      // an encoder that accepts frames but never returns any has failed silently (seen with some GPU drivers)
      if (i === Math.min(total - 1, fps * 3) && outFrames === 0) { await venc.flush(); if (!outFrames) throw new Error('エンコーダーが出力を返しません'); }
      if (i % 3 === 0) { onProgress && onProgress(i / total, `フレーム ${i + 1}/${total}${note || ''}`); await new Promise(r => setTimeout(r, 0)); }
    }
    await venc.flush();
    if (err) throw err;
  } catch (e) { closeEnc(); throw e; }
  finally { J.glyphs.maxRes = prevRes; }
  closeEnc();
  if (outFrames < total * 0.98) throw new Error(`動画のフレームが足りません（${outFrames}/${total}）`);
  if (ac) {
    onProgress && onProgress(0.99, '音声をエンコード中');
    const rs = await resample(audio.buffer, ac.sr, span.dur, span.t0);
    const chn = rs.numberOfChannels;
    let aChunks = 0, aEnd = 0, aErr = null;
    const aenc = new AudioEncoder({ output: (chunk, meta) => { aChunks++; aEnd = Math.max(aEnd, chunk.timestamp + (chunk.duration || 0)); muxer.addAudioChunk(chunk, meta); }, error: e => { aErr = e; } });
    aenc.configure({ codec: ac.codec, sampleRate: ac.sr, numberOfChannels: chn, bitrate: 192000 });
    const frames = rs.length, block = 4800;
    for (let off = 0; off < frames; off += block) {
      if (aErr) break;
      const n = Math.min(block, frames - off);
      const data = new Float32Array(n * chn);
      for (let c = 0; c < chn; c++) data.set(rs.getChannelData(c).subarray(off, off + n), c * n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: ac.sr, numberOfFrames: n, numberOfChannels: chn, timestamp: Math.round(off * 1e6 / ac.sr), data });
      aenc.encode(ad); ad.close();
      if (aenc.encodeQueueSize > 16) await new Promise(r => setTimeout(r, 1));
    }
    await aenc.flush(); aenc.close();
    const fatal = m => { const e = new Error(m); e.jzFatal = true; return e; };    // audio problems: another video encoder won't help
    if (aErr) throw fatal('音声のエンコードに失敗しました: ' + (aErr.message || aErr));
    // the encoder must have produced the whole soundtrack — otherwise report it instead of writing a silent file
    if (!aChunks || aEnd < (Math.min(span.dur, audio.buffer.duration - span.t0) - 0.5) * 1e6) throw fatal('音声のエンコードが途中で止まりました（' + aChunks + '）。もう一度書き出してください');
  }
  onProgress && onProgress(0.995, 'ファイルを仕上げ中');
  muxer.finalize();
  if (file) await file.close();
  onProgress && onProgress(1, '完了');
  const size = file ? null : store.end;
  return { blob: file ? null : store.blob('video/mp4'), size, codec: vc.label + (vc.hw === 'prefer-software' ? '（ソフトウェア）' : ''), audio: ac ? ac.mux : null, audioWanted: !!(audio && audio.buffer && project.includeAudio !== false), width: w, height: h, toFile: !!file };
}

/* ---------- WebM with alpha channel (VP9/VP8 color + VP9/VP8 alpha via BlockAdditions, optional Opus audio) ---------- */
function ebmlVint(n) {
  if (n < 0x7f) return new Uint8Array([0x80 | n]);
  if (n < 0x3fff) return new Uint8Array([0x40 | (n >>> 8), n & 0xff]);
  if (n < 0x1fffff) return new Uint8Array([0x20 | (n >>> 16), (n >>> 8) & 0xff, n & 0xff]);
  if (n < 0x0fffffff) return new Uint8Array([0x10 | (n >>> 24), (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
  return ebmlVint8(n);
}
function ebmlVint8(n) {
  const out = new Uint8Array(8);
  out[0] = 0x01;
  const hi = Math.floor(n / 0x100000000), lo = n >>> 0;
  out[1] = (hi >>> 16) & 0xff; out[2] = (hi >>> 8) & 0xff; out[3] = hi & 0xff;
  out[4] = (lo >>> 24) & 0xff; out[5] = (lo >>> 16) & 0xff; out[6] = (lo >>> 8) & 0xff; out[7] = lo & 0xff;
  return out;
}
function ebmlConcat(parts) {
  let len = 0; for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let off = 0; for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}
function ebmlEl(id, payload) {
  const i = id instanceof Uint8Array ? id : new Uint8Array(id);
  const p = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
  return ebmlConcat([i, ebmlVint(p.length), p]);
}
function ebmlUintBytes(v) {
  if (v === 0) return new Uint8Array([0]);
  const a = [];
  let x = v;
  while (x > 0) { a.unshift(x % 256); x = Math.floor(x / 256); }
  return new Uint8Array(a);
}
function ebmlIntBytes(v) {
  if (v >= -128 && v <= 127) return new Uint8Array([v & 0xff]);
  if (v >= -32768 && v <= 32767) return new Uint8Array([(v >> 8) & 0xff, v & 0xff]);
  return new Uint8Array([(v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]);
}
function ebmlFloat64(v) {
  const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, v, false); return b;
}
function ebmlStr(s) { return new TextEncoder().encode(s); }
function opusHead(chn, sr = 48000) {
  const b = new Uint8Array(19), dv = new DataView(b.buffer);
  b.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], 0);
  b[8] = 1; b[9] = chn; dv.setUint16(10, 312, true); dv.setUint32(12, sr, true); dv.setInt16(16, 0, true); b[18] = 0;
  return b;
}
class WebMAlphaMuxer {
  constructor({ store, file, width, height, codecId, audio }) {
    this.store = store; this.file = file; this.pos = 0;
    this.cluster = []; this.clusterTs = -1; this.clusterStartPos = 0; this.clusterHasKey = false;
    this.prevVideoTs = 0; this.maxTs = 0; this.cues = [];
    this.width = width; this.height = height; this.codecId = codecId; this.audio = audio;
  }
  async writeSeq(u8) {
    if (this.file) await this.file.write(u8);
    else this.store.write(u8, this.pos);
    this.pos += u8.length;
  }
  async writeAt(pos, u8) {
    if (this.file) await this.file.write({ type: 'write', position: pos, data: u8 });
    else this.store.write(u8, pos);
  }
  async init() {
    const hdr = ebmlEl([0x1a, 0x45, 0xdf, 0xa3], ebmlConcat([
      ebmlEl([0x42, 0x86], [1]), ebmlEl([0x42, 0xf7], [1]), ebmlEl([0x42, 0xf2], [4]), ebmlEl([0x42, 0xf3], [8]),
      ebmlEl([0x42, 0x82], ebmlStr('webm')), ebmlEl([0x42, 0x87], [4]), ebmlEl([0x42, 0x85], [2]),
    ]));
    await this.writeSeq(hdr);
    await this.writeSeq(new Uint8Array([0x18, 0x53, 0x80, 0x67])); // Segment ID
    this.segSizePos = this.pos;
    await this.writeSeq(new Uint8Array([0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])); // patched on finalize
    this.segDataStart = this.pos;
    const info = ebmlEl([0x15, 0x49, 0xa9, 0x66], ebmlConcat([
      ebmlEl([0x2a, 0xd7, 0xb1], ebmlUintBytes(1000000)),
      ebmlEl([0x4d, 0x80], ebmlStr('JIZURA')),
      ebmlEl([0x57, 0x41], ebmlStr('JIZURA')),
      ebmlEl([0x44, 0x89], ebmlFloat64(0)),
    ]));
    this.durValPos = this.pos + info.length - 8;
    await this.writeSeq(info);
    const vTrack = ebmlEl([0xae], ebmlConcat([
      ebmlEl([0xd7], [1]), ebmlEl([0x73, 0xc5], [1]), ebmlEl([0x83], [1]), ebmlEl([0x9c], [0]),
      ebmlEl([0x86], ebmlStr(this.codecId)),
      ebmlEl([0xe0], ebmlConcat([
        ebmlEl([0xb0], ebmlUintBytes(this.width)),
        ebmlEl([0xba], ebmlUintBytes(this.height)),
        ebmlEl([0x53, 0xc0], [1]), // AlphaMode = 1
      ])),
    ]));
    const trackParts = [vTrack];
    if (this.audio) {
      const a = this.audio;
      trackParts.push(ebmlEl([0xae], ebmlConcat([
        ebmlEl([0xd7], [2]), ebmlEl([0x73, 0xc5], [2]), ebmlEl([0x83], [2]), ebmlEl([0x9c], [0]),
        ebmlEl([0x86], ebmlStr('A_OPUS')),
        ebmlEl([0x63, 0xa2], a.desc || opusHead(a.chn, a.sr)),
        ebmlEl([0x56, 0xaa], ebmlUintBytes(6500000)),
        ebmlEl([0x56, 0xbb], ebmlUintBytes(80000000)),
        ebmlEl([0xe1], ebmlConcat([ebmlEl([0xb5], ebmlFloat64(a.sr)), ebmlEl([0x9f], [a.chn])])),
      ])));
    }
    await this.writeSeq(ebmlEl([0x16, 0x54, 0xae, 0x6b], ebmlConcat(trackParts)));
  }
  async flushCluster() {
    if (!this.cluster.length) return;
    if (this.clusterHasKey) this.cues.push({ ts: this.clusterTs, pos: this.pos - this.segDataStart });
    await this.writeSeq(ebmlEl([0x1f, 0x43, 0xb6, 0x75], ebmlConcat(this.cluster)));
    this.cluster = [];
  }
  async ensureCluster(tsMs, forceNew) {
    if (this.clusterTs < 0 || forceNew || tsMs - this.clusterTs >= 30000) {
      await this.flushCluster();
      this.clusterTs = tsMs;
      this.clusterHasKey = false;
      this.cluster.push(ebmlEl([0xe7], ebmlUintBytes(tsMs)));
    }
  }
  async addVideo(tsMs, isKey, colorU8, alphaU8) {
    await this.ensureCluster(tsMs, isKey && this.clusterTs >= 0);
    if (isKey) this.clusterHasKey = true;
    const rel = Math.max(-32768, Math.min(32767, tsMs - this.clusterTs));
    const blk = ebmlEl([0xa1], ebmlConcat([new Uint8Array([0x81, (rel >> 8) & 0xff, rel & 0xff, 0x00]), colorU8]));
    const add = ebmlEl([0x75, 0xa1], ebmlEl([0xa6], ebmlConcat([ebmlEl([0xee], [1]), ebmlEl([0xa5], alphaU8)])));
    const kids = isKey ? [blk, add] : [blk, add, ebmlEl([0xfb], ebmlIntBytes(-(Math.max(1, tsMs - this.prevVideoTs))))];
    this.cluster.push(ebmlEl([0xa0], ebmlConcat(kids)));
    this.prevVideoTs = tsMs;
    if (tsMs > this.maxTs) this.maxTs = tsMs;
  }
  async addAudio(tsMs, opusU8) {
    await this.ensureCluster(tsMs, false);
    const rel = Math.max(-32768, Math.min(32767, tsMs - this.clusterTs));
    const hdr = new Uint8Array([0x82, (rel >> 8) & 0xff, rel & 0xff, 0x80]);
    this.cluster.push(ebmlEl([0xa3], ebmlConcat([hdr, opusU8])));
    if (tsMs > this.maxTs) this.maxTs = tsMs;
  }
  async finalize(durMs) {
    await this.flushCluster();
    if (this.cues.length) {
      const pts = this.cues.map(c => ebmlEl([0xbb], ebmlConcat([
        ebmlEl([0xb3], ebmlUintBytes(c.ts)),
        ebmlEl([0xb7], ebmlConcat([ebmlEl([0xf7], [1]), ebmlEl([0xf1], ebmlUintBytes(c.pos))])),
      ])));
      await this.writeSeq(ebmlEl([0x1c, 0x53, 0xbb, 0x6b], ebmlConcat(pts)));
    }
    const totalDur = Math.max(this.maxTs, durMs || 0);
    await this.writeAt(this.durValPos, ebmlFloat64(totalDur));
    await this.writeAt(this.segSizePos, ebmlVint8(this.pos - this.segDataStart));
  }
}

J.exportWebMAlpha = async (o) => {
  const { plan, project, audio, quality = 'high', onProgress, signal, range, file = null } = o;
  const [w, h] = J.outputSize(project);
  const fps = plan.fps, bitrate = J.videoBitrate(w, h, fps, quality);
  const attempts = await J.alphaVideoAttempts(w, h, fps, bitrate);
  if (!attempts.length) throw new Error('このブラウザは動画エンコード（WebCodecs）に対応していません。Chrome か Edge の最新版で開いてください。');
  const tried = [];
  for (let k = 0; k < attempts.length; k++) {
    const vc = attempts[k];
    try {
      if (file && k > 0) { await file.seek(0); await file.truncate(0); }
      const r = await encodeWebMAlpha(Object.assign({}, o, { w, h, vc, note: k > 0 ? `（${vc.label}・ソフトウェアで再試行 ${k}）` : '' }));
      r.tried = tried; return r;
    } catch (e) {
      if (signal && signal.aborted) throw new Error('キャンセルしました');
      if (e && e.jzFatal) throw e;
      tried.push(`${vc.label}/${vc.hw}: ${e && e.message ? e.message : e}`);
      console.warn('WebM alpha export attempt failed', vc.codec, vc.hw, e);
    }
  }
  const err = new Error('WebM を書き出せませんでした。' + (file ? '' : '「大きな動画用（ファイルに直接保存）」か、') + '解像度・fps・画質を下げて試してください。詳細：' + tried.join(' ／ '));
  err.detail = tried; throw err;
};

async function encodeWebMAlpha({ plan, project, audio, onProgress, signal, range, file, w, h, vc, note }) {
  const span = J.exportSpan(plan, range);
  const fps = plan.fps;
  let ac = null, audioPackets = [], opusDesc = null, audioChn = 0;
  if (audio && audio.buffer && project.includeAudio !== false) ac = await J.pickAlphaAudioCodec(48000, Math.min(2, audio.buffer.numberOfChannels));
  if (ac) {
    onProgress && onProgress(0.01, '音声をエンコード中');
    const rs = await resample(audio.buffer, ac.sr, span.dur, span.t0);
    audioChn = rs.numberOfChannels;
    let aEnd = 0, aErr = null;
    const aenc = new AudioEncoder({
      output: (chunk, meta) => {
        if (!opusDesc && meta && meta.decoderConfig && meta.decoderConfig.description) {
          opusDesc = new Uint8Array(meta.decoderConfig.description);
        }
        const u8 = new Uint8Array(chunk.byteLength); chunk.copyTo(u8);
        audioPackets.push({ tsMs: Math.round(chunk.timestamp / 1000), u8 });
        aEnd = Math.max(aEnd, chunk.timestamp + (chunk.duration || 0));
      },
      error: e => { aErr = e; },
    });
    aenc.configure({ codec: ac.codec, sampleRate: ac.sr, numberOfChannels: audioChn, bitrate: 192000 });
    const frames = rs.length, block = 4800;
    for (let off = 0; off < frames; off += block) {
      if (aErr) break;
      const n = Math.min(block, frames - off);
      const data = new Float32Array(n * audioChn);
      for (let c = 0; c < audioChn; c++) data.set(rs.getChannelData(c).subarray(off, off + n), c * n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: ac.sr, numberOfFrames: n, numberOfChannels: audioChn, timestamp: Math.round(off * 1e6 / ac.sr), data });
      aenc.encode(ad); ad.close();
      if (aenc.encodeQueueSize > 16) await new Promise(r => setTimeout(r, 1));
    }
    await aenc.flush(); aenc.close();
    const fatal = m => { const e = new Error(m); e.jzFatal = true; return e; };
    if (aErr) throw fatal('音声のエンコードに失敗しました: ' + (aErr.message || aErr));
    if (!audioPackets.length || aEnd < (Math.min(span.dur, audio.buffer.duration - span.t0) - 0.5) * 1e6) {
      const aChunks = audioPackets.length;
      throw fatal('音声のエンコードが途中で止まりました（' + aChunks + '）。もう一度書き出してください');
    }
  }
  const store = file ? null : new BlockStore();
  const muxer = new WebMAlphaMuxer({
    store, file, width: w, height: h, codecId: vc.webm,
    audio: ac ? { chn: audioChn, sr: ac.sr, desc: opusDesc } : null,
  });
  await muxer.init();
  let err = null, outColor = 0, outAlpha = 0, aIdx = 0;
  const cMap = new Map(), aMap = new Map(), tsQueue = [];
  const vencColor = new VideoEncoder({
    output: chunk => {
      outColor++;
      const u8 = new Uint8Array(chunk.byteLength); chunk.copyTo(u8);
      cMap.set(chunk.timestamp, { u8, key: chunk.type === 'key' });
    },
    error: e => { err = e; },
  });
  const vencAlpha = new VideoEncoder({
    output: chunk => {
      outAlpha++;
      const u8 = new Uint8Array(chunk.byteLength); chunk.copyTo(u8);
      aMap.set(chunk.timestamp, u8);
    },
    error: e => { err = e; },
  });
  const cfgColor = Object.assign({}, vc.cfg, { latencyMode: 'quality' });
  const cfgAlpha = Object.assign({}, vc.cfg, { bitrate: Math.max(500000, Math.round(vc.cfg.bitrate * 0.4)), latencyMode: 'quality' });
  vencColor.configure(cfgColor);
  vencAlpha.configure(cfgAlpha);
  const drain = async () => {
    while (tsQueue.length && cMap.has(tsQueue[0]) && aMap.has(tsQueue[0])) {
      const ts = tsQueue.shift();
      const c = cMap.get(ts), a = aMap.get(ts);
      cMap.delete(ts); aMap.delete(ts);
      const tsMs = Math.round(ts / 1000);
      while (aIdx < audioPackets.length && audioPackets[aIdx].tsMs <= tsMs) {
        await muxer.addAudio(audioPackets[aIdx].tsMs, audioPackets[aIdx].u8);
        aIdx++;
      }
      await muxer.addVideo(tsMs, c.key, c.u8, a);
    }
  };
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  const R = new J.Renderer();
  const total = Math.max(1, Math.round(span.dur * fps));
  const scale = w / plan.W;
  const ySize = w * h, uvSize = (w >> 1) * (h >> 1);
  const alphaI420 = new Uint8Array(ySize + 2 * uvSize);
  alphaI420.fill(128, ySize);
  const prevRes = J.glyphs.maxRes; J.glyphs.maxRes = h >= 1000 ? 768 : 512;
  const closeEnc = () => {
    try { if (vencColor.state !== 'closed') vencColor.close(); } catch (e) {}
    try { if (vencAlpha.state !== 'closed') vencAlpha.close(); } catch (e) {}
  };
  try {
    for (let i = 0; i < total; i++) {
      if (signal && signal.aborted) { closeEnc(); throw new Error('キャンセルしました'); }
      if (err) throw err;
      if (vencColor.state === 'closed' || vencAlpha.state === 'closed') throw new Error('エンコーダーが停止しました');
      R.frame(ctx, plan, span.t0 + i / fps, { scale, transparent: true });
      const rgba = ctx.getImageData(0, 0, w, h).data;
      for (let p = 0; p < ySize; p++) alphaI420[p] = rgba[p * 4 + 3];
      const ts = Math.round(i * 1e6 / fps), dur = Math.round(1e6 / fps);
      const isKey = i % (fps * 2) === 0;
      tsQueue.push(ts);
      const vfC = new VideoFrame(rgba, { format: 'RGBA', codedWidth: w, codedHeight: h, timestamp: ts, duration: dur });
      const vfA = new VideoFrame(alphaI420, { format: 'I420', codedWidth: w, codedHeight: h, timestamp: ts, duration: dur });
      try { vencColor.encode(vfC, { keyFrame: isKey }); vencAlpha.encode(vfA, { keyFrame: isKey }); }
      finally { vfC.close(); vfA.close(); }
      await drain();
      let spins = 0;
      while ((vencColor.encodeQueueSize > 4 || vencAlpha.encodeQueueSize > 4) && !err) {
        await new Promise(r => setTimeout(r, 2));
        if (!document.hidden && ++spins > 15000) throw new Error('エンコーダーが応答しません');
      }
      if (i === Math.min(total - 1, fps * 3) && (outColor === 0 || outAlpha === 0)) {
        await Promise.all([vencColor.flush(), vencAlpha.flush()]);
        if (!outColor || !outAlpha) throw new Error('エンコーダーが出力を返しません');
      }
      if (i % 3 === 0) { onProgress && onProgress(i / total, `フレーム ${i + 1}/${total}${note || ''}`); await new Promise(r => setTimeout(r, 0)); }
    }
    await Promise.all([vencColor.flush(), vencAlpha.flush()]);
    if (err) throw err;
    await drain();
    while (aIdx < audioPackets.length) {
      await muxer.addAudio(audioPackets[aIdx].tsMs, audioPackets[aIdx].u8);
      aIdx++;
    }
  } catch (e) { closeEnc(); throw e; }
  finally { J.glyphs.maxRes = prevRes; }
  closeEnc();
  const outFrames = Math.min(outColor, outAlpha);
  if (outFrames < total * 0.98) throw new Error(`動画のフレームが足りません（${outFrames}/${total}）`);
  onProgress && onProgress(0.995, 'ファイルを仕上げ中');
  await muxer.finalize(Math.round(span.dur * 1000));
  if (file) await file.close();
  onProgress && onProgress(1, '完了');
  const size = file ? null : store.end;
  return { blob: file ? null : store.blob('video/webm'), size, codec: vc.label + ' + Alpha' + (vc.hw === 'prefer-software' ? '（ソフトウェア）' : ''), audio: ac ? ac.mux : null, audioWanted: !!(audio && audio.buffer && project.includeAudio !== false), width: w, height: h, toFile: !!file, format: 'webm' };
}

/* ---------- PNG sequence as ZIP (store, no compression) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const ZIP_TOO_BIG = 'ZIP が大きくなりすぎます（65,535 ファイル・4GB まで）。書き出す範囲を狭めるか、解像度を下げてください';
class ZipWriter {
  constructor() { this.parts = []; this.central = []; this.offset = 0; }
  add(name, u8) {
    const nb = new TextEncoder().encode(name);
    // plain ZIP (no ZIP64): at most 65,535 files and 4 GB
    if (this.central.length / 2 >= 0xffff) throw new Error(ZIP_TOO_BIG);
    if (this.offset + 30 + nb.length + u8.length > 0xffffffff) throw new Error(ZIP_TOO_BIG);
    const crc = crc32(u8);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, u8.length, true); lh.setUint32(22, u8.length, true);
    lh.setUint16(26, nb.length, true); lh.setUint16(28, 0, true);
    this.parts.push(lh.buffer, nb, u8);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, u8.length, true); ch.setUint32(24, u8.length, true);
    ch.setUint16(28, nb.length, true); ch.setUint32(42, this.offset, true);
    this.central.push(ch.buffer, nb);
    this.offset += 30 + nb.length + u8.length;
  }
  finish() {
    const cdSize = this.central.reduce((s, p) => s + (p.byteLength ?? p.length), 0);
    const n = this.central.length / 2;
    if (this.offset + cdSize > 0xffffffff) throw new Error(ZIP_TOO_BIG);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, n, true); end.setUint16(10, n, true); end.setUint32(12, cdSize, true); end.setUint32(16, this.offset, true);
    return new Blob([...this.parts, ...this.central, end.buffer], { type: 'application/zip' });
  }
}
/* layers: transparent PNGs in two folders — back/ (background graphic + decorations behind the lyrics) and front/
   (lyrics, their decorations, ghosts, HUD). Screen effects are applied to both, so stacking front over back matches. */
J.exportPNGZip = async ({ plan, project, transparent, layers, onProgress, signal, every = 1, range }) => {
  const span = J.exportSpan(plan, range);
  const [w, h] = J.outputSize(project);
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const R = new J.Renderer();
  const fps = plan.fps, total = Math.max(1, Math.round(span.dur * fps));
  const nFiles = Math.ceil(total / every) * (layers ? 2 : 1);
  if (nFiles > 0xffff) throw new Error(ZIP_TOO_BIG);        // say so before rendering, not after an hour
  const zip = new ZipWriter();
  const scale = w / plan.W;
  for (let i = 0; i < total; i += every) {
    if (signal && signal.aborted) throw new Error('キャンセルしました');
    const name = `jizura_${String(i).padStart(5, '0')}.png`;
    for (const layer of layers ? ['back', 'front'] : [null]) {
      R.frame(ctx, plan, span.t0 + i / fps, { scale, transparent: transparent || !!layers, layer });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      zip.add((layer ? layer + '/' : '') + name, new Uint8Array(await blob.arrayBuffer()));
    }
    onProgress && onProgress(i / total, `PNG ${i + 1}/${total}`);
  }
  onProgress && onProgress(1, '完了');
  return zip.finish();
};

/* ---------- plan JSON for the After Effects panel ---------- */
/* The After Effects panel implements the original expression set. Newer pack entries are exported as their
   closest original counterpart (the browser key is kept in web* fields so nothing is lost). */
J.AE_MAP = {
  layout: { lowerThird: 'center', corners: 'mixed', staircase: 'mixed', zigzag: 'wave', arcTop: 'ring', spiral: 'ring', gridCells: 'labels', dropCap: 'mixed', justified: 'tile', frameBox: 'center', bubble: 'pill', subtitleBar: 'center', ticker: 'marquee', splitScreen: 'diag', mirror: 'stack', sideways: 'vcols', edgeFrame: 'marquee', perspective: 'stack', hanko: 'vcols', genkou: 'vcols', panels: 'diag', filmstrip: 'labels', quote: 'center', ruler: 'gloss', searchBar: 'type', chat: 'labels', notification: 'pill', ticket: 'pill',
    rain: 'tile', hanging: 'scatter', orbit: 'ring', tunnel: 'tile', wordCloud: 'scatter', bounceLine: 'mixed', elastic: 'condensed', crossBands: 'diag', stickerBomb: 'labels', neon: 'center', keycaps: 'labels', bubbles: 'scatter', slotMachine: 'labels', flipBoard: 'labels', credits: 'type', zoomRepeat: 'stack', splitHalves: 'stack', columnsBig: 'vcols', circleWords: 'ring', dotMatrix: 'type', depthStack: 'stack', typeSpecimen: 'stack', kanjiFocus: 'huge', halfVertical: 'vcols', curtain: 'center', equalizer: 'mixed', tape: 'diag' },
  enter: { riseMask: 'drop', dropMask: 'drop', slideL: 'wipe', slideR: 'wipe', slideWhole: 'stretch', flipX: 'spin', flipY: 'spin', domino: 'spin', fold: 'pop', unroll: 'wipe', strokeDraw: 'assemble', outlineFill: 'blur', splitJoin: 'slice', vSlice: 'slice', shutter: 'wipe', iris: 'zoom', diagWipe: 'wipe', blinds: 'slice', checker: 'flicker', randomOrder: 'flicker', bounceBig: 'drop', squashDrop: 'drop', rubber: 'stretch', glitchIn: 'scramble', echoIn: 'zoom', whip: 'stretch', skewIn: 'stretch', trackIn: 'blur', trackOut: 'blur', blurStagger: 'blur', fadeStagger: 'blur', waveIn: 'pop', spiralIn: 'spin', zoomOut: 'zoom', resolve: 'scramble', magnet: 'assemble', inkBleed: 'blur', neonOn: 'flicker', cursorSweep: 'type', stamp: 'zoom' },
  exit: { sinkMask: 'fall', riseOut: 'drift', slideOutL: 'stretch', slideOutR: 'stretch', flipOutX: 'shrink', flipOutY: 'fall', foldOut: 'shrink', squash: 'shrink', trackOutWide: 'blur', collapse: 'shrink', zoomThrough: 'blur', zoomFar: 'shrink', spinOut: 'scatter', twist: 'shrink', waveOut: 'scatter', blurOutStagger: 'blur', undraw: 'blur', outlineOut: 'blur', irisClose: 'shrink', diagWipeOut: 'wipe', blindsClose: 'slice', checkerOut: 'glitch', splitApart: 'slice', vSliceDrop: 'fall', melt: 'fall', dissolve: 'drift', backspace: 'wipe', scrambleOut: 'glitch', glitchDissolve: 'glitch', echoOut: 'blur', whipOut: 'stretch', gravity: 'fall', popOut: 'scatter', burn: 'drift', sweepCover: 'wipe', shatterLite: 'explode' },
  hold: { float: 'drift', sway: 'wave', pulse: 'breathe', shimmer: 'still', colorRun: 'still', rotateSlow: 'drift', trackBreathe: 'breathe', skewWobble: 'wave', beatHop: 'wave', hWave: 'wave', heartbeat: 'breathe', orbitSmall: 'jitter', jelly: 'breathe', scanBand: 'glitchtick', noiseDrift: 'drift', tilt: 'drift', zoomSlow: 'drift', stretchPulse: 'breathe', glitchJump: 'glitchtick', echoTrail: 'drift' },
  decor: { crosshair: 'brackets', cropMarks: 'brackets', reticle: 'rings', radar: 'rings', progressRing: 'rings', timecodeBar: 'barcode', rulerEdge: 'grid', dimension: 'leaders', indexNum: 'counter', dateStamp: 'barcode', qrBlock: 'barcode', glitchRects: 'bars', concentricSquares: 'shapes', triangleSpin: 'shapes', lineBurst: 'sparks', plusGrid: 'grid', guides: 'grid', waveLine: 'waveform', spiralLine: 'rings', halftonePatch: 'shapes', checkerStrip: 'stripes', beatRing: 'rings', orbitDots: 'dots', constellation: 'sparks', confetti: 'shapes', petals: 'shapes', rainStreaks: 'slash', snow: 'dots', lightLeak: 'blobs', bokeh: 'blobs', speedCorner: 'slash', risingParticles: 'sparks', twinkle: 'sparks', brushStroke: 'bars', tapePieces: 'bars', scribbleCircle: 'rings', scribbleUnder: 'slash', crossOut: 'slash', highlightMark: 'bars', heartsStars: 'shapes', watermarkKanji: 'counter', verticalStrip: 'leaders', romajiLine: 'leaders', bracketsJP: 'brackets', seal: 'shapes' },
  fx: { rgbSplit: 'chroma', smear: 'slice', vhsRoll: 'slice', trackingNoise: 'slice', waveWarp: 'slice', pixelDrift: 'slice', tileShift: 'block', gridRepeat: 'block', mirrorFlash: 'block', strobe: 'invert', blackFrame: 'invert', whiteFrame: 'flash', filmBurn: 'flash', lightSweep: 'flash', panelWipe: 'flash', zoomPunch: 'zoom', whipBlur: 'zoom', posterize: 'mosaic', hueShift: 'chroma', irisTrans: 'zoom', doors: 'slice', blindsTrans: 'slice', splitSlide: 'slice', crtOff: 'flash' },
};
// The plan goes to the After Effects panel as-is (version 2): the panel builds every key it implements and
// picks the closest counterpart itself (from the exported metadata / J.AE_MAP) for anything it lacks.
J.planForAE = (plan, project, range) => {
  const clean = JSON.parse(JSON.stringify(plan, (k, v) => (k === 'energy' || k === 'buffer' || k === 'peaks' ? undefined : v)));
  clean.version = 2;
  clean.width = J.outputSize(project)[0]; clean.height = J.outputSize(project)[1];
  clean.extra = project.extra === true; clean.wa = project.wa !== false;
  if (J.setOn) for (const s of J.SET_ORDER) clean[s] = J.setOn(project, s);
  clean.fonts = {};
  for (const [role, keys] of Object.entries(plan.style.fonts)) clean.fonts[role] = keys.map(k => J.FONTS[k] ? J.FONTS[k].label : k);
  clean.fontTable = Object.fromEntries(Object.entries(J.FONTS).map(([k, f]) => [k, { label: f.label, family: f.family.replace(/"/g, ''), weight: f.weight, kind: f.kind }]));
  // lyric language: the face each key is drawn with in the browser for this plan (the panel maps keys → AE fonts per language)
  clean.lang = plan.lang || 'ja';
  if (J.setLang && J.faceOf && clean.lang !== 'ja') {
    J.setLang(clean.lang);
    for (const k of Object.keys(clean.fontTable)) { const f = J.faceOf(k); clean.fontTable[k].langFamily = f.family.replace(/"/g, ''); clean.fontTable[k].langWeight = f.weight; }
  }
  // モーフ has no After Effects counterpart yet: build it as the closest transition (an ink-blob dissolve)
  for (const c of clean.cuts || []) if (c.morph && !c.trans) { c.trans = 'inkBlob'; c.transDur = c.morph.dur; c.transP = {}; c.webMorph = true; }
  // 行の範囲だけ: keep the cuts / events inside [t0, t1] and move them to start at 0.
  // audioOffset tells the AE panel to slide the song layer left by t0 so it stays in sync.
  if (range) {
    const sp = J.exportSpan(plan, range), t0 = sp.t0, t1 = t0 + sp.dur, eps = 1e-3;
    const sh = o => { o.start -= t0; o.end -= t0; return o; };
    clean.cuts = clean.cuts.filter(c => c.end > t0 + eps && c.start < t1 - eps).map(c => { if (c.companion) sh(c.companion); return sh(c); });
    clean.events = (clean.events || []).filter(e => e.t >= t0 - 1 && e.t < t1).map(e => Object.assign(e, { t: e.t - t0 }));
    for (const l of clean.lines || []) { sh(l); if (l.visEnd != null) l.visEnd -= t0; }   // all lines stay (cut.line indexes them)
    clean.duration = sp.dur; clean.audioOffset = t0; clean.range = { t0, t1 };
  }
  return clean;
};
})();
